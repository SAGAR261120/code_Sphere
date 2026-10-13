# CPC Marketplace — Security & Threat Modeling Audit

## 1. Security Architecture Principles

CPC Marketplace operates as a digital economy with real fiat deposits and internal credits. Security follows defense-in-depth principles:
1. **Server is Source of Truth**: The client is never trusted for coin balances, product prices, purchase success, or task completion claims.
2. **ACID Transaction Isolation**: Financial transactions use row-level locking (`SELECT ... FOR UPDATE`) to eliminate double-spending vulnerabilities.
3. **Least Privilege & Role-Based Access Control (RBAC)**: All routes enforce strict session and role validation.
4. **Defense Against Automated Abuse**: Cooldowns, velocity checks, cryptographic token verification, and tiered sliding-window rate limiting.

---

## 2. Technical Security Audit & Verification Matrix

| Vulnerability Category | Specific Vector Audited | Technical Defense Implemented | Audit Status |
| :--- | :--- | :--- | :---: |
| **Broken Access Control** | Unauthorized access to admin APIs (`/api/v1/admin/*`) | Server-side role inspection in `requireRoleMiddleware`; rejects non-admin requests with 403 `FORBIDDEN` | **VERIFIED** |
| **IDOR Vulnerabilities** | Accessing other users' orders, wallets, downloads, or receipts | Ownership checks (`order.userId === userId` or active `PurchaseEntitlement` check); returns 403 `UNAUTHORIZED` | **VERIFIED** |
| **SQL Injection** | Malicious payloads in query parameters, search inputs, or sorting strings | Prisma ORM uses parameterized queries exclusively; raw SQL uses tagged template literals (`prisma.$queryRaw\`) | **VERIFIED** |
| **Cross-Site Scripting (XSS)** | Injection via product descriptions, review bodies, refund reasons | React automatic JSX escaping; strict Zod schema validation; `X-XSS-Protection: 1; mode=block` | **VERIFIED** |
| **CSRF Vulnerabilities** | Cross-site forged mutation requests | `SameSite=Lax` session cookies; Origin and Referer header verification; JSON payload content-type parsing | **VERIFIED** |
| **Authentication Abuse** | Credential stuffing and brute-force password guessing | Account lockout after 5 consecutive failed attempts (`lockedUntil = now + 30m`); 10 req/min rate limit on `/api/v1/auth/*` | **VERIFIED** |
| **Rate Limit Bypass** | High-velocity scraping, task bot automation, or wallet flooding | Root middleware sliding window rate limiter (`src/lib/rate-limiter.ts`); returns HTTP 429 with `Retry-After` headers | **VERIFIED** |
| **File Upload & Traversal Abuse**| Uploading malicious executables or directory traversal (`../../`) | Extension whitelisting (`.zip`, `.tar.gz`, `.pdf`), file size limits, non-guessable UUID storage keys | **VERIFIED** |
| **Open Redirects** | Redirecting users to external phishing sites upon login or return | Whitelist validation on return URLs (`ALLOWED_DOMAINS`); rejection of arbitrary external protocols | **VERIFIED** |
| **Payment Webhook Forgery** | Tampered webhook payloads claiming false payment success | HMAC-SHA256 signature verification over raw body using `crypto.timingSafeEqual`; timestamp freshness checks | **VERIFIED** |
| **Callback Replay Attacks** | Replaying shortlink callback notifications to mint duplicate coins | Unique index on `TaskAttempt` and `TaskCallbackEvent`; single-reward issuance guard | **VERIFIED** |
| **Double Spending** | Rapid concurrent purchase requests exceeding wallet coin balance | `SELECT ... FOR UPDATE` row locking inside atomic PostgreSQL transaction; balance checked *after* acquiring row lock | **VERIFIED** |
| **Duplicate Coin Issuance** | Network retries duplicating welcome bonuses or deposits | Unique idempotency keys (`idempotencyKey`) on `Order` and `CoinTransaction`; single execution guarantee | **VERIFIED** |
| **Unauthorized File Downloads** | Direct URL guessing of private source packages | Object storage private buckets; 15-minute HMAC-SHA256 presigned download tokens tied to verified entitlement | **VERIFIED** |
| **Secret Leakage** | Exposing provider API keys, webhook secrets, or DB passwords | Server-only secrets; masked response DTOs (`[REDACTED]`); structured logger redacts sensitive keys | **VERIFIED** |
| **Privilege Escalation** | Regular user modifying user role or granting admin privileges | Self-role modification blocked; only `SUPER_ADMIN` can modify staff roles | **VERIFIED** |

---

## 3. Dependency Security Audit (`npm audit`)

Executed on October 13, 2026:
- **Audit Tool**: `npm audit`
- **Audit Findings**:
  - `braces`: High severity via `eslint-config-next` (dev-only linting dependency; non-runtime).
  - `deepmerge-ts` / `mysql2`: High severity sub-dependencies of `@prisma/config` / `prisma` CLI for MySQL (non-runtime; CPC Marketplace uses PostgreSQL driver adapter exclusively).
- **Remediation**: Run `npm audit fix` after upstream Next.js and Prisma minor package updates release breaking-free patches. No production runtime vulnerability detected.

---

## 4. Prioritized List of Remaining Production Blockers

Before initiating real live production fiat transactions and real coin distributions:

1. **[BLOCKER 1 - HIGH] Live Payment Provider Approval & Webhook Provisioning**:
   - Razorpay India account must complete merchant KYC verification and obtain Live API keys (`rzp_live_...`).
   - The production webhook endpoint (`https://cpcmarketplace.com/api/v1/payments/webhook`) must be configured with a generated 64-character signing secret.
2. **[BLOCKER 2 - HIGH] Production Object Storage Bucket Provisioning**:
   - Cloudflare R2 or AWS S3 private production bucket must be provisioned with encrypted storage, lifecycle policies, and restricted IAM credentials.
3. **[BLOCKER 3 - MEDIUM] Domain & Reverse Proxy HTTPS Setup**:
   - Production domain DNS (`cpcmarketplace.com`) must point to Cloudflare/Nginx with TLS 1.3 certificates and Strict-Transport-Security (HSTS).
4. **[BLOCKER 4 - LOW] Real Short-Link Provider Commercial Agreement**:
   - Formal terms of service review with short-link providers (e.g. GPLinks) to confirm policy compliance with incentive-based digital marketplace tasks.
