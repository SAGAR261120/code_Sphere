import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  getShortlinkAdapter,
  ShortlinkProviderConfig,
  CallbackVerificationResult,
} from './shortlink-adapters';
import {
  CreateProviderInput,
  UpdateProviderInput,
  CallbackEventQueryInput,
} from '@/lib/validations/shortlink.schema';
import { ApiError } from '@/lib/api-response';

export interface ProviderSummary {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  apiKeyMasked: string | null;
  webhookSecretMasked: string | null;
  campaignId: string | null;
  permittedDomains: string[];
  verificationType: string;
  isEnabled: boolean;
  tasksCount: number;
  eventsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ShortlinkService {
  /**
   * Mask sensitive tokens for safe client presentation
   */
  private static maskSecret(secret?: string | null): string | null {
    if (!secret) return null;
    if (secret.length <= 8) return '••••••••';
    return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
  }

  /**
   * Retrieve all configured providers with sensitive keys safely masked
   */
  static async getProviders(): Promise<ProviderSummary[]> {
    const providers = await prisma.taskProvider.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tasks: true,
            events: true,
          },
        },
      },
    });

    return providers.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      baseUrl: p.baseUrl,
      apiKeyMasked: this.maskSecret(p.apiKey),
      webhookSecretMasked: this.maskSecret(p.webhookSecret),
      campaignId: p.campaignId,
      permittedDomains: p.permittedDomains,
      verificationType: p.verificationType,
      isEnabled: p.isEnabled,
      tasksCount: p._count.tasks,
      eventsCount: p._count.events,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  /**
   * Retrieve single provider by slug with full server-side config
   */
  static async getProviderBySlug(slug: string): Promise<ShortlinkProviderConfig | null> {
    const p = await prisma.taskProvider.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (!p) return null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      baseUrl: p.baseUrl,
      apiKey: p.apiKey,
      webhookSecret: p.webhookSecret,
      campaignId: p.campaignId,
      permittedDomains: p.permittedDomains,
      verificationType: p.verificationType,
      config: p.config as Record<string, any> | null,
      isEnabled: p.isEnabled,
    };
  }

  /**
   * Create new shortlink task provider
   */
  static async createProvider(data: CreateProviderInput, adminId: string) {
    const existing = await prisma.taskProvider.findUnique({
      where: { slug: data.slug.toLowerCase() },
    });

    if (existing) {
      throw new ApiError(409, `Provider with slug '${data.slug}' already exists`, 'SLUG_CONFLICT');
    }

    const provider = await prisma.taskProvider.create({
      data: {
        name: data.name,
        slug: data.slug.toLowerCase(),
        baseUrl: data.baseUrl,
        apiKey: data.apiKey || null,
        webhookSecret: data.webhookSecret || null,
        campaignId: data.campaignId || null,
        permittedDomains: data.permittedDomains || [],
        verificationType: data.verificationType,
        config: data.config ? (data.config as Prisma.InputJsonValue) : Prisma.JsonNull,
        isEnabled: data.isEnabled ?? true,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'SHORTLINK_PROVIDER_CREATE',
        targetType: 'TaskProvider',
        targetId: provider.id,
        reason: `Created shortlink provider: ${provider.name} (${provider.slug})`,
        metadata: { slug: provider.slug, verificationType: provider.verificationType },
      },
    });

    return {
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      baseUrl: provider.baseUrl,
      apiKeyMasked: this.maskSecret(provider.apiKey),
      webhookSecretMasked: this.maskSecret(provider.webhookSecret),
      campaignId: provider.campaignId,
      permittedDomains: provider.permittedDomains,
      verificationType: provider.verificationType,
      isEnabled: provider.isEnabled,
    };
  }

  /**
   * Update existing shortlink provider
   */
  static async updateProvider(id: string, data: UpdateProviderInput, adminId: string) {
    const provider = await prisma.taskProvider.findUnique({ where: { id } });
    if (!provider) {
      throw new ApiError(404, 'Provider not found', 'PROVIDER_NOT_FOUND');
    }

    const updated = await prisma.taskProvider.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.baseUrl && { baseUrl: data.baseUrl }),
        ...(data.apiKey !== undefined && { apiKey: data.apiKey }),
        ...(data.webhookSecret !== undefined && { webhookSecret: data.webhookSecret }),
        ...(data.campaignId !== undefined && { campaignId: data.campaignId }),
        ...(data.permittedDomains && { permittedDomains: data.permittedDomains }),
        ...(data.verificationType && { verificationType: data.verificationType }),
        ...(data.config !== undefined && {
          config: data.config ? (data.config as Prisma.InputJsonValue) : Prisma.JsonNull,
        }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'SHORTLINK_PROVIDER_UPDATE',
        targetType: 'TaskProvider',
        targetId: id,
        reason: `Updated shortlink provider: ${updated.name}`,
        metadata: { slug: updated.slug, changes: Object.keys(data) },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      baseUrl: updated.baseUrl,
      apiKeyMasked: this.maskSecret(updated.apiKey),
      webhookSecretMasked: this.maskSecret(updated.webhookSecret),
      campaignId: updated.campaignId,
      permittedDomains: updated.permittedDomains,
      verificationType: updated.verificationType,
      isEnabled: updated.isEnabled,
    };
  }

  /**
   * Toggle provider enabled state
   */
  static async toggleProvider(id: string, adminId: string) {
    const provider = await prisma.taskProvider.findUnique({ where: { id } });
    if (!provider) {
      throw new ApiError(404, 'Provider not found', 'PROVIDER_NOT_FOUND');
    }

    const updated = await prisma.taskProvider.update({
      where: { id },
      data: { isEnabled: !provider.isEnabled },
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'SHORTLINK_PROVIDER_TOGGLE',
        targetType: 'TaskProvider',
        targetId: id,
        reason: `Toggled shortlink provider ${updated.name} to ${updated.isEnabled ? 'ENABLED' : 'DISABLED'}`,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      isEnabled: updated.isEnabled,
    };
  }

  /**
   * Initiate Shortlink Task Session:
   * 1. Validates task availability and user cooldowns.
   * 2. Creates unpredictable cryptographically signed session token.
   * 3. Dispatches URL generation to provider adapter.
   * 4. Stores attempt with short link.
   */
  static async startShortlinkSession(
    taskId: string,
    userId: string,
    clientIp?: string,
    userAgent?: string,
    hostUrl = 'http://localhost:3000'
  ) {
    const task = await prisma.rewardTask.findUnique({
      where: { id: taskId },
      include: {
        budget: true,
        rules: true,
        provider: true,
      },
    });

    if (!task) {
      throw new ApiError(404, 'Reward task not found', 'TASK_NOT_FOUND');
    }

    if (!task.isActive) {
      throw new ApiError(400, 'This task is currently inactive', 'TASK_INACTIVE');
    }

    if (task.budget && task.budget.isExhausted) {
      throw new ApiError(400, 'Task reward budget has been exhausted', 'BUDGET_EXHAUSTED');
    }

    if (task.provider && !task.provider.isEnabled) {
      throw new ApiError(400, 'The short-link provider for this task is currently disabled', 'PROVIDER_DISABLED');
    }

    // Cooldown check (Rule 6: server is source of truth)
    const latestAttempt = await prisma.taskAttempt.findFirst({
      where: {
        userId,
        taskId: task.id,
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
    });

    if (latestAttempt && latestAttempt.completedAt) {
      const cooldownMs = task.cooldownHours * 60 * 60 * 1000;
      const elapsedMs = Date.now() - latestAttempt.completedAt.getTime();
      if (elapsedMs < cooldownMs) {
        const nextEligibleAt = new Date(latestAttempt.completedAt.getTime() + cooldownMs);
        throw new ApiError(400, 'Task cooldown in effect', 'COOLDOWN_ACTIVE', {
          nextEligibleAt: nextEligibleAt.toISOString(),
          cooldownHours: task.cooldownHours,
        });
      }
    }

    // Cryptographically unpredictable 64-character token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const attempt = await prisma.taskAttempt.create({
      data: {
        taskId: task.id,
        userId,
        sessionToken,
        status: 'STARTED',
        clientIp: clientIp || null,
        userAgent: userAgent ? userAgent.slice(0, 500) : null,
      },
    });

    // Generate short-link using provider adapter
    const providerConfig: ShortlinkProviderConfig = task.provider
      ? {
          id: task.provider.id,
          name: task.provider.name,
          slug: task.provider.slug,
          baseUrl: task.provider.baseUrl,
          apiKey: task.provider.apiKey,
          webhookSecret: task.provider.webhookSecret,
          campaignId: task.provider.campaignId,
          permittedDomains: task.provider.permittedDomains,
          verificationType: task.provider.verificationType,
          config: task.provider.config as Record<string, any> | null,
          isEnabled: task.provider.isEnabled,
        }
      : {
          id: 'internal',
          name: 'Direct Link',
          slug: 'signed-postback',
          baseUrl: hostUrl,
          permittedDomains: [],
          verificationType: 'SIGNED_POSTBACK',
          isEnabled: true,
        };

    const adapter = getShortlinkAdapter(providerConfig.slug);
    const returnUrl = `${hostUrl.replace(/\/$/, '')}/tasks/return?attemptId=${attempt.id}`;

    const shortUrl = await adapter.generateShortUrl(
      {
        attemptId: attempt.id,
        sessionToken,
        targetUrl: task.targetUrl || returnUrl,
        userId,
        returnUrl,
        taskSlug: task.slug,
      },
      providerConfig
    );

    // Save generated URL
    await prisma.taskAttempt.update({
      where: { id: attempt.id },
      data: { shortUrl },
    });

    return {
      attemptId: attempt.id,
      sessionToken,
      shortUrl,
      providerName: providerConfig.name,
      providerSlug: providerConfig.slug,
      verificationType: providerConfig.verificationType,
      supportsAutomaticVerification: adapter.supportsAutomaticVerification,
      requiredDurationSeconds: task.requiredDurationSeconds,
      rewardCoins: task.rewardCoins,
    };
  }

  /**
   * Process incoming postback/callback from provider
   * Strictly enforces cryptographic signature, replay defense, and idempotency
   */
  static async processCallback(
    providerSlug: string,
    payload: Record<string, any>,
    headers: Record<string, string>,
    clientIp?: string
  ) {
    const normalizedSlug = providerSlug.toLowerCase().trim();
    const provider = await prisma.taskProvider.findUnique({
      where: { slug: normalizedSlug },
    });

    if (!provider) {
      await prisma.taskCallbackEvent.create({
        data: {
          providerSlug: normalizedSlug,
          clientIp,
          verificationResult: 'REJECTED',
          rejectionReason: `Provider '${normalizedSlug}' is not registered`,
          rewardStatus: 'FAILED',
          metadata: { payloadSnippet: Object.keys(payload) },
        },
      });
      throw new ApiError(404, `Provider '${normalizedSlug}' not found`, 'PROVIDER_NOT_FOUND');
    }

    if (!provider.isEnabled) {
      await prisma.taskCallbackEvent.create({
        data: {
          providerId: provider.id,
          providerSlug: normalizedSlug,
          clientIp,
          verificationResult: 'REJECTED',
          rejectionReason: `Provider '${provider.name}' is currently disabled`,
          rewardStatus: 'FAILED',
        },
      });
      throw new ApiError(403, `Provider '${provider.name}' is currently disabled`, 'PROVIDER_DISABLED');
    }

    const providerConfig: ShortlinkProviderConfig = {
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      webhookSecret: provider.webhookSecret,
      campaignId: provider.campaignId,
      permittedDomains: provider.permittedDomains,
      verificationType: provider.verificationType,
      config: provider.config as Record<string, any> | null,
      isEnabled: provider.isEnabled,
    };

    const adapter = getShortlinkAdapter(provider.slug);
    const verification: CallbackVerificationResult = await adapter.verifyCallback(
      payload,
      headers,
      providerConfig
    );

    // If verification failed (invalid signature, malformed, expired, or unsupported)
    if (!verification.isValid) {
      await prisma.taskCallbackEvent.create({
        data: {
          providerId: provider.id,
          providerSlug: normalizedSlug,
          providerEventId: verification.providerEventId || null,
          attemptId: verification.attemptId || null,
          clientIp,
          signature: headers['x-signature'] || payload.signature || null,
          verificationResult: verification.verificationResult,
          rejectionReason: verification.rejectionReason,
          rewardStatus: verification.rewardStatus,
          metadata: verification.sanitizedMetadata,
        },
      });

      // If provider requires manual review (e.g. GPLinks), update attempt status to PENDING_VERIFICATION
      if (verification.rewardStatus === 'PENDING_REVIEW' && verification.attemptId) {
        await prisma.taskAttempt
          .update({
            where: { id: verification.attemptId },
            data: { status: 'PENDING_VERIFICATION' },
          })
          .catch(() => null);
      }

      return {
        processed: false,
        verificationResult: verification.verificationResult,
        reason: verification.rejectionReason,
        rewardStatus: verification.rewardStatus,
      };
    }

    // Attempt identifier must exist on valid verifications
    const attemptId = verification.attemptId!;
    const attempt = await prisma.taskAttempt.findUnique({
      where: { id: attemptId },
      include: {
        task: {
          include: { budget: true },
        },
        user: {
          include: { wallet: true },
        },
      },
    });

    if (!attempt) {
      await prisma.taskCallbackEvent.create({
        data: {
          providerId: provider.id,
          providerSlug: normalizedSlug,
          providerEventId: verification.providerEventId || null,
          attemptId,
          clientIp,
          verificationResult: 'REJECTED',
          rejectionReason: `Attempt '${attemptId}' not found`,
          rewardStatus: 'FAILED',
          metadata: verification.sanitizedMetadata,
        },
      });
      throw new ApiError(404, 'Task attempt not found', 'ATTEMPT_NOT_FOUND');
    }

    // Idempotency: Already completed attempts cannot be double-credited
    if (attempt.status === 'COMPLETED') {
      await prisma.taskCallbackEvent.create({
        data: {
          providerId: provider.id,
          providerSlug: normalizedSlug,
          providerEventId: verification.providerEventId || null,
          attemptId: attempt.id,
          clientIp,
          verificationResult: 'DUPLICATE',
          rejectionReason: 'Attempt has already been rewarded',
          rewardStatus: 'ALREADY_COMPLETED',
          metadata: verification.sanitizedMetadata,
        },
      });
      return {
        processed: true,
        duplicate: true,
        message: 'Attempt already rewarded',
        coinsAwarded: attempt.task.rewardCoins,
      };
    }

    // Replay attack defense: Verify provider event ID has not been used previously
    const verificationRef = `${normalizedSlug}:${verification.providerEventId}`;
    const duplicateCompletion = await prisma.taskCompletion.findUnique({
      where: { verificationReference: verificationRef },
    });

    if (duplicateCompletion) {
      await prisma.taskCallbackEvent.create({
        data: {
          providerId: provider.id,
          providerSlug: normalizedSlug,
          providerEventId: verification.providerEventId,
          attemptId: attempt.id,
          clientIp,
          verificationResult: 'DUPLICATE',
          rejectionReason: `Provider event ID '${verification.providerEventId}' already processed`,
          rewardStatus: 'ALREADY_COMPLETED',
          metadata: verification.sanitizedMetadata,
        },
      });
      return {
        processed: true,
        duplicate: true,
        message: 'Provider event already processed',
      };
    }

    // Reject flagged or expired attempts
    if (attempt.status === 'FLAGGED_FRAUD' || attempt.status === 'EXPIRED') {
      await prisma.taskCallbackEvent.create({
        data: {
          providerId: provider.id,
          providerSlug: normalizedSlug,
          providerEventId: verification.providerEventId,
          attemptId: attempt.id,
          clientIp,
          verificationResult: 'REJECTED',
          rejectionReason: `Attempt is in state '${attempt.status}'`,
          rewardStatus: 'FAILED',
          metadata: verification.sanitizedMetadata,
        },
      });
      throw new ApiError(400, `Cannot reward attempt with status ${attempt.status}`, 'INVALID_ATTEMPT_STATUS');
    }

    // ATOMIC TRANSACTION (Rule 6, 8, 9): Credit coins, update ledger, complete attempt
    const rewardCoins = attempt.task.rewardCoins;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Lock user wallet with FOR UPDATE
      await tx.$queryRaw`SELECT id FROM "CoinWallet" WHERE "userId" = ${attempt.userId} FOR UPDATE`;

      const wallet = await tx.coinWallet.findUnique({
        where: { userId: attempt.userId },
      });

      if (!wallet) {
        throw new Error('User wallet not found');
      }

      // Mark attempt completed
      const updatedAttempt = await tx.taskAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          providerEventId: verification.providerEventId,
        },
      });

      // Create permanent completion
      const completion = await tx.taskCompletion.create({
        data: {
          attemptId: attempt.id,
          userId: attempt.userId,
          taskId: attempt.taskId,
          rewardCoins,
          verificationReference: verificationRef,
          completedAt: now,
        },
      });

      // Deduct spent budget
      if (attempt.task.budget) {
        const newSpent = attempt.task.budget.totalSpentCoins + rewardCoins;
        await tx.rewardBudget.update({
          where: { taskId: attempt.taskId },
          data: {
            totalSpentCoins: newSpent,
            isExhausted: newSpent >= attempt.task.budget.totalAllocatedCoins,
          },
        });
      }

      // Update wallet balances
      const updatedWallet = await tx.coinWallet.update({
        where: { userId: attempt.userId },
        data: {
          availableBalance: { increment: rewardCoins },
          totalEarned: { increment: rewardCoins },
        },
      });

      // Immutable append-only ledger transaction
      const transaction = await tx.coinTransaction.create({
        data: {
          walletId: wallet.id,
          userId: attempt.userId,
          amount: rewardCoins,
          balanceAfter: updatedWallet.availableBalance,
          type: 'TASK_REWARD',
          description: `Short-link reward: ${attempt.task.title} via ${provider.name}`,
          idempotencyKey: `shortlink-reward:${attempt.id}`,
          referenceId: completion.id,
          referenceType: 'TaskCompletion',
        },
      });

      // Log successful verification callback event
      const callbackEvent = await tx.taskCallbackEvent.create({
        data: {
          providerId: provider.id,
          providerSlug: normalizedSlug,
          providerEventId: verification.providerEventId,
          attemptId: attempt.id,
          clientIp,
          signature: headers['x-signature'] || payload.signature || null,
          verificationResult: 'VERIFIED',
          rewardStatus: 'REWARDED',
          metadata: verification.sanitizedMetadata,
        },
      });

      return {
        updatedAttempt,
        completion,
        transaction,
        callbackEvent,
        availableBalance: updatedWallet.availableBalance,
      };
    });

    return {
      processed: true,
      rewarded: true,
      coinsAwarded: rewardCoins,
      newBalance: result.availableBalance,
      attemptId: attempt.id,
      completionId: result.completion.id,
    };
  }

  /**
   * Status polling endpoint for /tasks/return
   * Strictly reads state from the database; never rewards via query params
   */
  static async getAttemptStatus(attemptId: string, userId?: string) {
    const attempt = await prisma.taskAttempt.findUnique({
      where: { id: attemptId },
      include: {
        task: {
          include: {
            provider: true,
          },
        },
        completion: true,
      },
    });

    if (!attempt) {
      throw new ApiError(404, 'Attempt not found', 'ATTEMPT_NOT_FOUND');
    }

    if (userId && attempt.userId !== userId) {
      throw new ApiError(403, 'Access denied to this attempt', 'FORBIDDEN');
    }

    const isVerified = attempt.status === 'COMPLETED';
    const isPending = attempt.status === 'PENDING_VERIFICATION' || attempt.status === 'STARTED';
    const isGPLinks = attempt.task.provider?.slug === 'gplinks';
    const requiresManualReview =
      isGPLinks || attempt.task.provider?.verificationType === 'MANUAL_REVIEW';

    return {
      attemptId: attempt.id,
      status: attempt.status,
      isVerified,
      isPending,
      coinsAwarded: attempt.completion?.rewardCoins || (isVerified ? attempt.task.rewardCoins : 0),
      taskTitle: attempt.task.title,
      taskSlug: attempt.task.slug,
      providerName: attempt.task.provider?.name || 'Direct Task',
      providerSlug: attempt.task.provider?.slug || null,
      requiresManualReview,
      timeSpentSeconds: attempt.timeSpentSeconds,
      createdAt: attempt.createdAt,
      completedAt: attempt.completedAt,
    };
  }

  /**
   * Retrieve callback event logs with filtering and pagination
   */
  static async getCallbackEvents(query: CallbackEventQueryInput) {
    const { providerSlug, verificationResult, rewardStatus, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (providerSlug) {
      where.providerSlug = providerSlug.toLowerCase();
    }
    if (verificationResult) {
      where.verificationResult = verificationResult;
    }
    if (rewardStatus) {
      where.rewardStatus = rewardStatus;
    }
    if (search) {
      where.OR = [
        { attemptId: { contains: search, mode: 'insensitive' } },
        { providerEventId: { contains: search, mode: 'insensitive' } },
        { rejectionReason: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.taskCallbackEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          provider: {
            select: {
              name: true,
              slug: true,
              verificationType: true,
            },
          },
        },
      }),
      prisma.taskCallbackEvent.count({ where }),
    ]);

    return {
      events: events.map((e) => ({
        id: e.id,
        providerSlug: e.providerSlug,
        providerName: e.provider?.name || e.providerSlug,
        providerEventId: e.providerEventId,
        attemptId: e.attemptId,
        verificationResult: e.verificationResult,
        rejectionReason: e.rejectionReason,
        rewardStatus: e.rewardStatus,
        clientIp: e.clientIp,
        metadata: e.metadata,
        createdAt: e.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
