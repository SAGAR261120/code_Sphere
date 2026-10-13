# CPC Marketplace — Authoritative Business Rules

> **Important**: This document is the single source of truth for business logic across all modules in CPC Marketplace. In case of discrepancies between frontend displays and server logic, the server and this document prevail.

---

## 1. User Accounts and Permissions

1. **Guest Access**: Guests can browse published products, read public product descriptions, view screenshots, and read public documentation. They cannot earn coins, initiate checkouts, download protected files, or submit reviews.
2. **Account States**:
   - `ACTIVE`: Standard status for registered users.
   - `SUSPENDED`: User is blocked from initiating purchases, completing tasks, earning coins, or creating reviews. Existing purchased entitlements and historical transaction ledgers remain intact for compliance and auditability.
   - `BANNED`: Permanent block due to severe terms violations or verified fraud.
3. **Role-Based Access Control (RBAC)**:
   - `USER`: Personal dashboard, wallet ledger, tasks, orders, entitlements, downloads, reviews.
   - `MODERATOR`: Product review queue, flagged task attempts review, user reports.
   - `ADMIN`: Product publishing, task management, deposit review, user management, order administration.
   - `SUPER_ADMIN`: System-level configurations, coin balance manual adjustments, API keys, audit log inspection.
4. **Data Isolation**: A user can never access or query another user's wallet balance, private transactions, task history, or download tokens. Access controls are verified server-side on every request.

---

## 2. CPC Coin Accounting & Financial Ledger

1. **Nature of CPC Coins**: CPC Coins represent internal marketplace utility credits. They are stored as non-negative 64-bit integers (e.g., 100 coins = 100 units). They are not fiat currency, cryptocurrency, or directly redeemable cash without explicit regulatory and legal approval.
2. **Immutable Ledger**:
   - Wallet balances are **never** mutated by direct client calls.
   - Every credit and debit must create an atomic `CoinLedger` entry with:
     - `userId`: Target user.
     - `amount`: Signed integer (positive for credits, negative for debits).
     - `balanceAfter`: Balance snapshot immediately following the transaction.
     - `type`: Category (`TASK_REWARD`, `PURCHASE_DEBIT`, `DEPOSIT_CREDIT`, `ADMIN_ADJUSTMENT`, `REFUND_CREDIT`, `PROMO_BONUS`).
     - `referenceId` & `referenceType`: Polymorphic pointer to associated Order, TaskAttempt, Deposit, etc.
     - `idempotencyKey`: Unique client/server UUID preventing duplicate execution on network retries.
     - `description`: Human-readable summary.
3. **No Negative Balances**: Under no circumstances may an operation debit a user's wallet if `availableBalance < amount`. Database constraints and row-level locking (`SELECT FOR UPDATE` in PostgreSQL transactions) prevent race conditions.
4. **Auditability for Admin Adjustments**: Any manual balance adjustment by an administrator requires:
   - A documented `reason` string.
   - The authenticated `adminId`.
   - Creation of an immutable audit record alongside the ledger entry.
5. **No Deletion of Ledger Rows**: Correcting an accounting error requires a compensating transaction (e.g., `CORRECTION_CREDIT` or `CORRECTION_DEBIT`), never a `DELETE` or `UPDATE` on existing ledger records.

---

## 3. Product Catalog & Publishing

1. **Publication Lifecycle**:
   - `DRAFT`: Visible only to creator and admins.
   - `PENDING_REVIEW`: Submitted for moderation.
   - `PUBLISHED`: Approved and publicly discoverable in the marketplace.
   - `REJECTED`: Declined with documented reviewer feedback.
   - `ARCHIVED`: Hidden from search; existing buyers retain entitlement access.
2. **Pricing Models**:
   - **Free (`isFree: true`)**: Price is 0 coins and ₹0. Requires an entitlement grant record before download.
   - **Coin-Only**: Fixed price in CPC Coins (e.g., 500 Coins).
   - **Fiat-Only**: Fixed price in INR (e.g., ₹499).
   - **Mixed Pricing**: User can choose either pure coins, pure fiat, or structured hybrid combinations (e.g., 250 Coins + ₹250).
3. **Pricing Snapshots**: Product price changes apply strictly to new purchases. Completed orders store an immutable snapshot of the price paid (`coinsPaid`, `moneyPaid`, product version, and license terms) at the time of purchase.
4. **Digital Asset Protection**:
   - Files are stored in private S3/R2 storage buckets without public read permissions.
   - Files are tagged with checksums (SHA-256), MIME types, file sizes, and semantic versions.

---

## 4. Purchase Engine & Idempotency

1. **Pre-Purchase Validation**: Server independently verifies:
   - User authentication and active status.
   - Product status (`PUBLISHED`).
   - Current price calculation.
   - User balance (`coinBalance >= coinsRequired`).
2. **Atomic Checkout Transaction**:
   The following operations occur inside a single PostgreSQL ACID transaction:
   - Deduct CPC Coins from user balance.
   - Create `CoinLedger` debit entry.
   - Create `Order` record with unique order number.
   - Create `Entitlement` granting user perpetual access to download the product version.
   - Increment product `totalSales` and `totalRevenueCoins`.
3. **Idempotency**: All checkout requests must carry an `idempotencyKey`. If a duplicate request arrives with the same key, the server returns the existing order result rather than executing a second debit.
4. **Refund Policy**:
   - Handled exclusively by administrators.
   - Refunds create a compensating `REFUND_CREDIT` ledger entry.
   - Product entitlement is revoked upon confirmed refund.

---

## 5. Daily Tasks & Rewards Engine

