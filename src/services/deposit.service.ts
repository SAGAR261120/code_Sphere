import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-response';
import { DepositStatus, TransactionType, NotificationType } from '@prisma/client';
import { getPaymentAdapter } from './payment-adapters';

export interface CreateDepositInput {
  userId: string;
  amountFiatPaise: number; // e.g. 50000 = ₹500.00
  gateway?: string;
  idempotencyKey?: string;
}

export interface VerifyPaymentInput {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature?: string;
  rawPayload?: any;
}

export interface DepositFilterOptions {
  page?: number;
  limit?: number;
  status?: string;
  gateway?: string;
  search?: string;
}

export interface PlatformPaymentConfig {
  depositsEnabled: boolean;
  defaultGateway: string;
  minDepositPaise: number;
  maxDepositPaise: number;
  conversionRatePaise: number;
  razorpayKeyId: string;
  complianceNotice?: string;
}

export class DepositService {
  /**
   * Retrieves platform deposit configuration and settings with masked secrets.
   */
  static async getDepositConfig(): Promise<PlatformPaymentConfig> {
    const settings = await prisma.platformSetting.findMany({
      where: {
        key: {
          in: [
            'DEPOSITS_ENABLED',
            'PAYMENT_GATEWAY_DEFAULT',
            'MIN_DEPOSIT_PAISE',
            'MAX_DEPOSIT_PAISE',
            'COIN_CONVERSION_RATE_INR_PAISE',
            'RAZORPAY_KEY_ID',
            'COMPLIANCE_NOTICE',
          ],
        },
      },
    });

    const map = new Map(settings.map((s) => [s.key, s.value]));

    return {
      depositsEnabled: map.get('DEPOSITS_ENABLED') !== 'false',
      defaultGateway: map.get('PAYMENT_GATEWAY_DEFAULT') || 'RAZORPAY',
      minDepositPaise: parseInt(map.get('MIN_DEPOSIT_PAISE') || '10000', 10),
      maxDepositPaise: parseInt(map.get('MAX_DEPOSIT_PAISE') || '5000000', 10),
      conversionRatePaise: parseInt(map.get('COIN_CONVERSION_RATE_INR_PAISE') || '100', 10),
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || map.get('RAZORPAY_KEY_ID') || 'rzp_test_cpc_market',
      complianceNotice: map.get('COMPLIANCE_NOTICE') || 'Deposits enabled for verified sandbox & approved Indian payment rails.',
    };
  }

