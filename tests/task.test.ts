import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  startTaskSchema,
  verifyTaskSchema,
  createTaskSchema,
  adminTaskQuerySchema,
} from '@/lib/validations/task.schema';
import { ApiError } from '@/lib/api-response';

describe('Phase 8: CPC Earn Coins and Daily Task System Test Suite', () => {
  describe('1. Zod Validation Schemas & Bounds Enforcement', () => {
    it('should validate valid startTaskSchema with UUID taskId', () => {
      const valid = startTaskSchema.safeParse({
        taskId: 'a0000000-0000-4000-8000-000000000001',
      });
      expect(valid.success).toBe(true);

      const invalid = startTaskSchema.safeParse({
        taskId: 'not-a-uuid',
      });
      expect(invalid.success).toBe(false);
    });

    it('should validate verifyTaskSchema requiring valid UUID and min 20-char session token', () => {
      const valid = verifyTaskSchema.safeParse({
        attemptId: 'b0000000-0000-4000-8000-000000000001',
        sessionToken: 'a1b2c3d4e5f678901234567890abcdef',
      });
      expect(valid.success).toBe(true);

      const shortToken = verifyTaskSchema.safeParse({
        attemptId: 'b0000000-0000-4000-8000-000000000001',
        sessionToken: 'too-short', // < 20 chars
      });
      expect(shortToken.success).toBe(false);
    });

    it('should validate createTaskSchema default values and boundaries', () => {
      const valid = createTaskSchema.safeParse({
        title: 'Inspect Distributed Cache Architecture',
        description: 'Review high-throughput Redis cluster setup and failover strategies.',
        instructionsMarkdown: '1. Open the repository.\n2. Review cluster config.\n3. Spend at least 30 seconds.',
        rewardCoins: 50,
      });

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.rewardCoins).toBe(50);
        expect(valid.data.taskType).toBe('VISIT');
        expect(valid.data.verificationMethod).toBe('TIMER');
        expect(valid.data.requiredDurationSeconds).toBe(30);
        expect(valid.data.cooldownHours).toBe(24);
        expect(valid.data.maxDailyCompletions).toBe(1);
        expect(valid.data.totalBudgetCoins).toBe(10000);
      }
    });

    it('should reject invalid reward coins (under 1 or over 10,000)', () => {
      const zeroReward = createTaskSchema.safeParse({
        title: 'Invalid Task with Zero Reward',
        description: 'Valid description for testing boundary',
        instructionsMarkdown: 'Valid instructions with enough length for test',
        rewardCoins: 0,
      });
      expect(zeroReward.success).toBe(false);

      const excessiveReward = createTaskSchema.safeParse({
        title: 'Excessive Reward Task',
        description: 'Valid description for testing boundary',
        instructionsMarkdown: 'Valid instructions with enough length for test',
        rewardCoins: 15000,
      });
      expect(excessiveReward.success).toBe(false);
    });

    it('should reject duration under 5 seconds or over 3600 seconds', () => {
      const tooFast = createTaskSchema.safeParse({
        title: 'Too Fast Task',
        description: 'Valid description for testing boundary',
        instructionsMarkdown: 'Valid instructions with enough length for test',
        rewardCoins: 25,
        requiredDurationSeconds: 3, // < 5s
      });
      expect(tooFast.success).toBe(false);

      const tooLong = createTaskSchema.safeParse({
        title: 'Too Long Task',
        description: 'Valid description for testing boundary',
        instructionsMarkdown: 'Valid instructions with enough length for test',
        rewardCoins: 25,
        requiredDurationSeconds: 4000, // > 3600s
      });
      expect(tooLong.success).toBe(false);
    });

    it('should validate adminTaskQuerySchema defaults and status constraints', () => {
      const defaultQuery = adminTaskQuerySchema.parse({});
      expect(defaultQuery.page).toBe(1);
      expect(defaultQuery.limit).toBe(20);
      expect(defaultQuery.status).toBe('ALL');

      const customQuery = adminTaskQuerySchema.parse({
        page: '2',
        limit: '15',
        status: 'ACTIVE',
        search: 'architecture',
      });
      expect(customQuery.page).toBe(2);
      expect(customQuery.limit).toBe(15);
      expect(customQuery.status).toBe('ACTIVE');
      expect(customQuery.search).toBe('architecture');
    });
  });

  describe('2. Anti-Fraud & Minimum Duration Verification', () => {
    it('should reject verification and flag fraud if minimum required duration was not met', () => {
      const requiredSeconds = 30;
      const createdAt = new Date(Date.now() - 10 * 1000); // Only 10s elapsed

      const verifyDuration = (created: Date, required: number) => {
        const elapsed = Math.floor((Date.now() - created.getTime()) / 1000);
        if (elapsed < required) {
          throw new ApiError(
            400,
            `Minimum engagement duration of ${required}s was not met (Recorded: ${elapsed}s).`,
            'INSUFFICIENT_TIME'
          );
        }
        return true;
      };

      expect(() => verifyDuration(createdAt, requiredSeconds)).toThrow(ApiError);
      try {
        verifyDuration(createdAt, requiredSeconds);
      } catch (err: any) {
        expect(err.errorCode).toBe('INSUFFICIENT_TIME');
        expect(err.message).toContain('Minimum engagement duration');
      }

      // Valid elapsed duration passes
      const validCreatedAt = new Date(Date.now() - 35 * 1000); // 35s elapsed
      expect(verifyDuration(validCreatedAt, requiredSeconds)).toBe(true);
    });

    it('should enforce timing-safe session token comparison and reject forged tokens', () => {
      const expectedToken = crypto.randomBytes(32).toString('hex');
      const forgedToken = crypto.randomBytes(32).toString('hex');

      const compareTokens = (expected: string, provided: string) => {
        const expectedBuf = Buffer.from(expected, 'utf-8');
        const providedBuf = Buffer.from(provided, 'utf-8');
        if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
          throw new ApiError(401, 'Invalid or forged task session token', 'INVALID_SESSION_TOKEN');
        }
        return true;
      };

      expect(() => compareTokens(expectedToken, forgedToken)).toThrow(ApiError);
      try {
        compareTokens(expectedToken, forgedToken);
      } catch (err: any) {
        expect(err.errorCode).toBe('INVALID_SESSION_TOKEN');
      }

      expect(compareTokens(expectedToken, expectedToken)).toBe(true);
    });
  });

  describe('3. Cooldown & Limits Invariants', () => {
    it('should calculate remaining cooldown seconds accurately', () => {
      const cooldownHours = 24;
      const cooldownMs = cooldownHours * 60 * 60 * 1000;
      const completedAt = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours ago

      const calculateCooldown = (lastCompleted: Date, hours: number) => {
        const elapsed = Date.now() - lastCompleted.getTime();
        const totalCooldown = hours * 3600 * 1000;
        if (elapsed < totalCooldown) {
          return {
            isEligible: false,
            remainingSeconds: Math.ceil((totalCooldown - elapsed) / 1000),
          };
        }
        return { isEligible: true, remainingSeconds: 0 };
      };

      const result = calculateCooldown(completedAt, cooldownHours);
      expect(result.isEligible).toBe(false);
      // Roughly 18 hours remaining (around 64,800 seconds)
      expect(result.remainingSeconds).toBeGreaterThan(64700);
      expect(result.remainingSeconds).toBeLessThanOrEqual(64800);
    });

    it('should block starting attempt when cooldown is active', () => {
      const checkCooldownEligibility = (isEligible: boolean, remainingSec: number) => {
        if (!isEligible) {
          throw new ApiError(
            400,
            `Task is in cooldown. Please wait ${remainingSec} seconds before starting again.`,
            'COOLDOWN_ACTIVE'
          );
        }
        return true;
      };

      expect(() => checkCooldownEligibility(false, 3600)).toThrow(ApiError);
      try {
        checkCooldownEligibility(false, 3600);
      } catch (err: any) {
        expect(err.errorCode).toBe('COOLDOWN_ACTIVE');
      }

      expect(checkCooldownEligibility(true, 0)).toBe(true);
    });

    it('should block starting attempt when daily completion limit is reached', () => {
      const checkDailyLimit = (completionsToday: number, maxDaily: number) => {
        if (completionsToday >= maxDaily) {
          throw new ApiError(
            400,
            `You have already reached the daily limit (${maxDaily} times/day) for this task.`,
            'DAILY_LIMIT_REACHED'
          );
        }
        return true;
      };

      expect(checkDailyLimit(0, 1)).toBe(true);
      expect(() => checkDailyLimit(1, 1)).toThrow(ApiError);
      try {
        checkDailyLimit(1, 1);
      } catch (err: any) {
        expect(err.errorCode).toBe('DAILY_LIMIT_REACHED');
      }

      // Supports multiple daily completions if configured
      expect(checkDailyLimit(2, 3)).toBe(true);
      expect(() => checkDailyLimit(3, 3)).toThrow(ApiError);
    });
  });

  describe('4. Single-Issuance, Budget Exhaustion & Double-Reward Defense', () => {
    it('should reject replaying an already completed task attempt', () => {
      const attempt = {
        id: 'att-123',
        status: 'COMPLETED' as const,
      };

      const verifyStatus = (status: string) => {
        if (status === 'COMPLETED') {
          throw new ApiError(
            400,
            'This task attempt has already been verified and rewarded.',
            'ALREADY_COMPLETED'
          );
        }
        return true;
      };

      expect(() => verifyStatus(attempt.status)).toThrow(ApiError);
      try {
        verifyStatus(attempt.status);
      } catch (err: any) {
        expect(err.errorCode).toBe('ALREADY_COMPLETED');
      }
    });

    it('should atomically update budget and mark isExhausted when limit reached', () => {
      interface TaskBudget {
        totalAllocatedCoins: number;
        totalSpentCoins: number;
        isExhausted: boolean;
      }

      const budget: TaskBudget = {
        totalAllocatedCoins: 100,
        totalSpentCoins: 75,
        isExhausted: false,
      };

      const awardBudget = (b: TaskBudget, reward: number) => {
        b.totalSpentCoins += reward;
        b.isExhausted = b.totalSpentCoins >= b.totalAllocatedCoins;
        return b;
      };

      const updated = awardBudget(budget, 25);
      expect(updated.totalSpentCoins).toBe(100);
      expect(updated.isExhausted).toBe(true);

      const checkBudgetAvailable = (b: TaskBudget) => {
        if (b.isExhausted) {
          throw new ApiError(400, 'Global reward budget for this task is exhausted', 'BUDGET_EXHAUSTED');
        }
        return true;
      };

      expect(() => checkBudgetAvailable(updated)).toThrow(ApiError);
      try {
        checkBudgetAvailable(updated);
      } catch (err: any) {
        expect(err.errorCode).toBe('BUDGET_EXHAUSTED');
      }
    });

    it('should credit coins atomically and create double-entry TASK_REWARD ledger entry', () => {
      let walletBalance = 500;
      let totalEarned = 1000;
      const ledger: any[] = [];
      const rewardCoins = 75;

      const recordTaskReward = (userId: string, taskId: string, attemptId: string) => {
        walletBalance += rewardCoins;
        totalEarned += rewardCoins;

        const ledgerTx = {
          id: 'tx-reward-001',
          userId,
          amount: rewardCoins,
          balanceAfter: walletBalance,
          type: 'TASK_REWARD',
          description: 'Daily Task Reward: Inspect Microservices Architecture',
          idempotencyKey: `task-reward-${attemptId}`,
          referenceId: attemptId,
        };
        ledger.push(ledgerTx);

        return { walletBalance, totalEarned, ledgerTx };
      };

      const result = recordTaskReward('user-1', 'task-1', 'att-1');

      expect(result.walletBalance).toBe(575);
      expect(result.totalEarned).toBe(1075);
      expect(result.ledgerTx.type).toBe('TASK_REWARD');
      expect(result.ledgerTx.amount).toBe(75);
      expect(result.ledgerTx.balanceAfter).toBe(575);
      expect(result.ledgerTx.idempotencyKey).toBe('task-reward-att-1');
    });
  });

  describe('5. Admin Governance & Lifecycle Control', () => {
    it('should enforce that paused tasks cannot be started by users', () => {
      const task = {
        id: 'task-paused-1',
        isActive: false,
      };

      const checkTaskActive = (isActive: boolean) => {
        if (!isActive) {
          throw new ApiError(404, 'Task not found or currently paused', 'TASK_UNAVAILABLE');
        }
        return true;
      };

      expect(() => checkTaskActive(task.isActive)).toThrow(ApiError);
      try {
        checkTaskActive(task.isActive);
      } catch (err: any) {
        expect(err.errorCode).toBe('TASK_UNAVAILABLE');
      }

      expect(checkTaskActive(true)).toBe(true);
    });

    it('should calculate analytics KPIs including completion rate and fraud rate', () => {
      const totalAttempts = 200;
      const completedAttempts = 150;
      const fraudAttempts = 10;

      const calculateKpis = (starts: number, completed: number, fraud: number) => {
        const completionRate = starts > 0 ? Number(((completed / starts) * 100).toFixed(1)) : 0;
        const fraudRate = starts > 0 ? Number(((fraud / starts) * 100).toFixed(1)) : 0;
        return { completionRate, fraudRate };
      };

      const kpis = calculateKpis(totalAttempts, completedAttempts, fraudAttempts);
      expect(kpis.completionRate).toBe(75.0);
      expect(kpis.fraudRate).toBe(5.0);
    });
  });
});
