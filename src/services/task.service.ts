import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-response';
import {
  CreateTaskInput,
  UpdateTaskInput,
  AdminTaskQueryInput,
} from '@/lib/validations/task.schema';
import { TransactionType, NotificationType, TaskType, VerificationMethod } from '@prisma/client';
import crypto from 'crypto';

export class TaskService {
  /**
   * Retrieves comprehensive Earn Dashboard payload including tasks,
   * live user cooldown states, today's earnings, and completion history.
   */
  static async getEarnDashboardData(userId: string | null) {
    const now = new Date();
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

    // 1. Fetch all active tasks with media and budget
    const tasks = await prisma.rewardTask.findMany({
      where: { isActive: true },
      include: {
        budget: true,
        rules: true,
        media: { orderBy: { displayOrder: 'asc' } },
        _count: {
          select: { completions: true },
        },
      },
      orderBy: [{ rewardCoins: 'desc' }, { createdAt: 'desc' }],
    });

    if (!userId) {
      // Guest view
      const guestTasks = tasks.map((task) => ({
        ...task,
        isEligible: true,
        cooldownRemainingSeconds: 0,
        nextEligibleAt: null,
        remainingDailyAttempts: task.rules[0]?.maxDailyCompletions || 1,
        userCompletedToday: false,
        activeAttempt: null,
      }));

      const totalRewardAvailable = tasks.reduce((sum, t) => sum + t.rewardCoins, 0);

      return {
        tasks: guestTasks,
        userStats: {
          currentBalance: 0,
          earnedToday: 0,
          pendingRewards: 0,
          availableTodayCoins: totalRewardAvailable,
          activeStreakDays: 0,
          completedCountToday: 0,
        },
        recentHistory: [],
      };
    }

    // 2. Fetch user's completions and active attempts in parallel
    const [userCompletions, recentAttempts, userWallet] = await Promise.all([
      prisma.taskCompletion.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        include: { task: true },
      }),
      prisma.taskAttempt.findMany({
        where: {
          userId,
          status: { in: ['STARTED', 'PENDING_VERIFICATION'] },
          createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }, // active within last 30m
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coinWallet.findUnique({
        where: { userId },
      }),
    ]);

    // 3. Calculate today's earnings and counts
    const todayCompletions = userCompletions.filter(
      (c) => new Date(c.completedAt) >= todayMidnight
    );
    const earnedToday = todayCompletions.reduce((sum, c) => sum + c.rewardCoins, 0);
    const completedCountToday = todayCompletions.length;

    // 4. Calculate pending verification rewards
    const pendingRewards = recentAttempts.reduce((sum, att) => {
      const task = tasks.find((t) => t.id === att.taskId);
      return sum + (task?.rewardCoins || 0);
    }, 0);

    // 5. Calculate streak (consecutive active days)
    const uniqueDays = new Set(
      userCompletions.map((c) => new Date(c.completedAt).toISOString().slice(0, 10))
    );
    let streakDays = 0;
    let checkDate = new Date();
    while (true) {
      const dayStr = checkDate.toISOString().slice(0, 10);
      if (uniqueDays.has(dayStr)) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (streakDays === 0) {
        // Allow streak check starting from yesterday if haven't completed today yet
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = checkDate.toISOString().slice(0, 10);
        if (uniqueDays.has(yesterdayStr)) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // 6. Map each task with detailed user eligibility & cooldown metrics
    const nowMs = Date.now();
    let totalAvailableTodayCoins = 0;

    const mappedTasks = tasks.map((task) => {
      const rule = task.rules[0];
      const maxDaily = rule?.maxDailyCompletions || 1;

      // Find user completions for this specific task
      const taskCompletions = userCompletions.filter((c) => c.taskId === task.id);
      const taskCompletionsToday = taskCompletions.filter(
        (c) => new Date(c.completedAt) >= todayMidnight
      );
      const latestCompletion = taskCompletions[0];

      let isEligible = true;
      let cooldownRemainingSeconds = 0;
      let nextEligibleAt: Date | null = null;
      let reason: string | null = null;

      // Check global budget
      if (task.budget?.isExhausted) {
        isEligible = false;
        reason = 'Global reward budget exhausted';
      }

      // Check daily limit
      if (taskCompletionsToday.length >= maxDaily) {
        isEligible = false;
        reason = `Daily limit reached (${maxDaily}/${maxDaily} completed today)`;
        // Eligible again at next UTC midnight
        const tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);
        nextEligibleAt = tomorrowMidnight;
        cooldownRemainingSeconds = Math.max(0, Math.ceil((tomorrowMidnight.getTime() - nowMs) / 1000));
      }

      // Check cooldown interval
      if (latestCompletion && isEligible) {
        const cooldownMs = task.cooldownHours * 60 * 60 * 1000;
        const timeSince = nowMs - new Date(latestCompletion.completedAt).getTime();

        if (timeSince < cooldownMs) {
          isEligible = false;
          cooldownRemainingSeconds = Math.ceil((cooldownMs - timeSince) / 1000);
          nextEligibleAt = new Date(nowMs + cooldownRemainingSeconds * 1000);
          reason = `In cooldown. Available in ${Math.ceil(cooldownRemainingSeconds / 60)} minutes`;
        }
      }

      // Check active attempt in progress
      const activeAttempt = recentAttempts.find((a) => a.taskId === task.id) || null;

      const remainingDailyAttempts = Math.max(0, maxDaily - taskCompletionsToday.length);

      if (isEligible) {
        totalAvailableTodayCoins += task.rewardCoins;
      }

      return {
        ...task,
        isEligible,
        cooldownRemainingSeconds,
        nextEligibleAt,
        remainingDailyAttempts,
        userCompletedToday: taskCompletionsToday.length > 0,
        ineligibilityReason: reason,
        activeAttempt: activeAttempt
          ? {
              attemptId: activeAttempt.id,
              sessionToken: activeAttempt.sessionToken,
              createdAt: activeAttempt.createdAt,
              requiredDurationSeconds: task.requiredDurationSeconds,
            }
          : null,
      };
    });

    // 7. Recent history format
    const recentHistory = userCompletions.slice(0, 10).map((c) => ({
      id: c.id,
      taskId: c.taskId,
      taskTitle: c.task?.title || 'Daily Developer Task',
      taskType: c.task?.taskType || 'VISIT',
      rewardCoins: c.rewardCoins,
      completedAt: c.completedAt,
      verificationReference: c.verificationReference,
    }));

    return {
      tasks: mappedTasks,
      userStats: {
        currentBalance: userWallet?.availableBalance || 0,
        earnedToday,
        pendingRewards,
        availableTodayCoins: totalAvailableTodayCoins,
        activeStreakDays: streakDays,
        completedCountToday,
      },
      recentHistory,
    };
  }

  /**
   * Retrieves single task details by slug with active user attempt status.
   */
  static async getTaskBySlug(slugOrId: string, userId: string | null) {
    const task = await prisma.rewardTask.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: {
        budget: true,
        rules: true,
        provider: true,
        media: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { completions: true, attempts: true } },
      },
    });

    if (!task) {
      throw new ApiError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    if (!userId) {
      return {
        ...task,
        isEligible: task.isActive && !task.budget?.isExhausted,
        cooldownRemainingSeconds: 0,
        nextEligibleAt: null,
        remainingDailyAttempts: task.rules[0]?.maxDailyCompletions || 1,
        activeAttempt: null,
      };
    }

    const now = Date.now();
    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);

    const [userCompletions, activeAttempt] = await Promise.all([
      prisma.taskCompletion.findMany({
        where: { userId, taskId: task.id },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.taskAttempt.findFirst({
        where: {
          userId,
          taskId: task.id,
          status: { in: ['STARTED', 'PENDING_VERIFICATION'] },
          createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const maxDaily = task.rules[0]?.maxDailyCompletions || 1;
    const completionsToday = userCompletions.filter(
      (c) => new Date(c.completedAt) >= todayMidnight
    );
    const latestCompletion = userCompletions[0];

    let isEligible = task.isActive;
    let cooldownRemainingSeconds = 0;
    let nextEligibleAt: Date | null = null;
    let ineligibilityReason: string | null = null;

    if (task.budget?.isExhausted) {
      isEligible = false;
      ineligibilityReason = 'Global reward budget exhausted';
    } else if (completionsToday.length >= maxDaily) {
      isEligible = false;
      ineligibilityReason = `Daily completion limit reached (${maxDaily}/${maxDaily})`;
      const tomorrow = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);
      nextEligibleAt = tomorrow;
      cooldownRemainingSeconds = Math.max(0, Math.ceil((tomorrow.getTime() - now) / 1000));
    } else if (latestCompletion) {
      const cooldownMs = task.cooldownHours * 60 * 60 * 1000;
      const elapsed = now - new Date(latestCompletion.completedAt).getTime();
      if (elapsed < cooldownMs) {
        isEligible = false;
        cooldownRemainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
        nextEligibleAt = new Date(now + cooldownRemainingSeconds * 1000);
        ineligibilityReason = `In cooldown for ${Math.ceil(cooldownRemainingSeconds / 60)} minutes`;
      }
    }

    return {
      ...task,
      isEligible,
      cooldownRemainingSeconds,
      nextEligibleAt,
      remainingDailyAttempts: Math.max(0, maxDaily - completionsToday.length),
      ineligibilityReason,
      activeAttempt: activeAttempt
        ? {
            attemptId: activeAttempt.id,
            sessionToken: activeAttempt.sessionToken,
            createdAt: activeAttempt.createdAt,
            requiredDurationSeconds: task.requiredDurationSeconds,
          }
        : null,
    };
  }

  /**
   * Starts a new server-validated task attempt with unpredictable session token.
   */
  static async startTaskAttempt(
    userId: string,
    taskId: string,
    clientIp?: string,
    userAgent?: string
  ) {
    const task = await prisma.rewardTask.findUnique({
      where: { id: taskId },
      include: { budget: true, rules: true },
    });

    if (!task || !task.isActive) {
      throw new ApiError(404, 'Task not found or currently paused', 'TASK_UNAVAILABLE');
    }

    if (task.budget?.isExhausted) {
      throw new ApiError(400, 'Global reward budget for this task is exhausted', 'BUDGET_EXHAUSTED');
    }

    // Server-side daily limit check
    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);

    const maxDaily = task.rules[0]?.maxDailyCompletions || 1;
    const todayCompletionsCount = await prisma.taskCompletion.count({
      where: {
        userId,
        taskId,
        completedAt: { gte: todayMidnight },
      },
    });

    if (todayCompletionsCount >= maxDaily) {
      throw new ApiError(
        400,
        `You have already reached the daily limit (${maxDaily} times/day) for this task.`,
        'DAILY_LIMIT_REACHED'
      );
    }

    // Server-side cooldown check
    const latestCompletion = await prisma.taskCompletion.findFirst({
      where: { userId, taskId },
      orderBy: { completedAt: 'desc' },
    });

    if (latestCompletion) {
      const cooldownMs = task.cooldownHours * 60 * 60 * 1000;
      const elapsed = Date.now() - new Date(latestCompletion.completedAt).getTime();

      if (elapsed < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - elapsed) / 1000);
        throw new ApiError(
          400,
          `Task is in cooldown. Please wait ${remainingSec} seconds before starting again.`,
          'COOLDOWN_ACTIVE'
        );
      }
    }

    // Check if user already has an active pending attempt from last 15 minutes
    const existingActive = await prisma.taskAttempt.findFirst({
      where: {
        userId,
        taskId,
        status: 'STARTED',
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingActive) {
      return {
        attemptId: existingActive.id,
        sessionToken: existingActive.sessionToken,
        requiredDurationSeconds: task.requiredDurationSeconds,
        verificationMethod: task.verificationMethod,
        targetUrl: task.targetUrl,
        alreadyActive: true,
      };
    }

    // Generate unpredictable cryptographic session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const attempt = await prisma.taskAttempt.create({
      data: {
        taskId,
        userId,
        sessionToken,
        status: 'STARTED',
        clientIp: clientIp || '127.0.0.1',
        userAgent: userAgent || 'Unknown-Browser',
      },
    });

    return {
      attemptId: attempt.id,
      sessionToken,
      requiredDurationSeconds: task.requiredDurationSeconds,
      verificationMethod: task.verificationMethod,
      targetUrl: task.targetUrl,
      alreadyActive: false,
    };
  }

  /**
   * Verifies task attempt completion, enforces minimum duration anti-fraud,
   * updates task budget, and atomically credits CPC Coins to user wallet.
   */
  static async verifyTaskCompletion(
    userId: string,
    attemptId: string,
    sessionToken: string,
    callbackCode?: string
  ) {
    const attempt = await prisma.taskAttempt.findUnique({
      where: { id: attemptId },
      include: {
        task: {
          include: { budget: true },
        },
      },
    });

    if (!attempt || attempt.userId !== userId) {
      throw new ApiError(404, 'Task session attempt not found or unauthorized', 'ATTEMPT_NOT_FOUND');
    }

    if (attempt.status === 'COMPLETED') {
      throw new ApiError(
        400,
        'This task attempt has already been verified and rewarded.',
        'ALREADY_COMPLETED'
      );
    }

    if (attempt.status === 'FLAGGED_FRAUD') {
      throw new ApiError(
        403,
        'This attempt was flagged for suspicious activity (insufficient duration or validation mismatch).',
        'FRAUD_FLAGGED'
      );
    }

    // Cryptographic token comparison
    const expectedBuf = Buffer.from(attempt.sessionToken, 'utf-8');
    const providedBuf = Buffer.from(sessionToken, 'utf-8');
    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      throw new ApiError(401, 'Invalid or forged task session token', 'INVALID_SESSION_TOKEN');
    }

    // Anti-fraud: minimum duration verification
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.createdAt).getTime()) / 1000);
    const requiredSeconds = attempt.task.requiredDurationSeconds;

    if (elapsedSeconds < requiredSeconds) {
      await prisma.taskAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'FLAGGED_FRAUD',
          fraudFlags: ['INSUFFICIENT_TIME'],
          timeSpentSeconds: elapsedSeconds,
        },
      });

      throw new ApiError(
        400,
        `Minimum engagement duration of ${requiredSeconds}s was not met (Recorded: ${elapsedSeconds}s). Please follow the instructions completely.`,
        'INSUFFICIENT_TIME'
      );
    }

    const rewardCoins = attempt.task.rewardCoins;

    // Atomic completion and coin reward ledger transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Mark attempt COMPLETED
      await tx.taskAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          timeSpentSeconds: elapsedSeconds,
        },
      });

      // 2. Create TaskCompletion record (guaranteed single issuance via unique attemptId)
      const completionRef = callbackCode || `VERIFIED-${attemptId.slice(0, 8)}-${Date.now()}`;
      const completion = await tx.taskCompletion.create({
        data: {
          attemptId,
          userId,
          taskId: attempt.taskId,
          rewardCoins,
          verificationReference: completionRef,
        },
      });

      // 3. Atomically lock user's coin wallet
      const [lockedWallet] = await tx.$queryRaw<Array<{ id: string; availableBalance: number }>>`
        SELECT id, "availableBalance" FROM "CoinWallet" WHERE "userId" = ${userId} FOR UPDATE
      `;

      if (!lockedWallet) {
        throw new ApiError(404, 'User wallet not found', 'WALLET_NOT_FOUND');
      }

      const balanceAfter = lockedWallet.availableBalance + rewardCoins;

      // 4. Update wallet balance
      await tx.coinWallet.update({
        where: { userId },
        data: {
          availableBalance: balanceAfter,
          totalEarned: { increment: rewardCoins },
          version: { increment: 1 },
        },
      });

      // 5. Append-only ledger transaction (Rule 4: Double-entry record)
      const ledgerTx = await tx.coinTransaction.create({
        data: {
          walletId: lockedWallet.id,
          userId,
          amount: rewardCoins,
          balanceAfter,
          type: TransactionType.TASK_REWARD,
          description: `Daily Task Reward: ${attempt.task.title}`,
          idempotencyKey: `task-reward-${attemptId}`,
          referenceId: attemptId,
          referenceType: 'TaskAttempt',
        },
      });

      // 6. Update task budget
      if (attempt.task.budget) {
        const updatedSpent = attempt.task.budget.totalSpentCoins + rewardCoins;
        const isExhausted = updatedSpent >= attempt.task.budget.totalAllocatedCoins;

        await tx.rewardBudget.update({
          where: { taskId: attempt.taskId },
          data: {
            totalSpentCoins: updatedSpent,
            isExhausted,
          },
        });
      }

      // 7. Send in-app notification
      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.TASK_REWARD,
          title: 'CPC Coins Earned!',
          message: `+${rewardCoins} CPC Coins added to your wallet for completing "${attempt.task.title}".`,
          actionUrl: '/wallet',
        },
      });

      return {
        completion,
        rewardCoins,
        balanceAfter,
        ledgerTransaction: ledgerTx,
      };
    });
  }

  static async verifyAttempt(
    userId: string,
    attemptId: string,
    sessionToken: string,
    callbackCode?: string
  ) {
    return await this.verifyTaskCompletion(userId, attemptId, sessionToken, callbackCode);
  }

  /**
   * Retrieves paginated task completion history for a specific user.
   */
  static async getUserCompletionHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [completions, total] = await Promise.all([
      prisma.taskCompletion.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
        include: {
          task: true,
          attempt: true,
        },
      }),
      prisma.taskCompletion.count({ where: { userId } }),
    ]);

    return {
      completions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =========================================================================
  // ADMIN TASK MANAGEMENT & ANALYTICS
  // =========================================================================

  /**
   * Lists all tasks for administrative management with aggregate stats and filters.
   */
  static async adminGetTasks(query: AdminTaskQueryInput) {
    const { page, limit, status, category, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status === 'ACTIVE') where.isActive = true;
    if (status === 'PAUSED') where.isActive = false;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.rewardTask.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          budget: true,
          rules: true,
          media: true,
          _count: {
            select: {
              attempts: true,
              completions: true,
            },
          },
        },
      }),
      prisma.rewardTask.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Creates a new reward task with rules, budget, and media.
   */
  static async adminCreateTask(adminId: string, input: CreateTaskInput) {
    const slug =
      input.slug ||
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const existingSlug = await prisma.rewardTask.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ApiError(400, 'A task with this slug already exists. Please choose a different title or slug.', 'SLUG_CONFLICT');
    }

    return await prisma.$transaction(async (tx) => {
      const task = await tx.rewardTask.create({
        data: {
          title: input.title,
          slug,
          description: input.description,
          instructionsMarkdown: input.instructionsMarkdown,
          rewardCoins: input.rewardCoins,
          taskType: input.taskType as TaskType,
          verificationMethod: input.verificationMethod as VerificationMethod,
          requiredDurationSeconds: input.requiredDurationSeconds,
          cooldownHours: input.cooldownHours,
          targetUrl: input.targetUrl || null,
          category: input.category,
          difficulty: input.difficulty,
          isActive: input.isActive,
          budget: {
            create: {
              totalAllocatedCoins: input.totalBudgetCoins,
              totalSpentCoins: 0,
              isExhausted: false,
            },
          },
          rules: {
            create: {
              maxDailyCompletions: input.maxDailyCompletions,
              minUserAgeDays: 0,
            },
          },
        },
        include: {
          budget: true,
          rules: true,
          media: true,
        },
      });

      // Add media if provided
      if (input.mediaUrl) {
        await tx.taskMedia.create({
          data: {
            taskId: task.id,
            mediaType: 'IMAGE',
            url: input.mediaUrl,
            caption: input.title,
            displayOrder: 0,
          },
        });
      }

      if (input.externalVideoUrl) {
        await tx.taskMedia.create({
          data: {
            taskId: task.id,
            mediaType: 'VIDEO',
            url: input.externalVideoUrl,
            caption: 'Instructional Walkthrough',
            displayOrder: 1,
          },
        });
      }

      // Log admin audit
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'CREATE_TASK',
          targetType: 'RewardTask',
          targetId: task.id,
          reason: `Created task "${task.title}" with reward ${task.rewardCoins} coins`,
        },
      });

      return task;
    });
  }

  /**
   * Updates an existing reward task.
   */
  static async adminUpdateTask(adminId: string, taskId: string, input: UpdateTaskInput) {
    const existing = await prisma.rewardTask.findUnique({
      where: { id: taskId },
      include: { budget: true, rules: true },
    });

    if (!existing) {
      throw new ApiError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.rewardTask.update({
        where: { id: taskId },
        data: {
          ...(input.title && { title: input.title }),
          ...(input.slug && { slug: input.slug }),
          ...(input.description && { description: input.description }),
          ...(input.instructionsMarkdown && { instructionsMarkdown: input.instructionsMarkdown }),
          ...(input.rewardCoins !== undefined && { rewardCoins: input.rewardCoins }),
          ...(input.taskType && { taskType: input.taskType as TaskType }),
          ...(input.verificationMethod && { verificationMethod: input.verificationMethod as VerificationMethod }),
          ...(input.requiredDurationSeconds !== undefined && { requiredDurationSeconds: input.requiredDurationSeconds }),
          ...(input.cooldownHours !== undefined && { cooldownHours: input.cooldownHours }),
          ...(input.targetUrl !== undefined && { targetUrl: input.targetUrl || null }),
          ...(input.category && { category: input.category }),
          ...(input.difficulty && { difficulty: input.difficulty }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
        include: {
          budget: true,
          rules: true,
          media: true,
        },
      });

      // Update budget if specified
      if (input.totalBudgetCoins !== undefined && existing.budget) {
        const isExhausted = existing.budget.totalSpentCoins >= input.totalBudgetCoins;
        await tx.rewardBudget.update({
          where: { taskId },
          data: {
            totalAllocatedCoins: input.totalBudgetCoins,
            isExhausted,
          },
        });
      }

      // Update rule if specified
      if (input.maxDailyCompletions !== undefined && existing.rules[0]) {
        await tx.rewardRule.update({
          where: { id: existing.rules[0].id },
          data: {
            maxDailyCompletions: input.maxDailyCompletions,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'UPDATE_TASK',
          targetType: 'RewardTask',
          targetId: taskId,
          reason: `Updated task properties for "${updated.title}"`,
        },
      });

      return updated;
    });
  }

  /**
   * Toggles task active / paused state.
   */
  static async adminToggleTask(adminId: string, taskId: string, isActive: boolean) {
    const task = await prisma.rewardTask.update({
      where: { id: taskId },
      data: { isActive },
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: isActive ? 'RESUME_TASK' : 'PAUSE_TASK',
        targetType: 'RewardTask',
        targetId: taskId,
        reason: `${isActive ? 'Resumed' : 'Paused'} task "${task.title}"`,
      },
    });

    return task;
  }

  /**
   * Duplicates an existing reward task.
   */
  static async adminDuplicateTask(adminId: string, taskId: string) {
    const task = await prisma.rewardTask.findUnique({
      where: { id: taskId },
      include: { budget: true, rules: true, media: true },
    });

    if (!task) {
      throw new ApiError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    const newTitle = `${task.title} (Copy)`;
    const newSlug = `${task.slug}-copy-${Date.now().toString().slice(-4)}`;

    return await prisma.$transaction(async (tx) => {
      const copy = await tx.rewardTask.create({
        data: {
          title: newTitle,
          slug: newSlug,
          description: task.description,
          instructionsMarkdown: task.instructionsMarkdown,
          rewardCoins: task.rewardCoins,
          taskType: task.taskType,
          verificationMethod: task.verificationMethod,
          requiredDurationSeconds: task.requiredDurationSeconds,
          cooldownHours: task.cooldownHours,
          targetUrl: task.targetUrl,
          category: task.category,
          difficulty: task.difficulty,
          isActive: false, // Start paused
          budget: {
            create: {
              totalAllocatedCoins: task.budget?.totalAllocatedCoins || 10000,
              totalSpentCoins: 0,
              isExhausted: false,
            },
          },
          rules: {
            create: {
              maxDailyCompletions: task.rules[0]?.maxDailyCompletions || 1,
              minUserAgeDays: 0,
            },
          },
        },
        include: {
          budget: true,
          rules: true,
          media: true,
        },
      });

      // Copy media
      for (const m of task.media) {
        await tx.taskMedia.create({
          data: {
            taskId: copy.id,
            mediaType: m.mediaType,
            url: m.url,
            caption: m.caption,
            displayOrder: m.displayOrder,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'DUPLICATE_TASK',
          targetType: 'RewardTask',
          targetId: copy.id,
          reason: `Duplicated task from "${task.title}"`,
        },
      });

      return copy;
    });
  }

  /**
   * Permanently deletes a task and all associated attempts, completions, media, rules, and budget.
   */
  static async adminDeleteTask(adminId: string, taskId: string) {
    const task = await prisma.rewardTask.findUnique({
      where: { id: taskId },
      include: {
        _count: {
          select: { completions: true, attempts: true },
        },
      },
    });

    if (!task) {
      throw new ApiError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    await prisma.$transaction([
      prisma.taskCompletion.deleteMany({ where: { taskId } }),
      prisma.taskAttempt.deleteMany({ where: { taskId } }),
      prisma.taskMedia.deleteMany({ where: { taskId } }),
      prisma.rewardRule.deleteMany({ where: { taskId } }),
      prisma.rewardBudget.deleteMany({ where: { taskId } }),
      prisma.rewardTask.delete({ where: { id: taskId } }),
    ]);

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'DELETE_TASK',
        targetType: 'RewardTask',
        targetId: taskId,
        reason: `Permanently deleted task "${task.title}" (${task._count.completions} completions, ${task._count.attempts} attempts)`,
      },
    });

    return { deleted: true, taskId, title: task.title };
  }

  /**
   * Archives or deletes a task (delegates to adminDeleteTask).
   */
  static async adminArchiveTask(adminId: string, taskId: string) {
    return this.adminDeleteTask(adminId, taskId);
  }

  /**
   * Retrieves administrative analytics across tasks, starts, completions, and fraud metrics.
   */
  static async adminGetAnalytics() {
    const [
      totalTasks,
      activeTasks,
      totalAttempts,
      completedAttempts,
      fraudAttempts,
      totalCoinsPaidResult,
      totalBudgetsResult,
    ] = await Promise.all([
      prisma.rewardTask.count(),
      prisma.rewardTask.count({ where: { isActive: true } }),
      prisma.taskAttempt.count(),
      prisma.taskCompletion.count(),
      prisma.taskAttempt.count({ where: { status: 'FLAGGED_FRAUD' } }),
      prisma.taskCompletion.aggregate({
        _sum: { rewardCoins: true },
      }),
      prisma.rewardBudget.aggregate({
        _sum: {
          totalAllocatedCoins: true,
          totalSpentCoins: true,
        },
      }),
    ]);

    const totalCoinsPaid = totalCoinsPaidResult._sum.rewardCoins || 0;
    const totalAllocated = totalBudgetsResult._sum.totalAllocatedCoins || 0;
    const totalSpent = totalBudgetsResult._sum.totalSpentCoins || 0;
    const remainingBudget = Math.max(0, totalAllocated - totalSpent);

    const completionRate =
      totalAttempts > 0 ? Number(((completedAttempts / totalAttempts) * 100).toFixed(1)) : 0;
    const fraudRate =
      totalAttempts > 0 ? Number(((fraudAttempts / totalAttempts) * 100).toFixed(1)) : 0;

    return {
      totalTasks,
      activeTasks,
      pausedTasks: totalTasks - activeTasks,
      totalAttempts,
      completedAttempts,
      fraudAttempts,
      completionRate,
      fraudRate,
      totalCoinsPaid,
      totalAllocatedBudget: totalAllocated,
      remainingBudget,
    };
  }
}
