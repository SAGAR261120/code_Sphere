import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-response';
import { CheckoutInput } from '@/lib/validations/order.schema';
import { OrderStatus, TransactionType, NotificationType, PaymentMethod } from '@prisma/client';

export class OrderService {
  /**
   * Checks real-time purchase eligibility, price validity, and user balance.
   */
  static async checkPurchaseEligibility(userId: string | null, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        versions: {
          where: { isCurrent: true },
          take: 1,
          include: { files: true },
        },
      },
    });

    if (!product || product.status !== 'PUBLISHED') {
      throw new ApiError(404, 'Product not found or not published for acquisition', 'PRODUCT_NOT_AVAILABLE');
    }

    const currentVersion = product.versions[0];
    if (!currentVersion) {
      throw new ApiError(400, 'Product currently has no active release version', 'NO_ACTIVE_VERSION');
    }

    if (!userId) {
      return {
        eligible: false,
        alreadyOwned: false,
        isLoggedIn: false,
        priceCoins: product.coinPrice,
        isFree: product.isFree,
        canAfford: false,
        missingCoins: product.coinPrice,
        currentBalance: 0,
        productTitle: product.title,
        version: currentVersion.version,
      };
    }

    const [wallet, existingEntitlement] = await Promise.all([
      prisma.coinWallet.findUnique({
        where: { userId },
      }),
      prisma.purchaseEntitlement.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      }),
    ]);

    const alreadyOwned = !!existingEntitlement && !existingEntitlement.isRevoked;
    const currentBalance = wallet?.availableBalance || 0;
    const coinCost = product.isFree ? 0 : product.coinPrice;
    const canAfford = currentBalance >= coinCost;
    const missingCoins = Math.max(0, coinCost - currentBalance);

    return {
      eligible: !alreadyOwned && (product.isFree || canAfford),
      alreadyOwned,
      isLoggedIn: true,
      currentBalance,
      priceCoins: coinCost,
      isFree: product.isFree,
      canAfford,
      missingCoins,
      productTitle: product.title,
      version: currentVersion.version,
      entitlement: existingEntitlement,
    };
  }

  /**
   * Executes atomic purchase transaction: debits coins, generates order snapshot,
   * creates purchase entitlement, and logs double-entry ledger transaction.
   */
  static async checkoutOrder(userId: string, input: CheckoutInput) {
    const {
      productId,
      paymentMethod = 'COINS',
      licenseType = 'COMMERCIAL',
      idempotencyKey = crypto.randomUUID(),
    } = input;

    // 1. Idempotency Check: deduplicate replay
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey },
      include: {
        items: {
          include: {
            product: true,
            version: { include: { files: true } },
            entitlement: true,
          },
        },
      },
    });

    if (existingOrder) {
      return {
        order: existingOrder,
        entitlement: existingOrder.items[0]?.entitlement || null,
        isIdempotentReplay: true,
      };
    }

    // 2. Fetch product and active release version
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        versions: {
          where: { isCurrent: true },
          take: 1,
          include: { files: true },
        },
      },
    });

    if (!product || product.status !== 'PUBLISHED') {
      throw new ApiError(404, 'Product not found or not published for acquisition', 'PRODUCT_NOT_AVAILABLE');
    }

    const currentVersion = product.versions[0];
    if (!currentVersion) {
      throw new ApiError(400, 'Product has no downloadable active release version', 'NO_ACTIVE_VERSION');
    }

    // 3. Check for existing active entitlement (Rule 4: Prevent duplicate purchases)
    const existingEntitlement = await prisma.purchaseEntitlement.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingEntitlement && !existingEntitlement.isRevoked) {
      throw new ApiError(
        400,
        'You already hold an active perpetual commercial license for this product.',
        'ALREADY_OWNED'
      );
    }

    // 4. Calculate cost
    let coinCost = 0;
    if (paymentMethod === 'COINS') {
      if (product.isFree) {
        throw new ApiError(400, 'This product is free. Please checkout with FREE payment method.', 'INVALID_PAYMENT_METHOD');
      }
      coinCost = product.coinPrice;
    } else if (paymentMethod === 'FREE') {
      if (!product.isFree) {
        throw new ApiError(400, 'This product requires CPC Coins and is not free.', 'PRODUCT_NOT_FREE');
      }
      coinCost = 0;
    }

    // 5. Atomic Checkout Transaction
    const result = await prisma.$transaction(async (tx) => {
      let balanceAfter = 0;

      // Lock wallet row if coins required
      if (coinCost > 0) {
        // Enforce row-level lock on wallet
        const [lockedWallet] = await tx.$queryRaw<Array<{ id: string; availableBalance: number }>>`
          SELECT id, "availableBalance" FROM "CoinWallet" WHERE "userId" = ${userId} FOR UPDATE
        `;

        if (!lockedWallet) {
          throw new ApiError(404, 'Wallet record not found for user', 'WALLET_NOT_FOUND');
        }

        if (lockedWallet.availableBalance < coinCost) {
          throw new ApiError(
            400,
            `Insufficient CPC Coins. Required: ${coinCost} Coins, Available: ${lockedWallet.availableBalance} Coins. Please top up your wallet.`,
            'INSUFFICIENT_BALANCE'
          );
        }

        balanceAfter = lockedWallet.availableBalance - coinCost;

        // Mutate wallet balance
        await tx.coinWallet.update({
          where: { userId },
          data: {
            availableBalance: balanceAfter,
            totalSpent: { increment: coinCost },
            version: { increment: 1 },
          },
        });

        // Record immutable PURCHASE_DEBIT in double-entry ledger
        await tx.coinTransaction.create({
          data: {
            walletId: lockedWallet.id,
            userId,
            amount: -coinCost,
            balanceAfter,
            type: TransactionType.PURCHASE_DEBIT,
            description: `Purchased: ${product.title} (${licenseType} License)`,
            idempotencyKey,
            referenceId: product.id,
            referenceType: 'Product',
          },
        });
      } else {
        const wallet = await tx.coinWallet.findUnique({ where: { userId } });
        balanceAfter = wallet?.availableBalance || 0;
      }

      // Generate unique formatted order number (e.g. CPC-202610-8921)
      const datePart = new Date().toISOString().slice(0, 7).replace('-', '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `CPC-${datePart}-${randomSuffix}`;

      // Create Order & Item records (Permanent price snapshot)
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          totalCoins: coinCost,
          totalFiatPaise: product.fiatPricePaise || 0,
          paymentMethod: paymentMethod === 'FREE' ? PaymentMethod.FREE : PaymentMethod.COINS,
          status: OrderStatus.COMPLETED,
          idempotencyKey,
          items: {
            create: {
              productId: product.id,
              versionId: currentVersion.id,
              priceCoins: coinCost,
              priceFiatPaise: product.fiatPricePaise || 0,
              licenseType,
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
              version: { include: { files: true } },
            },
          },
        },
      });

      const orderItem = order.items[0];

      // Generate unique cryptographic license key
      const slugPrefix = product.slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      const randomKey = crypto.randomBytes(4).toString('hex').toUpperCase();
      const licenseKey = `CPC-LIC-${slugPrefix}-${randomKey}-2026`;

      // Create or re-activate PurchaseEntitlement
      let entitlement;
      if (existingEntitlement && existingEntitlement.isRevoked) {
        entitlement = await tx.purchaseEntitlement.update({
          where: { id: existingEntitlement.id },
          data: {
            orderItemId: orderItem.id,
            licenseKey,
            maxDownloads: 15,
            downloadCount: 0,
            isRevoked: false,
            revocationReason: null,
            lastDownloadedAt: null,
          },
        });
      } else {
        entitlement = await tx.purchaseEntitlement.create({
          data: {
            orderItemId: orderItem.id,
            userId,
            productId: product.id,
            licenseKey,
            maxDownloads: 15,
            downloadCount: 0,
          },
        });
      }

      // Update product sales stats
      await tx.product.update({
        where: { id: product.id },
        data: {
          totalSales: { increment: 1 },
        },
      });

      // Send in-app notification
      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.PURCHASE_SUCCESS,
          title: 'Order Completed & License Issued!',
          message: `Your acquisition of "${product.title}" has been confirmed. License Key: ${licenseKey}`,
          actionUrl: '/purchases',
        },
      });

      return {
        order,
        entitlement,
        balanceAfter,
        isIdempotentReplay: false,
      };
    });

    return result;
  }

  /**
   * Retrieves paginated orders for a user with items and download file references.
   */
  static async getUserOrders(userId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isThumbnail: true }, take: 1 },
                  publisher: { include: { profile: true } },
                },
              },
              version: {
                include: { files: true },
              },
              entitlement: {
                include: {
                  downloadEvents: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                  },
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves specific order details with strict authorization.
   */
  static async getOrderById(userId: string, orderId: string, isAdmin = false) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isThumbnail: true }, take: 1 },
                publisher: { include: { profile: true } },
              },
            },
            version: {
              include: { files: true },
            },
            entitlement: {
              include: { downloadEvents: true },
            },
          },
        },
        user: {
          select: { id: true, email: true },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
    }

    if (!isAdmin && order.userId !== userId) {
      throw new ApiError(403, 'You are not authorized to view this order', 'FORBIDDEN_ORDER');
    }

    return order;
  }

  /**
   * Retrieves user's active purchased entitlements with product files and download tokens.
   */
  static async getUserEntitlements(userId: string) {
    const entitlements = await prisma.purchaseEntitlement.findMany({
      where: {
        userId,
        isRevoked: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            images: { where: { isThumbnail: true }, take: 1 },
            versions: {
              where: { isCurrent: true },
              take: 1,
              include: { files: true },
            },
          },
        },
        orderItem: {
          include: {
            order: true,
            version: { include: { files: true } },
          },
        },
      },
    });

    return entitlements;
  }

  /**
   * Processes an order refund: restores coins to wallet, logs a compensating
   * REFUND_CREDIT transaction in the ledger, revokes the entitlement, and records an audit log.
   */
  static async requestOrProcessRefund(
    userId: string,
    orderId: string,
    reason: string,
    isAdmin = false
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            entitlement: true,
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
    }

    if (!isAdmin && order.userId !== userId) {
      throw new ApiError(403, 'You do not have permission to refund this order', 'FORBIDDEN');
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new ApiError(
        400,
        `Cannot refund order in ${order.status} state. Only completed orders can be refunded.`,
        'INVALID_ORDER_STATUS'
      );
    }

    // Check policy window (48 hours for standard users)
    if (!isAdmin) {
      const orderAgeHours = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
      if (orderAgeHours > 48) {
        throw new ApiError(
          400,
          'Refund window has elapsed (refunds must be requested within 48 hours of purchase).',
          'REFUND_WINDOW_ELAPSED'
        );
      }
    }

    const refundAmount = order.totalCoins;

    return await prisma.$transaction(async (tx) => {
      // 1. Credit coins back if purchase cost coins
      let balanceAfter = 0;
      let refundTx = null;

      if (refundAmount > 0) {
        const [lockedWallet] = await tx.$queryRaw<Array<{ id: string; availableBalance: number }>>`
          SELECT id, "availableBalance" FROM "CoinWallet" WHERE "userId" = ${order.userId} FOR UPDATE
        `;

        if (!lockedWallet) {
          throw new ApiError(404, 'Wallet record not found', 'WALLET_NOT_FOUND');
        }

        balanceAfter = lockedWallet.availableBalance + refundAmount;

        // Restore available balance and reduce totalSpent
        await tx.coinWallet.update({
          where: { userId: order.userId },
          data: {
            availableBalance: balanceAfter,
            totalSpent: { decrement: refundAmount },
            version: { increment: 1 },
          },
        });

        // Record compensating REFUND_CREDIT transaction in immutable ledger
        refundTx = await tx.coinTransaction.create({
          data: {
            walletId: lockedWallet.id,
            userId: order.userId,
            amount: refundAmount,
            balanceAfter,
            type: TransactionType.REFUND_CREDIT,
            description: `Refund: Order #${order.orderNumber} - ${reason}`,
            idempotencyKey: `refund-${order.id}-${Date.now()}`,
            referenceId: order.id,
            referenceType: 'Order',
          },
        });
      }

      // 2. Mark order as REFUNDED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.REFUNDED,
        },
      });

      // 3. Revoke all associated entitlements
      for (const item of order.items) {
        if (item.entitlement) {
          await tx.purchaseEntitlement.update({
            where: { id: item.entitlement.id },
            data: {
              isRevoked: true,
              revocationReason: `Refunded: ${reason}`,
            },
          });
        }
      }

      // 4. Send notification
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: NotificationType.REFUND_PROCESSED,
          title: 'Order Refund Processed',
          message: `Order #${order.orderNumber} has been refunded. ${refundAmount > 0 ? `${refundAmount} CPC Coins were restored to your wallet.` : 'License has been cancelled.'}`,
          actionUrl: '/wallet',
        },
      });

      // 5. Create AuditLog entry
      await tx.auditLog.create({
        data: {
          adminId: userId,
          action: 'ORDER_REFUND',
          targetType: 'Order',
          targetId: order.id,
          reason: `Order #${order.orderNumber} refunded for ${refundAmount} coins. Reason: ${reason}`,
        },
      });

      return {
        order: updatedOrder,
        refundedCoins: refundAmount,
        balanceAfter,
        refundTransaction: refundTx,
      };
    });
  }
}
