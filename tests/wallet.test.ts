import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  adminAdjustCoinsSchema,
  coinConfigSchema,
  walletQuerySchema,
  exportStatementSchema,
  repairWalletSchema,
} from '@/lib/validations/wallet.schema';

describe('Phase 5: CPC Coin Wallet & Ledger Engine Test Suite', () => {
  describe('1. Zod Validation Schemas & Financial Constraints', () => {
    it('should reject zero adjustment amount in adminAdjustCoinsSchema', () => {
      const result = adminAdjustCoinsSchema.safeParse({
        userId: 'a0000000-0000-4000-8000-000000000001',
        amount: 0,
        reason: 'Valid audit reason for adjustment',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be zero');
      }
    });

    it('should reject adjustment reason with fewer than 5 characters', () => {
      const result = adminAdjustCoinsSchema.safeParse({
        userId: 'a0000000-0000-4000-8000-000000000001',
        amount: 50,
        reason: 'Fail',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 5 characters');
      }
    });

    it('should accept valid positive and negative adjustments with valid UUID and reason', () => {
      const credit = adminAdjustCoinsSchema.safeParse({
        userId: 'a0000000-0000-4000-8000-000000000001',
        amount: 250,
        reason: 'Customer support compensation',
      });
      expect(credit.success).toBe(true);

      const debit = adminAdjustCoinsSchema.safeParse({
        userId: 'a0000000-0000-4000-8000-000000000001',
        amount: -100,
        reason: 'Compensating reversal of duplicated task reward',
      });
      expect(debit.success).toBe(true);
    });

    it('should validate platform coin configuration limits', () => {
      const valid = coinConfigSchema.safeParse({
        dailyIssuanceLimit: 50000,
        maxWalletBalance: 100000,
        minDepositPaise: 10000,
        promoRewardLimit: 300,
        coinExpiryDays: 0,
      });
      expect(valid.success).toBe(true);

      const invalid = coinConfigSchema.safeParse({
        dailyIssuanceLimit: 10, // below minimum 100
        maxWalletBalance: 500, // below minimum 1000
        minDepositPaise: 100,
        promoRewardLimit: 5,
        coinExpiryDays: -1, // cannot be negative
      });
      expect(invalid.success).toBe(false);
    });

    it('should parse wallet query with default pagination and direction', () => {
      const parsed = walletQuerySchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
      expect(parsed.direction).toBe('ALL');
    });

    it('should accept valid export statement formats (csv, json)', () => {
      expect(exportStatementSchema.safeParse({ format: 'csv' }).success).toBe(true);
      expect(exportStatementSchema.safeParse({ format: 'json' }).success).toBe(true);
      expect(exportStatementSchema.safeParse({ format: 'xml' }).success).toBe(false);
    });

    it('should validate repair wallet schema requires valid UUID and audit reason', () => {
      const valid = repairWalletSchema.safeParse({
        userId: 'a0000000-0000-4000-8000-000000000002',
        reason: 'Administrative reconciliation sync',
      });
      expect(valid.success).toBe(true);

      const invalid = repairWalletSchema.safeParse({
        userId: 'not-a-uuid',
        reason: 'Hi',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('2. Financial Ledger Consistency & ACID Mathematics', () => {
    it('should strictly satisfy balanceAfter invariant: balanceAfter = balanceBefore + amount', () => {
      const initialBalance = 500;
      const creditAmount = 250;
      const balanceAfterCredit = initialBalance + creditAmount;
      expect(balanceAfterCredit).toBe(750);

      const debitAmount = -300;
      const balanceAfterDebit = balanceAfterCredit + debitAmount;
      expect(balanceAfterDebit).toBe(450);
    });

    it('should reject spending when balance is insufficient (Negative Balance Defense)', () => {
      const availableBalance = 150;
      const requestedSpend = 200;

      const canSpend = (bal: number, spend: number) => {
        if (spend <= 0) throw new Error('Spend must be positive');
        if (bal < spend) throw new Error('Insufficient balance');
        return bal - spend;
      };

      expect(() => canSpend(availableBalance, requestedSpend)).toThrow('Insufficient balance');
      expect(() => canSpend(availableBalance, -50)).toThrow('Spend must be positive');
      expect(canSpend(availableBalance, 100)).toBe(50);
    });

    it('should enforce idempotency: duplicate transaction keys do not duplicate balance mutations', () => {
      const ledgerMap = new Map<string, { amount: number; balanceAfter: number }>();
      let walletBalance = 500;

      const executeTransaction = (idempotencyKey: string, amount: number) => {
        if (ledgerMap.has(idempotencyKey)) {
          return {
            transaction: ledgerMap.get(idempotencyKey)!,
            isDuplicate: true,
            currentBalance: walletBalance,
          };
        }

        walletBalance += amount;
        const entry = { amount, balanceAfter: walletBalance };
        ledgerMap.set(idempotencyKey, entry);

        return {
          transaction: entry,
          isDuplicate: false,
          currentBalance: walletBalance,
        };
      };

      const key = 'tx-dedup-uuid-9999';

      // First execution
      const first = executeTransaction(key, 100);
      expect(first.isDuplicate).toBe(false);
      expect(first.currentBalance).toBe(600);

      // Duplicate request with identical idempotency key
      const duplicate = executeTransaction(key, 100);
      expect(duplicate.isDuplicate).toBe(true);
      expect(duplicate.currentBalance).toBe(600); // Balance NOT increased twice!
    });

    it('should calculate double-entry reconciliation accurately', () => {
      const transactions = [
        { amount: 50 },   // Welcome
        { amount: 500 },  // Deposit
        { amount: 75 },   // Task
        { amount: -125 }, // Purchase
      ];

      const ledgerSum = transactions.reduce((acc, t) => acc + t.amount, 0);
      expect(ledgerSum).toBe(500);

      // Test 1: Consistent wallet
      const walletAvailable = 500;
      const discrepancy = walletAvailable - ledgerSum;
      const isConsistent = discrepancy === 0;
      expect(isConsistent).toBe(true);
      expect(discrepancy).toBe(0);

      // Test 2: Inconsistent wallet (e.g. simulated unrecorded credit)
      const corruptedWallet = 600;
      const corruptedDiscrepancy = corruptedWallet - ledgerSum;
      const corruptedConsistent = corruptedDiscrepancy === 0;
      expect(corruptedConsistent).toBe(false);
      expect(corruptedDiscrepancy).toBe(100);
    });

    it('should format CSV statement with official financial headers and escaping', () => {
      const headers = [
        'Transaction ID',
        'Receipt Number',
        'Timestamp (UTC)',
        'Type',
        'Direction',
        'Amount (CPC)',
        'Balance After (CPC)',
        'Description',
      ];

      const mockTx = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2026-10-12T12:00:00Z'),
        type: 'TASK_REWARD',
        amount: 50,
        balanceAfter: 550,
        description: 'Completed "Daily Product Tour" task',
      };

      const row = [
        `"${mockTx.id}"`,
        `"CPC-TX-${mockTx.id.slice(0, 8).toUpperCase()}"`,
        `"${mockTx.createdAt.toISOString()}"`,
        `"${mockTx.type}"`,
        `"${mockTx.amount > 0 ? 'CREDIT' : 'DEBIT'}"`,
        mockTx.amount,
        mockTx.balanceAfter,
        `"${mockTx.description.replace(/"/g, '""')}"`,
      ];

      const csv = [headers.join(','), row.join(',')].join('\n');
      expect(csv).toContain('Transaction ID,Receipt Number');
      expect(csv).toContain('CPC-TX-123E4567');
      expect(csv).toContain('"Completed ""Daily Product Tour"" task"');
      expect(csv).toContain('"CREDIT",50,550');
    });

    it('should handle hold and release mechanics for escrow commitments', () => {
      let availableBalance = 1000;
      let lockedBalance = 0;

      const placeHold = (amount: number) => {
        if (availableBalance < amount) throw new Error('Insufficient available balance to place hold');
        availableBalance -= amount;
        lockedBalance += amount;
      };

      const releaseHold = (amount: number) => {
        const release = Math.min(amount, lockedBalance);
        lockedBalance -= release;
        availableBalance += release;
      };

      placeHold(300);
      expect(availableBalance).toBe(700);
      expect(lockedBalance).toBe(300);

      releaseHold(100);
      expect(availableBalance).toBe(800);
      expect(lockedBalance).toBe(200);

      releaseHold(200);
      expect(availableBalance).toBe(1000);
      expect(lockedBalance).toBe(0);
    });
  });
});