  /**
   * Updates platform deposit configuration with admin audit log.
   */
  static async updateDepositConfig(
    adminId: string,
    config: Partial<PlatformPaymentConfig>,
    ipAddress?: string
  ) {
    const updates: Array<{ key: string; value: string; description: string }> = [];

    if (config.depositsEnabled !== undefined) {
      updates.push({
        key: 'DEPOSITS_ENABLED',
        value: config.depositsEnabled.toString(),
        description: 'Master switch enabling or disabling fiat deposits platform-wide',
      });
    }
    if (config.defaultGateway !== undefined) {
      updates.push({
        key: 'PAYMENT_GATEWAY_DEFAULT',
        value: config.defaultGateway,
        description: 'Primary active payment provider gateway adapter',
      });
    }
    if (config.minDepositPaise !== undefined) {
      updates.push({
        key: 'MIN_DEPOSIT_PAISE',
        value: config.minDepositPaise.toString(),
        description: 'Minimum deposit allowed in paise (10000 = ₹100.00)',
      });
    }
    if (config.maxDepositPaise !== undefined) {
      updates.push({
        key: 'MAX_DEPOSIT_PAISE',
        value: config.maxDepositPaise.toString(),
        description: 'Maximum deposit allowed per transaction in paise',
      });
    }
    if (config.conversionRatePaise !== undefined) {
      updates.push({
        key: 'COIN_CONVERSION_RATE_INR_PAISE',
        value: config.conversionRatePaise.toString(),
        description: 'Number of paise required for 1 CPC Coin (100 = ₹1.00)',
      });
    }
    if (config.razorpayKeyId !== undefined) {
      updates.push({
        key: 'RAZORPAY_KEY_ID',
        value: config.razorpayKeyId,
        description: 'Public Razorpay Key ID for client-side checkout',
      });
    }
    if (config.complianceNotice !== undefined) {
      updates.push({
        key: 'COMPLIANCE_NOTICE',
        value: config.complianceNotice,
        description: 'Regulatory compliance or terms notice shown on deposit modal',
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of updates) {
        await tx.platformSetting.upsert({
          where: { key: item.key },
          update: { value: item.value, description: item.description },
          create: {
            key: item.key,
            value: item.value,
            description: item.description,
            isPublic: true,
            category: 'PAYMENTS',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'PAYMENT_CONFIG_UPDATE',
          targetType: 'PlatformSetting',
          targetId: 'PAYMENTS',
          reason: 'Administrative update to payment gateway settings',
          ipAddress,
          metadata: config,
        },
      });
    });

    return await this.getDepositConfig();
  }

  /**
   * Initiates a pending deposit intent through the configured payment gateway adapter.
   */
  static async createDepositIntent(input: CreateDepositInput) {
    const config = await this.getDepositConfig();

    if (!config.depositsEnabled) {
      throw new ApiError(
        403,
        'Fiat deposits are currently disabled pending provider compliance approval.',
        'DEPOSITS_DISABLED'
      );
    }

    if (input.amountFiatPaise < config.minDepositPaise) {
      throw new ApiError(
        400,
        `Minimum deposit is ₹${(config.minDepositPaise / 100).toFixed(2)}`,
        'MINIMUM_DEPOSIT_REQUIRED'
      );
    }

    if (input.amountFiatPaise > config.maxDepositPaise) {
      throw new ApiError(
        400,
        `Maximum deposit per transaction is ₹${(config.maxDepositPaise / 100).toFixed(2)}`,
        'MAXIMUM_DEPOSIT_EXCEEDED'
      );
    }

    // Check for existing pending deposit with the same idempotency key
    if (input.idempotencyKey) {
      const existing = await prisma.deposit.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) {
        return existing;
      }
    }

    const gateway = input.gateway || config.defaultGateway;
    const adapter = getPaymentAdapter(gateway);
    const receiptId = `cpc_rcpt_${Date.now()}`;

    // Create payment order in gateway adapter
    const paymentOrder = await adapter.createOrder(input.amountFiatPaise, receiptId);

    // Calculate coins based on server-side conversion rate
    const coinsToCredit = Math.floor(input.amountFiatPaise / config.conversionRatePaise);

    const deposit = await prisma.deposit.create({
      data: {
        userId: input.userId,
        amountFiatPaise: input.amountFiatPaise,
        coinsToCredit,
        gateway: adapter.gatewayName,
        gatewayOrderId: paymentOrder.gatewayOrderId,
        status: DepositStatus.PENDING,
        idempotencyKey: input.idempotencyKey || crypto.randomUUID(),
      },
    });

    return {
      ...deposit,
      checkoutParams: {
        gatewayOrderId: paymentOrder.gatewayOrderId,
        amountFiatPaise: paymentOrder.amountFiatPaise,
        currency: paymentOrder.currency,
        keyId: paymentOrder.keyId,
        gateway: paymentOrder.gateway,
      },
    };
  }

