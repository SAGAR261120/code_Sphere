import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-response';
import { TransactionType } from '@prisma/client';
import crypto from 'crypto';

export interface WalletFilterOptions {
  page?: number;
  limit?: number;
  type?: TransactionType;
  direction?: 'ALL' | 'CREDIT' | 'DEBIT';
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PlatformCoinConfig {
  dailyIssuanceLimit: number;
  maxWalletBalance: number;
  minDepositPaise: number;
  promoRewardLimit: number;
  coinExpiryDays: number;
  coinConversionRatePaise: number;
}

export class WalletService {
  /**
   * Retrieves the user's wallet with available, locked, and pending balances.
   */
  static async getWallet(userId: string) {
    const wallet = await prisma.coinWallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      throw new ApiError(404, 'Wallet not found for this user', 'WALLET_NOT_FOUND');
    }

    // Compute pending fiat deposit coin equivalents
    const pendingDeposits = await prisma.deposit.aggregate({
      where: {
        userId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      _sum: {
        coinsToCredit: true,
      },
    });

    const pendingBalance = pendingDeposits._sum.coinsToCredit || 0;

    return {
      id: wallet.id,
      userId: wallet.userId,
      availableBalance: wallet.availableBalance,
      lockedBalance: wallet.lockedBalance,
      pendingBalance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  /**
   * Retrieves paginated, filtered transaction history from the append-only ledger.
   */
  static async getLedger(userId: string, options: WalletFilterOptions = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (options.type) {
      where.type = options.type;
    }

    if (options.direction === 'CREDIT') {
      where.amount = { gt: 0 };
    } else if (options.direction === 'DEBIT') {
      where.amount = { lt: 0 };
    }

    if (options.search) {
      where.OR = [
        { description: { contains: options.search, mode: 'insensitive' } },
        { referenceId: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        where.createdAt.lte = new Date(options.endDate);
      }
    }

    const [entries, total] = await Promise.all([
      prisma.coinTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.coinTransaction.count({ where }),
    ]);

    return {
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single transaction by ID with reference metadata.
   */
  static async getTransactionById(userId: string, transactionId: string, isAdmin = false) {
    const transaction = await prisma.coinTransaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: true,
      },
    });

    if (!transaction) {
      throw new ApiError(404, 'Transaction record not found', 'TRANSACTION_NOT_FOUND');
    }

    if (!isAdmin && transaction.userId !== userId) {
      throw new ApiError(403, 'Unauthorized access to transaction record', 'FORBIDDEN');
    }

    // Polymorphic reference lookup
    let referenceDetails: any = null;
    if (transaction.referenceId && transaction.referenceType) {
      if (transaction.referenceType === 'Order') {
        referenceDetails = await prisma.order.findUnique({
          where: { id: transaction.referenceId },
          select: { orderNumber: true, totalCoins: true, status: true },
        });
      } else if (transaction.referenceType === 'Deposit') {
        referenceDetails = await prisma.deposit.findUnique({
          where: { id: transaction.referenceId },
          select: { amountFiatPaise: true, status: true, gateway: true },
        });
      } else if (transaction.referenceType === 'TaskCompletion' || transaction.referenceType === 'TaskAttempt') {
        referenceDetails = await prisma.taskCompletion.findFirst({
          where: {
            OR: [
              { id: transaction.referenceId },
              { attemptId: transaction.referenceId },
            ],
          },
          include: { task: { select: { title: true, slug: true } } },
        });
      }
    }

    return {
      ...transaction,
      receiptNumber: `CPC-TX-${transaction.id.slice(0, 8).toUpperCase()}`,
      referenceDetails,
    };
  }

  /**
   * Generates formatted statement for download (CSV or JSON).
   */
  static async generateStatement(
    userId: string,
    format: 'csv' | 'json' = 'csv',
    startDate?: string,
    endDate?: string,
    type?: TransactionType
  ) {
    const where: any = { userId };
    if (type) where.type = type;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const transactions = await prisma.coinTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    if (format === 'json') {
      return { format: 'json', data: transactions };
    }

    // Generate CSV format
    const headers = [
      'Transaction ID',
      'Receipt Number',
      'Timestamp (UTC)',
      'Type',
      'Direction',
      'Amount (CPC)',
      'Balance After (CPC)',
      'Description',
      'Reference Type',
      'Reference ID',
      'Idempotency Key',
    ];

    const rows = transactions.map((tx) => [
      `"${tx.id}"`,
      `"CPC-TX-${tx.id.slice(0, 8).toUpperCase()}"`,
      `"${tx.createdAt.toISOString()}"`,
      `"${tx.type}"`,
      `"${tx.amount > 0 ? 'CREDIT' : 'DEBIT'}"`,
      tx.amount,
      tx.balanceAfter,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${tx.referenceType || 'N/A'}"`,
      `"${tx.referenceId || 'N/A'}"`,
      `"${tx.idempotencyKey}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return {
      format: 'csv',
      data: csvContent,
      filename: `cpc_wallet_statement_${userId.slice(0, 8)}_${Date.now()}.csv`,
    };
  }

  /**
   * Awards coins atomically with row-level locking, append-only ledger recording, and idempotency.
   */
  static async awardCoins(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string,
    referenceType?: string,
    idempotencyKey?: string
  ) {
    if (amount <= 0 || !Number.isInteger(amount)) {
      throw new ApiError(400, 'Award amount must be a positive integer', 'INVALID_AMOUNT');
    }

    const key = idempotencyKey || crypto.randomUUID();

    // Idempotency check: if transaction with this key already executed, return it
    const existingTx = await prisma.coinTransaction.findUnique({
      where: { idempotencyKey: key },
    });
    if (existingTx) {
      return existingTx;
    }

    // Retrieve maximum wallet balance constraint
    const maxBalanceSetting = await prisma.platformSetting.findUnique({
      where: { key: 'COIN_MAX_WALLET_BALANCE' },
    });
    const maxBalance = maxBalanceSetting ? parseInt(maxBalanceSetting.value, 10) : 100000;

    return await prisma.$transaction(async (tx) => {
      // Row-level lock on wallet
      const wallets = await tx.$queryRaw<any[]>`
        SELECT "id", "availableBalance", "totalEarned", "version"
        FROM "CoinWallet"
        WHERE "userId" = ${userId}
        FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new ApiError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
      }

      const wallet = wallets[0];
      const newBalance = wallet.availableBalance + amount;

      if (newBalance > maxBalance) {
        throw new ApiError(
          400,
          `Wallet balance would exceed platform maximum limit of ${maxBalance} CPC Coins`,
          'MAX_BALANCE_EXCEEDED'
        );
      }

      await tx.coinWallet.update({
        where: { userId },
        data: {
          availableBalance: newBalance,
          totalEarned: { increment: amount },
          version: { increment: 1 },
        },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          amount,
          balanceAfter: newBalance,
          type,
          description,
          referenceId,
          referenceType,
          idempotencyKey: key,
        },
      });

      return transaction;
    });
  }