1. **Task Metadata**:
   - Each task has: `title`, `description`, `thumbnailUrl`, `instructions`, `rewardCoins`, `category`, `requiredDurationSeconds`.
   - Verification method: `TIMER` (minimum engagement duration), `CALLBACK` (external link provider webhook), or `MANUAL` (admin review).
2. **Server-Side Limits & Cooldowns**:
   - `maxCompletionsPerUser`: Lifetime cap per account (e.g., 1 time).
   - `cooldownHours`: Mandatory wait time between completions for recurring daily tasks (e.g., 24 hours).
   - `totalRewardBudget`: Maximum total coins distributed across all users. Once exhausted, the task automatically transitions to `BUDGET_EXHAUSTED` and blocks new attempts.
3. **Task Completion Flow**:
   - **Start**: Server creates a `TaskAttempt` with status `STARTED`, recording client IP, user agent, and timestamp. A cryptographically signed session token is returned.
   - **In Progress**: Client performs instructions. Browser return or timer expiration alone **never** grants coins.
   - **Verification**: Completion request sent with session token. Server verifies minimum elapsed time (`elapsed >= requiredDurationSeconds`), checks IP multi-accounting limits, validates third-party callback signatures where applicable, and verifies user cooldown.
   - **Award**: If verified, status changes to `COMPLETED` and coins are credited atomically via `awardCoins` inside a database transaction. Exactly one reward is issued per valid completion.

---

## 6. Short-Link Verification & Anti-Fraud

1. **Provider Capabilities & No-Fake-Rewards Policy**:
   - Official API inspection is mandatory before enabling automatic rewards for any provider.
   - **GPLinks Compliance**: GPLinks provides a Developers API for programmatic link shortening (`https://gplinks.com/api`), but does *not* provide real-time signed server callbacks or postbacks for individual conversion verification. Therefore, automatic reward crediting is strictly **disabled** for GPLinks. Returned user attempts are logged into the compliance ledger with status `PENDING_VERIFICATION` and queued for manual administrative review.
   - **Signed Postback Networks**: Monetized URL shorteners supporting server postbacks (e.g., AdLinkFly-compatible networks) are supported via `SignedPostbackAdapter`.
2. **Cryptographic Callbacks & Replay Prevention**:
   - Outbound link generation embeds unpredictable server-generated attempt references (`subid` / `click_id`).
   - Provider callbacks must submit valid cryptographic HMAC-SHA256 signatures generated with the server-configured `webhookSecret`.
   - Callbacks must include fresh timestamps; events older than 15 minutes (900 seconds) are automatically rejected as `EXPIRED`.
   - Provider event references are recorded permanently in `TaskCompletion.verificationReference` (`${providerSlug}:${providerEventId}`). Duplicate callbacks for the same event ID are rejected as `DUPLICATE` without double-crediting.
3. **Dedicated Return Route (`/tasks/return`)**:
   - Browser returns to `/tasks/return` display an automated polling screen querying `GET /api/v1/tasks/attempts/:id/status`.
   - Never trust client-side return parameters: `?status=success` or query flags in the browser never trigger coin issuance.
   - All reward credits are executed server-side via atomic transactions appending `TASK_REWARD` entries to the double-entry ledger.
4. **Secret Protection & Audit Logging**:
   - Provider API keys and callback secrets are stored exclusively on the server and masked in administrative client payloads.
   - All incoming postback events are recorded in `TaskCallbackEvent` with sensitive credentials redacted from stored JSON metadata.

---

## 7. Wallet & Fiat Deposits

1. **Lifecycle**:
   - `PENDING`: User creates a deposit request for ₹X (which yields Y CPC Coins based on the active conversion rate).
   - `PROCESSING`: Payment initiated via Razorpay / Cashfree SDK.
   - `COMPLETED`: Server receives and validates cryptographic webhook signature from the gateway. CPC Coins are credited atomically to the user's ledger.
   - `FAILED` / `EXPIRED`: Transaction timed out or was rejected by bank.
2. **Webhook Verification**:
   - Must verify raw webhook payload signature before parsing.
   - Webhook processing must be idempotent: duplicate delivery of `payment.captured` must not issue duplicate coins.
3. **Withdrawals**: Coin-to-fiat withdrawals are disabled by default. Coins are internal platform utility credits.

---

## 8. Protected Downloads & Entitlements

1. **Authorization Barrier**: The `/api/v1/downloads/:productId` endpoint requires an active `Entitlement` for the authenticated user (or product must be explicitly marked public free).
2. **Presigned URLs**: Direct storage bucket keys are never exposed. The server generates a short-lived presigned URL (valid for 15 minutes) with `Content-Disposition: attachment; filename="..."`.
3. **Rate Limiting**: Users are limited to 20 download token generations per day per product to prevent bandwidth abuse and scraping.

---

## 9. Ratings and Reviews

1. **Verified Reviews**: Only users with a completed `Entitlement` can submit a review for a paid product.
2. **Rating Bounds**: Numeric ratings are strictly bounded between 1 and 5 stars.
3. **Review Policy**: Users may edit or replace their existing review, but cannot submit multiple active reviews for the same product. Overall rating and review counts are updated transactionally.

---

## 10. Admin Governance & Audit Trail

1. **Least Privilege**: Staff roles are scoped to minimum required permissions.
2. **Immutable Audit Log**: Every administrative action (modifying user balance, banning an account, publishing/rejecting a product, altering task budgets) creates an append-only `AuditLog` row containing: `adminId`, `action`, `targetType`, `targetId`, `beforeState`, `afterState`, `ipAddress`, and `timestamp`.