  /**
   * Verifies payment callback or webhook and executes atomic coin credit.
   */
  static async processPaymentSuccess(input: VerifyPaymentInput) {
    // 1. Locate matching deposit
    const deposit = await prisma.deposit.findUnique({
      where: { gatewayOrderId: input.gatewayOrderId },
      include: { user: true },
    });

    if (!deposit) {
      throw new ApiError(404, 'Deposit order not found for this gateway order ID', 'DEPOSIT_NOT_FOUND');
    }

    // 2. Idempotency defense: If already completed, return existing record without double credit
    if (deposit.status === DepositStatus.COMPLETED) {
      return { deposit, alreadyProcessed: true };
    }

    // 3. Adapter verification
    const adapter = getPaymentAdapter(deposit.gateway);
    const verification = await adapter.verifyPayment(
      input.gatewayOrderId,
      input.gatewayPaymentId,
      input.gatewaySignature
    );

    if (!verification.isVerified) {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          status: DepositStatus.FAILED,
          failureReason: verification.failureReason || 'Cryptographic signature mismatch',
        },
      });

      throw new ApiError(400, verification.failureReason || 'Invalid payment verification signature', 'INVALID_SIGNATURE');
    }

    // 4. Atomic balance credit & ledger transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedDeposit = await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          gatewayPaymentId: input.gatewayPaymentId,
          status: DepositStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Acquire row-level lock on user wallet
      const wallets = await tx.$queryRaw<any[]>`
        SELECT "id", "availableBalance", "totalEarned"
        FROM "CoinWallet"
        WHERE "userId" = ${deposit.userId}
        FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new ApiError(500, 'User wallet record not found for deposit credit', 'WALLET_NOT_FOUND');
      }

      const wallet = wallets[0];
      const newBalance = wallet.availableBalance + deposit.coinsToCredit;

      await tx.coinWallet.update({
        where: { userId: deposit.userId },
        data: {
          availableBalance: newBalance,
          totalEarned: { increment: deposit.coinsToCredit },
          version: { increment: 1 },
        },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          walletId: wallet.id,
          userId: deposit.userId,
          amount: deposit.coinsToCredit,
          balanceAfter: newBalance,
          type: TransactionType.DEPOSIT_CREDIT,
          description: `Deposit: credited ${deposit.coinsToCredit} CPC Coins for ₹${(deposit.amountFiatPaise / 100).toFixed(2)} via ${deposit.gateway}`,
          idempotencyKey: `dep-credit-${deposit.id}`,
          referenceId: deposit.id,
          referenceType: 'Deposit',
        },
      });

      // Create in-app notification
      await tx.notification.create({
        data: {
          userId: deposit.userId,
          type: NotificationType.DEPOSIT_COMPLETED,
          title: 'Deposit Successful',
          message: `Your payment of ₹${(deposit.amountFiatPaise / 100).toFixed(2)} was verified. ${deposit.coinsToCredit} CPC Coins have been credited to your wallet.`,
          actionUrl: '/wallet',
        },
      });

      return { deposit: updatedDeposit, transaction };
    });

    return { ...result, alreadyProcessed: false };
  }

  /**
   * Records raw webhook payload for replay defense and security auditing.
   */
  static async recordWebhookEvent(
    gateway: string,
    eventId: string,
    eventType: string,
    rawPayload: any,
    signature: string,
    errorMessage?: string
  ) {
    return prisma.paymentWebhookEvent.upsert({
      where: { eventId },
      update: {
        processed: true,
        processedAt: new Date(),
        errorMessage,
      },
      create: {
        gateway,
        eventId,
        eventType,
        rawPayload,
        signature,
        processed: true,
        processedAt: new Date(),
        errorMessage,
      },
    });
  }

  /**
   * Retrieves single deposit with receipt and user details.
   */
  static async getDepositById(depositId: string, userId?: string, isAdmin = false) {
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: {
        user: { select: { email: true } },
      },
    });

    if (!deposit) {
      throw new ApiError(404, 'Deposit record not found', 'DEPOSIT_NOT_FOUND');
    }

    if (!isAdmin && userId && deposit.userId !== userId) {
      throw new ApiError(403, 'Unauthorized access to deposit receipt', 'FORBIDDEN');
    }

    return {
      ...deposit,
      receiptNumber: `CPC-DEP-${deposit.id.slice(0, 8).toUpperCase()}`,
      fiatAmountFormatted: `₹${(deposit.amountFiatPaise / 100).toFixed(2)}`,
    };
  }

  /**
   * Retrieves user deposit history with pagination.
   */
  static async getUserDeposits(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.deposit.count({ where: { userId } }),
    ]);

    return {
      deposits: deposits.map((d) => ({
        ...d,
        receiptNumber: `CPC-DEP-${d.id.slice(0, 8).toUpperCase()}`,
        fiatAmountFormatted: `₹${(d.amountFiatPaise / 100).toFixed(2)}`,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves all deposits across marketplace for admin inspection and governance.
   */
  static async getAdminDeposits(options: DepositFilterOptions = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status && options.status !== 'ALL') {
      where.status = options.status as DepositStatus;
    }
    if (options.gateway) {
      where.gateway = options.gateway;
    }
    if (options.search) {
      where.OR = [
        { gatewayOrderId: { contains: options.search, mode: 'insensitive' } },
        { gatewayPaymentId: { contains: options.search, mode: 'insensitive' } },
        { user: { email: { contains: options.search, mode: 'insensitive' } } },
      ];
    }

    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        where,
        include: {
          user: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.deposit.count({ where }),
    ]);

    return {
      deposits: deposits.map((d) => ({
        ...d,
        receiptNumber: `CPC-DEP-${d.id.slice(0, 8).toUpperCase()}`,
        fiatAmountFormatted: `₹${(d.amountFiatPaise / 100).toFixed(2)}`,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves raw webhook events for admin security audits.
   */
  static async getAdminWebhookEvents(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      prisma.paymentWebhookEvent.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.paymentWebhookEvent.count(),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Payment Event Reconciliation Scanner: detects pending deposits and compares with webhook delivery status.
   */
  static async reconcilePaymentEvents() {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const [
      totalDeposits,
      completedCount,
      pendingCount,
      failedCount,
      stalePendingDeposits,
      recentWebhooks,
    ] = await Promise.all([
      prisma.deposit.count(),
      prisma.deposit.count({ where: { status: DepositStatus.COMPLETED } }),
      prisma.deposit.count({ where: { status: DepositStatus.PENDING } }),
      prisma.deposit.count({ where: { status: DepositStatus.FAILED } }),
      prisma.deposit.findMany({
        where: {
          status: DepositStatus.PENDING,
          createdAt: { lte: thirtyMinutesAgo },
        },
        include: { user: { select: { email: true } } },
        take: 20,
      }),
      prisma.paymentWebhookEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      summary: {
        totalDeposits,
        completedCount,
        pendingCount,
        failedCount,
        stalePendingCount: stalePendingDeposits.length,
      },
      stalePendingDeposits,
      recentWebhooks,
      scannedAt: now.toISOString(),
    };
  }
}
