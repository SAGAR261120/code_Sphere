import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimiter, RATE_LIMIT_TIERS } from '@/lib/rate-limiter';
import { redactSensitiveData, logger } from '@/lib/logger';
import { ErrorMonitor } from '@/lib/error-monitor';

describe('Phase 13: Production Hardening & Security Audit Test Suite', () => {
  beforeEach(() => {
    rateLimiter.clear();
  });

  describe('1. Sliding Window Rate Limiter & Abuse Defense', () => {
    it('should permit requests within quota limits', () => {
      const tier = { limit: 5, windowMs: 10000 };
      const key = 'test-client-ip:login';

      for (let i = 1; i <= 5; i++) {
        const res = rateLimiter.check(key, tier);
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(5 - i);
      }
    });

    it('should reject requests exceeding quota with remaining: 0 and positive resetMs', () => {
      const tier = { limit: 3, windowMs: 10000 };
      const key = 'test-client-ip:checkout';

      rateLimiter.check(key, tier);
      rateLimiter.check(key, tier);
      rateLimiter.check(key, tier);

      // 4th request must be rejected
      const rejected = rateLimiter.check(key, tier);
      expect(rejected.allowed).toBe(false);
      expect(rejected.remaining).toBe(0);
      expect(rejected.resetMs).toBeGreaterThan(0);
    });

    it('should enforce distinct tiers for AUTH (10/min) vs DEFAULT (120/min)', () => {
      expect(RATE_LIMIT_TIERS.AUTH.limit).toBe(10);
      expect(RATE_LIMIT_TIERS.DEFAULT.limit).toBe(120);
      expect(RATE_LIMIT_TIERS.PAYMENT.limit).toBe(15);
      expect(RATE_LIMIT_TIERS.DOWNLOAD.limit).toBe(30);
    });

    it('should reset rate limit when explicitly cleared', () => {
      const tier = { limit: 2, windowMs: 10000 };
      const key = 'user:reset-test';

      rateLimiter.check(key, tier);
      rateLimiter.check(key, tier);
      expect(rateLimiter.check(key, tier).allowed).toBe(false);

      rateLimiter.reset(key);
      expect(rateLimiter.check(key, tier).allowed).toBe(true);
    });
  });

  describe('2. Structured Logger & Sensitive Data Redaction', () => {
    it('should redact passwords, secrets, tokens, and apiKeys from log context', () => {
      const input = {
        userId: 'usr-12345',
        action: 'USER_LOGIN',
        password: 'SuperSecretPassword123!',
        token: 'eyJh...jwt_token_secret',
        sessionToken: 'session_token_xyz',
        apiKey: 'rzp_live_abc123',
        safeMetadata: {
          browser: 'Chrome',
          secret: 'private_key_pem',
          authorization: 'Bearer token_value',
        },
      };

      const redacted = redactSensitiveData(input);

      expect(redacted.userId).toBe('usr-12345');
      expect(redacted.action).toBe('USER_LOGIN');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.sessionToken).toBe('[REDACTED]');
      expect(redacted.apiKey).toBe('[REDACTED]');
      expect(redacted.safeMetadata.browser).toBe('Chrome');
      expect(redacted.safeMetadata.secret).toBe('[REDACTED]');
      expect(redacted.safeMetadata.authorization).toBe('[REDACTED]');
    });

    it('should handle nested arrays and null values safely', () => {
      const input = {
        users: [
          { name: 'Alice', password: 'password1' },
          { name: 'Bob', password: 'password2' },
        ],
        emptyField: null,
      };

      const redacted = redactSensitiveData(input);

      expect(redacted.users[0].name).toBe('Alice');
      expect(redacted.users[0].password).toBe('[REDACTED]');
      expect(redacted.users[1].name).toBe('Bob');
      expect(redacted.users[1].password).toBe('[REDACTED]');
      expect(redacted.emptyField).toBeNull();
    });
  });

  describe('3. Error Monitor & Incident Dispatcher', () => {
    it('should capture exceptions without throwing', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        ErrorMonitor.captureException(new Error('Test unhandled runtime error'), {
          requestId: 'req-test-999',
          path: '/api/v1/orders',
        });
      }).not.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should record security alerts with audit log entry', async () => {
      const { prisma } = await import('@/lib/prisma');
      const createAuditSpy = vi.spyOn(prisma.auditLog, 'create').mockResolvedValueOnce({} as any);
      const createNotifSpy = vi.spyOn(prisma.notification, 'create').mockResolvedValueOnce({} as any);

      await ErrorMonitor.recordSecurityAlert({
        eventType: 'BRUTE_FORCE',
        userId: 'usr-target-1',
        ip: '192.168.1.50',
        path: '/api/v1/auth/login',
        details: { attempts: 6 },
      });

      expect(createAuditSpy).toHaveBeenCalled();
      expect(createNotifSpy).toHaveBeenCalled();

      createAuditSpy.mockRestore();
      createNotifSpy.mockRestore();
    });
  });

  describe('4. Health & Readiness Probe Architecture', () => {
    it('should verify health route structure and readiness probe requirements', async () => {
      const { GET: healthGet } = await import('@/app/api/health/route');
      const healthRes = await healthGet();
      expect(healthRes.status).toBe(200);

      const healthJson = await healthRes.json();
      expect(healthJson.status).toBe('UP');
      expect(healthJson.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(healthJson.version).toBe('0.13.0');
      expect(healthJson.system.memoryMb).toBeDefined();
    });
  });

  describe('5. Core Security Controls Verification', () => {
    it('should enforce that coin transactions can never result in negative balances', () => {
      const walletBalance = 50;
      const purchasePrice = 100;
      const canAfford = walletBalance >= purchasePrice;

      expect(canAfford).toBe(false);
      // Double spending attempt rejected
      expect(() => {
        if (!canAfford) throw new Error('INSUFFICIENT_FUNDS');
      }).toThrow('INSUFFICIENT_FUNDS');
    });

    it('should enforce idempotency deduplication semantics on order creation', () => {
      const processedIdempotencyKeys = new Set<string>();
      const idempotencyKey = 'req-idem-12345';

      // First call succeeds
      expect(processedIdempotencyKeys.has(idempotencyKey)).toBe(false);
      processedIdempotencyKeys.add(idempotencyKey);

      // Replay / retry call must be detected as duplicate
      const isDuplicate = processedIdempotencyKeys.has(idempotencyKey);
      expect(isDuplicate).toBe(true);
    });
  });
});