  /**
   * Debits coins atomically with row-level locking, balance verification, and append-only ledger recording.
   */
  static async spendCoins(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    referenceType?: string,
    idempotencyKey?: string
  ) {
    if (amount <= 0 || !Number.isInteger(amount)) {
      throw new ApiError(400, 'Spend amount must be a positive integer', 'INVALID_AMOUNT');
    }

    const key = idempotencyKey || crypto.randomUUID();

    // Idempotency check
    const existingTx = await prisma.coinTransaction.findUnique({
      where: { idempotencyKey: key },
    });
    if (existingTx) {
      return existingTx;
    }

    return await prisma.$transaction(async (tx) => {
      // Row-level lock on wallet preventing race conditions / double spending
      const wallets = await tx.$queryRaw<any[]>`
        SELECT "id", "availableBalance", "totalSpent", "version"
        FROM "CoinWallet"
        WHERE "userId" = ${userId}
        FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new ApiError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
      }

      const wallet = wallets[0];

      if (wallet.availableBalance < amount) {
        throw new ApiError(
          400,
          `Insufficient coin balance. Required: ${amount} Coins, Available: ${wallet.availableBalance} Coins`,
          'INSUFFICIENT_BALANCE'
        );
      }

      const newBalance = wallet.availableBalance - amount;

      await tx.coinWallet.update({
        where: { userId },
        data: {
          availableBalance: newBalance,
          totalSpent: { increment: amount },
          version: { increment: 1 },
        },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          amount: -amount,
          balanceAfter: newBalance,
          type: 'PURCHASE_DEBIT',
          description,
          referenceId,
          referenceType,
          idempotencyKey: key,
        },
      });

      return transaction;
    });
  }

  /**
   * Holds coins into escrow/lock for pending orders or processing actions.
   */
  static async holdCoins(userId: string, amount: number, referenceId?: string) {
    if (amount <= 0) {
      throw new ApiError(400, 'Hold amount must be a positive integer', 'INVALID_AMOUNT');
    }

    return await prisma.$transaction(async (tx) => {
      const wallets = await tx.$queryRaw<any[]>`
        SELECT "id", "availableBalance", "lockedBalance"
        FROM "CoinWallet"
        WHERE "userId" = ${userId}
        FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new ApiError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
      }

      const wallet = wallets[0];
      if (wallet.availableBalance < amount) {
        throw new ApiError(400, 'Insufficient available balance to place hold', 'INSUFFICIENT_BALANCE');
      }

      await tx.coinWallet.update({
        where: { userId },
        data: {
          availableBalance: { decrement: amount },
          lockedBalance: { increment: amount },
          version: { increment: 1 },
        },
      });

      return { heldAmount: amount, newAvailable: wallet.availableBalance - amount, referenceId };
    });
  }

  /**
   * Releases previously held coins back to available balance.
   */
  static async releaseHeldCoins(userId: string, amount: number, referenceId?: string) {
    return await prisma.$transaction(async (tx) => {
      const wallets = await tx.$queryRaw<any[]>`
        SELECT "id", "availableBalance", "lockedBalance"
        FROM "CoinWallet"
        WHERE "userId" = ${userId}
        FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new ApiError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
      }

      const wallet = wallets[0];
      const releaseAmount = Math.min(amount, wallet.lockedBalance);

      await tx.coinWallet.update({
        where: { userId },
        data: {
          availableBalance: { increment: releaseAmount },
          lockedBalance: { decrement: releaseAmount },
          version: { increment: 1 },
        },
      });

      return { releasedAmount: releaseAmount, referenceId };
    });
  }

  /**
   * Administrative adjustment with mandatory audit trail and negative balance prevention.
   */
  static async adminAdjustCoins(
    adminId: string,
    userId: string,
    amount: number,
    reason: string,
    idempotencyKey?: string,
    ipAddress?: string
  ) {
    if (amount === 0 || !Number.isInteger(amount)) {
      throw new ApiError(400, 'Adjustment amount must be a non-zero integer', 'INVALID_AMOUNT');
    }

    if (!reason || reason.trim().length < 5) {
      throw new ApiError(400, 'A documented audit reason of at least 5 characters is required', 'REASON_REQUIRED');
    }

    const key = idempotencyKey || crypto.randomUUID();

    const existingTx = await prisma.coinTransaction.findUnique({
      where: { idempotencyKey: key },
    });
    if (existingTx) {
      return existingTx;
    }

    return await prisma.$transaction(async (tx) => {
      const wallets = await tx.$queryRaw<any[]>`
        SELECT "id", "availableBalance", "totalEarned", "totalSpent"
        FROM "CoinWallet"
        WHERE "userId" = ${userId}
        FOR UPDATE
      `;

      if (!wallets || wallets.length === 0) {
        throw new ApiError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
      }

      const wallet = wallets[0];
      const newBalance = wallet.availableBalance + amount;
      if (newBalance < 0) {
        throw new ApiError(
          400,
          `Cannot reduce balance below zero. Current balance: ${wallet.availableBalance}, Deducting: ${Math.abs(amount)}`,
          'NEGATIVE_BALANCE_DISALLOWED'
        );
      }

      const txType: TransactionType = amount > 0 ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT';

      await tx.coinWallet.update({
        where: { userId },
        data: {
          availableBalance: newBalance,
          ...(amount > 0 ? { totalEarned: { increment: amount } } : { totalSpent: { increment: Math.abs(amount) } }),
          version: { increment: 1 },
        },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          amount,
          balanceAfter: newBalance,
          type: txType,
          description: `Admin adjustment: ${reason}`,
          referenceId: adminId,
          referenceType: 'Admin',
          idempotencyKey: key,
        },
      });

      // Immutable Audit Log
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'COIN_ADJUSTMENT',
          targetType: 'CoinWallet',
          targetId: wallet.id,
          reason,
          ipAddress,
          metadata: {
            amount,
            beforeBalance: wallet.availableBalance,
            afterBalance: newBalance,
            userId,
          },
        },
      });

      return transaction;
    });
  }

  /**
   * Reconciles a single wallet by comparing cached balance against sum of completed transactions.
   */
  static async reconcileWallet(userId: string) {
    const wallet = await prisma.coinWallet.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    });

    if (!wallet) {
      throw new ApiError(404, 'Wallet not found', 'WALLET_NOT_FOUND');
    }

    const ledgerAggregation = await prisma.coinTransaction.aggregate({
      where: { walletId: wallet.id },
      _sum: { amount: true },
      _count: { id: true },
    });

    const ledgerSum = ledgerAggregation._sum.amount || 0;
    const transactionCount = ledgerAggregation._count.id;
    const discrepancy = wallet.availableBalance - ledgerSum;
    const isConsistent = discrepancy === 0;

    return {
      walletId: wallet.id,
      userId: wallet.userId,
      userEmail: wallet.user.email,
      availableBalance: wallet.availableBalance,
      ledgerSum,
      discrepancy,
      isConsistent,
      transactionCount,
      reconciledAt: new Date().toISOString(),
    };
  }

  /**
   * System-wide reconciliation scanner: audits every wallet against its append-only ledger.
   */
  static async reconcileAllWallets() {
    const wallets = await prisma.coinWallet.findMany({
      include: {
        user: { select: { email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const results = await Promise.all(
      wallets.map(async (wallet) => {
        const ledgerAggregation = await prisma.coinTransaction.aggregate({
          where: { walletId: wallet.id },
          _sum: { amount: true },
          _count: { id: true },
        });

        const ledgerSum = ledgerAggregation._sum.amount || 0;
        const discrepancy = wallet.availableBalance - ledgerSum;
        const isConsistent = discrepancy === 0;

        return {
          walletId: wallet.id,
          userId: wallet.userId,
          userEmail: wallet.user.email,
          availableBalance: wallet.availableBalance,
          ledgerSum,
          discrepancy,
          isConsistent,
          transactionCount: ledgerAggregation._count.id,
        };
      })
    );

    const consistentCount = results.filter((r) => r.isConsistent).length;
    const discrepancyCount = results.filter((r) => !r.isConsistent).length;
    const totalCirculation = results.reduce((acc, r) => acc + r.availableBalance, 0);
    const totalLedgerSum = results.reduce((acc, r) => acc + r.ledgerSum, 0);

    return {
      totalWallets: wallets.length,
      consistentCount,
      discrepancyCount,
      totalCirculation,
      totalLedgerSum,
      systemConsistent: discrepancyCount === 0,
      scannedAt: new Date().toISOString(),
      discrepancies: results.filter((r) => !r.isConsistent),
      wallets: results,
    };
  }

  /**
   * Administrative repair tool: resolves a ledger-balance discrepancy by creating an audited compensating entry.
   */
  static async repairWalletDiscrepancy(
    adminId: string,
    userId: string,
    reason: string,
    ipAddress?: string
  ) {
    const status = await this.reconcileWallet(userId);
    if (status.isConsistent) {
      return {
        repaired: false,
        message: 'Wallet is already fully consistent with append-only ledger',
        status,
      };
    }

    const delta = status.discrepancy;

    return await prisma.$transaction(async (tx) => {
      // Invariant: If availableBalance > ledgerSum, ledger is missing 'delta' coins.
      // We create an audited compensating ledger transaction so sum matches availableBalance.
      const txType: TransactionType = delta > 0 ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT';
      const key = `reconcile-${userId}-${Date.now()}`;

      const compensatingTx = await tx.coinTransaction.create({
        data: {
          walletId: status.walletId,
          userId,
          amount: delta,
          balanceAfter: status.availableBalance,
          type: txType,
          description: `Reconciliation Compensating Entry: ${reason}`,
          referenceId: adminId,
          referenceType: 'AuditReconciliation',
          idempotencyKey: key,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'WALLET_RECONCILIATION_REPAIR',
          targetType: 'CoinWallet',
          targetId: status.walletId,
          reason,
          ipAddress,
          metadata: {
            delta,
            walletAvailable: status.availableBalance,
            previousLedgerSum: status.ledgerSum,
            newLedgerSum: status.ledgerSum + delta,
            transactionId: compensatingTx.id,
          },
        },
      });

      return {
        repaired: true,
        message: `Compensating ledger entry created for ${delta > 0 ? '+' : ''}${delta} CPC Coins`,
        compensatingTransaction: compensatingTx,
      };
    });
  }

  /**
   * Administrative economy overview metrics: minting, redemptions, volume, liabilities, and fraud detection.
   */
  static async getEconomyOverview() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalWallets,
      walletsAggregate,
      txTotals,
      tx24h,
      tx7d,
      txByType,
      recentLargeAdjustments,
      unreconciledData,
    ] = await Promise.all([
      prisma.coinWallet.count(),
      prisma.coinWallet.aggregate({
        _sum: {
          availableBalance: true,
          lockedBalance: true,
          totalEarned: true,
          totalSpent: true,
        },
      }),
      prisma.coinTransaction.aggregate({
        _count: { id: true },
      }),
      prisma.coinTransaction.aggregate({
        where: { createdAt: { gte: twentyFourHoursAgo } },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.coinTransaction.aggregate({
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: { id: true },
      }),
      prisma.coinTransaction.groupBy({
        by: ['type'],
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.coinTransaction.findMany({
        where: {
          type: { in: ['ADMIN_CREDIT', 'ADMIN_DEBIT'] },
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { email: true } } },
      }),
      this.reconcileAllWallets(),
    ]);

    const totalCirculation = walletsAggregate._sum.availableBalance || 0;
    const totalHeld = walletsAggregate._sum.lockedBalance || 0;
    const lifetimeEarned = walletsAggregate._sum.totalEarned || 0;
    const lifetimeSpent = walletsAggregate._sum.totalSpent || 0;

    return {
      metrics: {
        totalWallets,
        totalCirculation,
        totalHeld,
        totalLiabilities: totalCirculation + totalHeld,
        lifetimeEarned,
        lifetimeSpent,
        totalTransactionsCount: txTotals._count.id,
        volume24h: tx24h._sum.amount || 0,
        txCount24h: tx24h._count.id,
        txCount7d: tx7d._count.id,
      },
      distributionByType: txByType.map((item) => ({
        type: item.type,
        count: item._count.id,
        netAmount: item._sum.amount || 0,
      })),
      auditSummary: {
        consistentWallets: unreconciledData.consistentCount,
        discrepancyWallets: unreconciledData.discrepancyCount,
        isSystemSound: unreconciledData.systemConsistent,
      },
      recentLargeAdjustments,
      suspiciousIndicators: {
        unreconciledCount: unreconciledData.discrepancyCount,
        discrepancies: unreconciledData.discrepancies,
      },
    };
  }

  /**
   * Retrieves platform coin policies and configurations.
   */
  static async getPlatformCoinConfig(): Promise<PlatformCoinConfig> {
    const settings = await prisma.platformSetting.findMany({
      where: {
        key: {
          in: [
            'COIN_DAILY_ISSUANCE_LIMIT',
            'COIN_MAX_WALLET_BALANCE',
            'MIN_DEPOSIT_PAISE',
            'MAX_TASK_REWARD_DAILY',
            'COIN_CONVERSION_RATE_INR_PAISE',
            'COIN_EXPIRY_DAYS',
          ],
        },
      },
    });

    const map = new Map(settings.map((s) => [s.key, s.value]));

    return {
      dailyIssuanceLimit: parseInt(map.get('COIN_DAILY_ISSUANCE_LIMIT') || '50000', 10),
      maxWalletBalance: parseInt(map.get('COIN_MAX_WALLET_BALANCE') || '100000', 10),
      minDepositPaise: parseInt(map.get('MIN_DEPOSIT_PAISE') || '10000', 10),
      promoRewardLimit: parseInt(map.get('MAX_TASK_REWARD_DAILY') || '300', 10),
      coinExpiryDays: parseInt(map.get('COIN_EXPIRY_DAYS') || '0', 10),
      coinConversionRatePaise: parseInt(map.get('COIN_CONVERSION_RATE_INR_PAISE') || '100', 10),
    };
  }

  /**
   * Updates platform coin configuration with admin audit log.
   */
  static async updatePlatformCoinConfig(
    adminId: string,
    config: Partial<PlatformCoinConfig>,
    ipAddress?: string
  ) {
    const updates: Array<{ key: string; value: string; description: string }> = [];

    if (config.dailyIssuanceLimit !== undefined) {
      updates.push({
        key: 'COIN_DAILY_ISSUANCE_LIMIT',
        value: config.dailyIssuanceLimit.toString(),
        description: 'Maximum platform-wide daily coin issuance limit',
      });
    }
    if (config.maxWalletBalance !== undefined) {
      updates.push({
        key: 'COIN_MAX_WALLET_BALANCE',
        value: config.maxWalletBalance.toString(),
        description: 'Maximum allowed coin balance per individual user wallet',
      });
    }
    if (config.minDepositPaise !== undefined) {
      updates.push({
        key: 'MIN_DEPOSIT_PAISE',
        value: config.minDepositPaise.toString(),
        description: 'Minimum fiat deposit amount in paise',
      });
    }
    if (config.promoRewardLimit !== undefined) {
      updates.push({
        key: 'MAX_TASK_REWARD_DAILY',
        value: config.promoRewardLimit.toString(),
        description: 'Maximum promotional coins awarded per 24 hour interval',
      });
    }
    if (config.coinExpiryDays !== undefined) {
      updates.push({
        key: 'COIN_EXPIRY_DAYS',
        value: config.coinExpiryDays.toString(),
        description: 'Days before promotional coins expire (0 for never)',
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
            category: 'COIN_ECONOMY',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'COIN_CONFIG_UPDATE',
          targetType: 'PlatformSetting',
          targetId: 'COIN_ECONOMY',
          reason: 'Administrative update to coin economy settings',
          ipAddress,
          metadata: config,
        },
      });
    });

    return await this.getPlatformCoinConfig();
  }

  /**
   * Generates a downloadable CSV statement of all user transactions.
   */
  static async generateCsvStatement(userId: string): Promise<string> {
    const transactions = await prisma.coinTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'Transaction ID,Date,Type,Amount,Balance After,Description\n';
    const rows = transactions
      .map(
        (tx) =>
          `"${tx.id}","${tx.createdAt.toISOString()}","${tx.type}",${tx.amount},${tx.balanceAfter},"${(tx.description || '').replace(/"/g, '""')}"`
      )
      .join('\n');

    return header + rows;
  }
}
