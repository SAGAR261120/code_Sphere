# CPC Marketplace — Changelog

All notable changes, architectural decisions, and phase completions are recorded here.

## [0.15.0] - 2026-10-13: Stage 14 Completed (Complete CPC Marketplace Integration)
### Added
- **Full End-to-End User Journey Verification (`tests/e2e-integration.test.ts`)**:
  - Implemented 12-step automated verification suite modeling the complete user lifecycle against live PostgreSQL:
    1. Account registration and automatic +50 welcome coins grant in wallet with `PROMO_BONUS` ledger entry.
    2. Authentication with password validation, session creation, and security token issuance.
    3. Product catalog discovery and search filtering (`/explore`).
    4. Dedicated product detail page inspection with technical specifications and public PDF documentation access.
    5. Daily reward task completion with anti-fraud engagement duration verification (`INSUFFICIENT_TIME` defense) and atomic `TASK_REWARD` credit.
    6. Wallet balance management and top-up verification.
    7. Digital product purchase using CPC Coins with row-level locking (`SELECT ... FOR UPDATE`), atomic debit, and idempotency deduplication.
    8. Order inspection in My Purchases (`/purchases`), license key retrieval, and 15-minute signed token generation (`StorageService`).
    9. Official PDF-1.4 transaction receipt generation with strict dual-currency segregation and statutory legal disclosures.
    10. Verified purchaser 5-star review submission with atomic recalculation of aggregate ratings and star distribution (`ProductRating`).
    11. Rejection of unentitled reviews by non-purchasing users with HTTP 403 `VERIFIED_PURCHASE_REQUIRED`.
    12. Transaction history inspection and downloadable CSV statement generation (`WalletService.generateCsvStatement`).
- **Full End-to-End Admin Governance Journey Verification (`tests/e2e-integration.test.ts`)**:
  - Implemented 7-step automated verification suite modeling administrator backoffice control:
    1. Digital product draft creation with versioning, feature highlights, and SemVer tags (`ProductService.createProduct`).
    2. Product publishing and approval verification making the product discoverable to public customers (`updateProductStatus`).
    3. Reward task creation with budget allocation, max daily completion limits, and cooldown intervals (`TaskService.adminCreateTask`).
    4. Short-link provider credential security check verifying secret masking (`ShortlinkService.getProviders`).
    5. Executive dashboard inspection verifying mathematical separation of CPC Coins redeemed from fiat INR revenue captured (`AdminControlService.getExecutiveDashboardMetrics`).
    6. Double-entry ledger audit scanning (`reconcileAllWallets`) and automated compensating transaction repair (`repairWalletDiscrepancy`).
    7. Platform audit log query inspection verifying administrative accountability (`AuditService.getLogs`).
- **Wallet Statement Generator (`WalletService.generateCsvStatement`)**:
  - Added dedicated CSV statement generator returning formal transaction logs with escaped columns and ISO timestamps.
- **Integration Quality & Verification Gates**:
  - Full test suite: 12 test files passed, 196/196 tests passed (100% pass rate).
  - Strict TypeScript typechecking (`npx tsc --noEmit`): 0 errors across all client, service, and test files.
  - Next.js 16 production build (`npm run build`): 76/76 routes compiled with exit code 0.

## [0.14.0] - 2026-10-13: Stage 13 Completed (Production Hardening & Deployment)
### Added
- **System Health & Readiness Probes (`/api/health`, `/api/ready`)**:
  - `/api/health`: Lightweight liveness probe reporting server uptime, memory usage metrics (RSS, Heap), timestamp, version, and 200 UP status.
  - `/api/ready`: Deep readiness probe querying PostgreSQL (`SELECT 1`), measuring DB latency, verifying essential environment configurations, returning 200 READY or 503 DEGRADED.
- **Production Structured Logging & Sensitive Data Redactor (`src/lib/logger.ts`, `src/lib/error-monitor.ts`)**:
  - Standardized JSON structured logging with configurable log thresholds (`LOG_LEVEL`).
  - Automatic recursive redaction of sensitive parameters: `password`, `token`, `secret`, `apiKey`, `authorization`, `creditCard`.
  - Correlation ID injection (`x-request-id`) tracking across requests.
  - Centralized security incident dispatcher (`ErrorMonitor.recordSecurityAlert`) writing to PostgreSQL `AuditLog` and creating user security notifications.
- **Sliding Window Rate Limiter & Root Middleware (`src/lib/rate-limiter.ts`, `src/middleware.ts`)**:
  - High-performance in-memory sliding window rate limiter with periodic cleanup.
  - Tiered rate limits: AUTH (10 req/min), PAYMENT (15 req/min), DOWNLOAD (30 req/min), ADMIN (60 req/min), DEFAULT (120 req/min).
  - Standard HTTP 429 response formatting with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
  - Enforced production HTTP security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and HSTS.
- **Legal & Compliance Infrastructure**:
  - Terms of Service (`/terms`): Formal platform rules, internal utility credit definition, acceptable use, anti-bot policies, Indian governing law.
  - Privacy Policy (`/privacy`): DPDP Act compliance, data retention, rights to account deletion, minimal data collection.
  - Buyer Protection & Refund Policy (`/refund-policy`): 48-hour defect window, compensating ledger credits, license key revocation.
  - Commercial License Agreement (`/licenses`): Permitted commercial uses vs resale restrictions.
  - Integrated responsive `AppFooter` into `AppShell`.
- **Database Backup, Restore & Disaster Recovery Scripts**:
  - `scripts/backup-db.ps1` & `scripts/backup-db.sh`: Automated timestamped PostgreSQL backups with 14-day retention rotation.
  - `scripts/restore-db.ps1` & `scripts/restore-db.sh`: Safety-guarded restoration scripts with mandatory confirmation prompt.
- **Operational Runbooks & Multi-Environment Configurations**:
  - Authored `docs/OPERATIONAL_RUNBOOKS.md` detailing 5 incident standard operating procedures.
  - Created `.env.staging.example` and `.env.production.example`.
  - Updated `docs/DEPLOYMENT.md` with multi-environment topology, CORS, PgBouncer, and rollback instructions.
  - Updated `docs/SECURITY.md` with full 16-vector audit results and prioritized production blockers.
- **Automated Testing & Build Verification**:
  - Added 11 automated security tests in `tests/security.test.ts`.
  - Full test suite: 11 test files passed, 177/177 tests passed (100% pass rate).
  - Strict TypeScript typechecking (`npx tsc --noEmit`): 0 errors.
  - Next.js production build (`npm run build`): 76/76 routes compiled with exit code 0.

## [0.13.0] - 2026-10-13: Stage 12 Completed (PDF Documentation & Download Center)
### Added
- **Database Schema & Prisma Migration (`20261013025419_phase12_product_documentation`)**:
  - Added `DocumentType` enum (`OVERVIEW`, `MANUAL`, `INSTALLATION_GUIDE`, `TECHNICAL_SPEC`, `API_DOC`, `LICENSE`, `CHANGELOG`, `RECEIPT`).
  - Added `ProductDocumentation` model with relations to `Product`, tracking storage key, file size, version, language, public visibility, download count, and timestamps.
- **Validations & Service Layer (`src/lib/validations/documentation.schema.ts`, `src/services/documentation.service.ts`)**:
  - `createDocumentationSchema` and `documentationQuerySchema` with strict input boundary validations.
  - Cross-platform PDF-1.4 binary stream generator (`buildPdfBuffer`) rendering compliant Courier typography, stream lengths, text operators (`BT ... ET`), catalog, and trailer xrefs without heavy external binary dependencies.
  - Access control engine: Public documentation (`isPublic: true`) accessible without authentication; private/paid documentation (`isPublic: false`) restricted to verified purchasers with active `PurchaseEntitlement` (`isRevoked: false`) and platform administrators.
  - Automated default documentation seeder (`ensureDefaultDocs`): auto-generates overview and developer manuals for published products so all catalog items have real downloadable documentation.
  - Official order invoice / receipt PDF generator (`generateOrderReceiptPdf`): Generates downloadable transaction receipts with order reference, items breakdown, license keys, and strict legal disclosures distinguishing CPC Coins (internal marketplace utility credits) from Indian Rupees (fiat).
- **API Endpoints**:
  - `GET /api/v1/products/:slug/documentation`: Product documentation listing with dynamic access flags (`accessGranted`, `requiresPurchase`).
  - `GET /api/v1/documentation/:id/download`: Streams authorized binary PDF (`application/pdf`) with atomic download counter incrementation.
  - `POST /api/v1/admin/products/:id/documentation`: Admin creates or generates product overview, manual, or technical specification.
  - `DELETE /api/v1/admin/documentation/:id`: Admin removes documentation record.
  - `GET /api/v1/orders/:id/receipt`: Streams official PDF transaction invoice / receipt.
- **UI Components & User Experience**:
  - Created `ProductDocumentationSection` (`src/components/marketplace/ProductDocumentationSection.tsx`): Dedicated tab on product details page (`/products/[slug]`) displaying document type icons, public vs purchaser tags, version, language, file size chips, and direct download actions.
  - Updated `src/app/products/[slug]/page.tsx`: Integrated `ProductDocumentationSection` into tab navigation strip.
  - Updated `src/app/purchases/page.tsx`: Added "PDF Invoice" download button for each completed order.
- **Automated Testing & Build Verification**:
  - Added 14 unit and integration tests in `tests/documentation.test.ts`.
  - Full test suite: 10 test files passed, 166/166 tests passed (100% pass rate).
  - Zero TypeScript errors (`npx tsc --noEmit`).
  - Clean Next.js 16 production build (`npm run build`) with exit code 0.

## [0.12.0] - 2026-10-13: Stage 11 Completed (Reviews, Recommendations & Notifications)
### Added
- **Verified Purchaser Ratings & Reviews Engine (`ReviewService`, `GET /api/v1/products/:slug/reviews`, `POST /api/v1/products/:slug/reviews`)**:
  - Enforced Rule 6 server validation: Verified purchase required (`PurchaseEntitlement` check where `isRevoked: false`) to submit reviews; unauthorized users rejected with 403 `VERIFIED_PURCHASE_REQUIRED`.
  - 1 active review per user per product enforced with unique compound constraint `@@unique([userId, productId])` and controlled editing (updating existing reviews).
  - Strict 1–5 star rating constraint; arbitrary rating totals or client-supplied averages rejected.
  - Live atomic recalculation of `ProductRating` aggregates (`averageRating`, `reviewCount`, and 1-star through 5-star count and percentage distribution) in PostgreSQL transaction.
  - Sorting support: newest, highest rated, lowest rated, plus rating filter.
  - Distinct "Verified Purchase" badges on all purchaser reviews.
- **Review Reporting & Content Moderation (`ReviewReport`, `POST /api/v1/reviews/:id/report`, `GET /api/v1/admin/reviews/reports`, `POST /api/v1/admin/reviews/reports/:id/dismiss`)**:
  - Community flagging with mandatory reason (min 5 chars).
  - Anti-abuse defense: Prevents self-reporting (`CANNOT_REPORT_OWN_REVIEW`) and duplicate reports per user on the same review (`ALREADY_REPORTED`).
  - Admin reported reviews queue with live report statuses (`PENDING`, `RESOLVED`, `DISMISSED`) and flag dismissal actions.
  - Automated report resolution: Moderating or hiding a review automatically resolves all associated pending reports.
- **Product Discovery & Smart Recommendations (`RecommendationService`, `GET /api/v1/products/:slug/recommendations`, `GET /api/v1/recommendations`)**:
  - Multidimensional matching scoring: Category alignment (+15), shared discovery tags (+5/tag), tech stack overlap (+4/tech), plus sales and ratings weighting.
  - Privacy preservation: User purchase histories privately inspected to generate recommendations; private customer records or identities never leaked in public APIs.
  - Cold-start & limited-data fallback: Transparently backfills with trending and top-rated catalog items.
- **In-App Notifications Lifecycle Engine (`NotificationService`, `NotificationBell`, `GET/PATCH /api/v1/notifications`)**:
  - Extended `NotificationType` enum with `PRODUCT_UPDATE`, `TASK_VERIFICATION`, and `SECURITY_ALERT`.
  - In-app notification triggers on: `PURCHASE_SUCCESS`, `DEPOSIT_COMPLETED`, `TASK_REWARD`, `PRODUCT_UPDATE`, `REFUND_PROCESSED`, `SECURITY_ALERT`.
  - Real-time unread count badge, interactive dropdown popover (`NotificationBell`), type-specific color icons, deep action URLs, single mark-as-read, and mark-all-read.
  - Version release alerts: Notifies all holders of active licenses when new versions are released.
- **Client Analytics & Telemetry Engine (`AnalyticsService`, `POST /api/v1/analytics/events`, `GET /api/v1/admin/analytics/summary`)**:
  - Real database event tracking (`AnalyticsEvent`) for `SEARCH`, `PRODUCT_VIEW`, `PURCHASE_INTENT`, `PURCHASE`, `DOWNLOAD`, `TASK_ENGAGE`.
  - Automatically increments product view counters on `PRODUCT_VIEW`.
  - Admin telemetry aggregation over configurable timeframes.
- **UI Enhancements**:
  - `src/components/layout/AppHeader.tsx`: Integrated interactive `NotificationBell` with live unread badge and dropdown.
  - `src/app/products/[slug]/page.tsx`: Replaced legacy review tab with `ProductReviewsSection` (breakdown chart, star selector, sorting, reporting dialog) and `ProductRecommendationsShelf`.
  - `src/components/admin/AdminReviewsTab.tsx`: Added "Reported Reviews Queue" sub-tab with flag dismissal and one-click moderation.
- **Automated Testing & Build Verification**:
  - Added 25 unit and integration tests in `tests/interaction.test.ts`.
  - Full test suite: 9 test files passed, 152/152 tests passed (100% pass rate).
  - Zero TypeScript errors (`npx tsc --noEmit`).
  - Next.js Turbopack production build compiled across 70 routes with exit code 0.

## [0.11.0] - 2026-10-12: Stage 10 Completed (CPC Marketplace Admin Control Center)
### Added
- **Executive Marketplace Dashboard (`GET /api/v1/admin/dashboard` & `AdminOverviewTab`)**:
  - Live database-backed metrics: Registered users, active users, published products, completed & refunded orders, fiat revenue in paise and formatted rupees (₹), CPC Coins issued and redeemed, circulating balance, pending deposits, task completions, reward costs, signed download events, and postback rejections.
  - Strict Dual-Currency Segregation: Prominent balance cards clearly distinguishing real fiat currency (INR rails) from internal utility credits (CPC Coins).
  - Quick Governance Jumps: 1-click navigation into orders, reviews, platform settings, ledger reconciliation scanner, gateway rails, and short-link postbacks.
  - Live Activity Feeds: Real-time chronological streams of recent orders, fiat deposits, verified task completions, and system audit logs.
- **Order & Entitlement Lifecycle Management (`GET /api/v1/admin/orders`, `GET /api/v1/admin/orders/:id`, `POST /api/v1/admin/orders/:id/refund` & `AdminOrdersTab`)**:
  - Search by order number, customer email, or product title with status (`COMPLETED`, `REFUNDED`, `PENDING`, `CANCELLED`) and payment method filters.
  - Detailed Order Drawer/Modal: Inspects order snapshots, items, version specifications, commercial license keys (`CPC-LIC-...`), max download limits, and presigned download audit events (`DownloadEvent` with client IP and timestamps).
  - Audited Admin Refund Workflow: Enforces atomic `SELECT ... FOR UPDATE` row locking on customer wallet, restores coins, appends compensating `REFUND_CREDIT` double-entry ledger entry, marks order as `REFUNDED`, revokes license key (`isRevoked = true`), and records an immutable `AuditLog` entry with mandatory justification.
- **Product Reviews & Content Moderation (`GET /api/v1/admin/reviews`, `PATCH /api/v1/admin/reviews/:id/moderate`, `DELETE /api/v1/admin/reviews/:id` & `AdminReviewsTab`)**:
  - Filterable moderation queue supporting 1 to 5 star ratings, approval status (`APPROVED` vs `HIDDEN`), and keyword searches.
  - Review moderation action: Approve or hide review with mandatory audit reason.
  - Abusive review deletion: Permanently delete inappropriate content with compliance justification.
  - Automatic Aggregate Recalculation: Dynamically recalculates `ProductRating` average rating (to 2 decimal places), review count, and 1 to 5 star distributions in a transaction.
- **Platform Governance Policies & System Audit Logs (`GET /api/v1/admin/settings`, `PUT /api/v1/admin/settings` & `AdminSettingsTab`)**:
  - 5 Operational Setting Categories: GENERAL (brand title, tagline, support email), FINANCIAL (daily issuance limit, max wallet balance, conversion rate, min/max deposits), SECURITY (max failed logins, lockout minutes, presigned URL expiry), NOTIFICATIONS (order alerts, reward alerts, callback failure warnings), and LEGAL (terms version, refund window hours, RBI compliance notice).
  - Audited Settings Updates: Atomic transaction recording before-and-after diffs with mandatory justification.
  - Product Category Management: Create new catalog taxonomy categories with slug and description.
  - Full System Audit Log Inspector: Live query to `/api/v1/admin/audit` with action and target entity filters.
- **Security & Authorization Hardening**:
  - Role-based server authorization (`requireRole(req, ["ADMIN", "SUPER_ADMIN"])`) enforced on all privileged routes.
  - Sensitive operations (role assignment, platform setting modifications) strictly guarded by `SUPER_ADMIN` requirement.
  - Immutable audit trail: All status transitions, role changes, refunds, review moderation, and policy updates record admin ID, action, target entity, reason, and metadata.
- **Automated Testing & Build Verification**:
  - Added 17 unit and integration tests in `tests/admin.test.ts` covering dashboard aggregations, order queries, refund mechanics, review moderation, settings diffs, and safety invariants.
  - Full test suite: 8 test files passed, 127/127 tests passed (100% pass rate).
  - Zero TypeScript errors (`npx tsc --noEmit`).
  - Next.js Turbopack production build compiled across 63 routes with exit code 0.

## [0.10.0] - 2026-10-12: Stage 9 Completed (Verified Short-Link Reward Integration)
### Added
- **Short-Link Provider Adapter Architecture**:
  - Researched GPLinks official Developer API capabilities: confirmed lack of real-time signed callbacks or postbacks. Implemented strict compliance with Rule 6 & 7 (automatic rewards disabled; attempts marked `PENDING_VERIFICATION` / queued for manual review).
  - Built extensible adapter interface `IShortlinkProviderAdapter` with pluggable adapters:
    - `GPLinksAdapter`: Official link shortening via `https://gplinks.com/api` with alias, secure tracking target, and manual review enforcement.
    - `SignedPostbackAdapter`: Generic / AdLinkFly-compatible postback receiver with cryptographic HMAC-SHA256 signature verification, 15-minute timestamp expiration window, and single-reward replay protection.
    - `ManualReviewAdapter`: For proof-submission and human-verified campaigns.
    - `getShortlinkAdapter`: Registry and factory function resolving provider adapters.
- **Dedicated Return & Status Polling Route (`/tasks/return`)**:
  - Processing screen with animated polling indicator (`GET /api/v1/tasks/attempts/:id/status`) every 3 seconds up to 45 seconds.
  - Zero-Trust Redirect Security: Completely ignores client-side query parameters (`status=success` never issues coins); verifies true database status only.
  - Transparent user notices for manual review providers (GPLinks): clearly explains pending status and audit logging.
  - Instant reward confirmation dialog on verified callbacks with direct wallet navigation.
- **Server-Side Verification & Anti-Fraud Engine (`ShortlinkService`)**:
  - `startShortlinkSession`: Checks active task status, budget, cooldowns, and user limits; generates unpredictable 64-char crypto session token; calls adapter to construct shortened link with attempt subid; updates attempt record.
  - `processCallback`: Authenticates incoming postback/webhook, rejects disabled or unknown providers, executes adapter signature verification, detects replay attacks (`duplicate: true` on used provider event IDs), enforces atomic double-entry ledger credit (`TASK_REWARD`), updates `RewardBudget`, and logs `TaskCallbackEvent`.
  - Sensitive token sanitization: Automatically redacts API keys, tokens, and secrets from logged callback payloads.
- **Admin Short-Link Control Center (`/admin` Short-Links & Callbacks Tab)**:
  - Configured Providers table: View name, slug, base URL, verification type, masked API keys and webhook secrets, and status toggles.
  - "Add Short-Link Provider" modal: Register custom shortener networks with base URL, HMAC secrets, and permitted domains.
  - Callback Event Log inspector (`TaskCallbackEvent`): Filterable, searchable table displaying timestamps, provider, event IDs, attempt references, outcome badges (`VERIFIED`, `DUPLICATE`, `INVALID_SIGNATURE`, `UNSUPPORTED`), and a sanitized JSON payload inspector modal.
- **REST API Endpoints (v1)**:
  - `POST /api/v1/tasks/:id/start-link`: Initiate short-link attempt with provider adapter.
  - `GET /api/v1/tasks/attempts/:id/status`: Poll attempt verification state for return page.
  - `ALL /api/v1/tasks/callback/:provider`: Secure provider callback webhook receiver (GET & POST).
  - `GET /api/v1/admin/shortlinks/providers`: List providers with masked credentials.
  - `POST /api/v1/admin/shortlinks/providers`: Create new shortlink provider.
  - `PATCH /api/v1/admin/shortlinks/providers/:id`: Update provider configuration.
  - `POST /api/v1/admin/shortlinks/providers/:id/toggle`: Toggle provider operational status.
  - `GET /api/v1/admin/shortlinks/events`: Paginated callback event audit logs.
- **Database Migration & Seeding**:
  - Migration `20261012185634_add_shortlink_provider_and_callback_events`: Expanded `TaskProvider`, added `TaskCallbackEvent` audit table, added `shortUrl` and `providerEventId` to `TaskAttempt`.
  - Seeded default providers (`gplinks`, `signed-postback`) and short-link tasks.
- **Automated Testing & Build Verification**:
  - Added 14 unit and integration tests in `tests/shortlink.test.ts` covering provider adapter resolution, GPLinks no-fake-reward compliance, HMAC-SHA256 signature verification, forged signature rejection, missing signature rejection, expired timestamp rejection (> 15m), malformed payload rejection, and Zod parameter bounds.
  - Full test suite: 7 test files passed, 110/110 tests passed (100% pass rate).
  - Zero TypeScript errors (`npx tsc --noEmit`).
  - Next.js Turbopack production build compiled across 59 routes with exit code 0.

## [0.9.0] - 2026-10-12: Stage 8 Completed (CPC Earn Coins and Daily Task System)
### Added
- **Complete Task & Rewards Engine Backed by PostgreSQL**:
  - Implemented `TaskService.getEarnDashboardData`: Computes real-time user eligibility, daily completion counts, remaining attempts, next eligible time ISO stamps, today's earnings sum, pending rewards, consecutive completion streak, and recent history.
  - Implemented `TaskService.getTaskBySlug`: Detailed task lookup with instruction specs, embedded media, and user session progress.
  - Implemented `TaskService.startTaskAttempt`: Atomically verifies publication status and non-exhausted budget; enforces server-side cooldowns and daily user limits (`maxDailyCompletions`); creates unpredictable cryptographic session tokens (`crypto.randomBytes(32)`).
  - Implemented `TaskService.verifyTaskCompletion`: Cryptographic token verification; enforces minimum required engagement duration (`INSUFFICIENT_TIME` anti-fraud); executes atomic PostgreSQL transaction issuing `TaskCompletion`, updating `RewardBudget`, acquiring `SELECT ... FOR UPDATE` row lock on `CoinWallet`, crediting coins, and appending an immutable `TASK_REWARD` transaction to the double-entry ledger.
- **User Task Dashboard (`/earn`) & Dedicated Detail Pages (`/earn/[slug]`)**:
  - Replaced legacy demo data with live `/api/v1/tasks` database integration.
  - Built comprehensive stats banner (Balance, Earned Today, Active Streak, Available Today).
  - Built featured daily opportunity showcase with quick action buttons.
  - Built task filtering (`ALL`, `AVAILABLE`, `COOLDOWN`, `COMPLETED`).
  - Interactive Task Cards with real-time countdown timers (`HH:MM:SS`), difficulty ratings, and category chips.
  - Dedicated SEO-friendly Task Detail Page (`/earn/[slug]`) with instruction markdown guide, media previews (YouTube video embeds & screenshots), rules breakdown, and interactive session runner (live countdown, external link launcher, anti-fraud duration verification).
- **Admin Task Governance & Control Center (`/admin` Tasks Tab)**:
  - Analytics strip: Total Starts, Verified Completions, Completion Rate %, Fraud Flagged %, Coins Paid Out, and Remaining Reward Budget.
  - Full CRUD operations: Create Task, Edit Task, Pause/Resume (`/toggle`), Duplicate (`/duplicate`), and Archive (`DELETE`).
  - Search by title, slug, or description; filter by status (`ACTIVE`, `PAUSED`).
  - Full modal form configuring title, slug, reward, required seconds, cooldown hours, daily user limits, total budget, category, difficulty, target URL, and video/image media.
- **REST API Endpoints (v1)**:
  - `GET /api/v1/tasks`: Live Earn dashboard payload with user stats and task statuses.
  - `POST /api/v1/tasks`: Start task attempt with anti-fraud tracking.
  - `GET /api/v1/tasks/[id]`: Task details by slug or ID.
  - `POST /api/v1/tasks/[id]/verify`: Verify engagement and credit reward coins.
  - `GET /api/v1/tasks/history`: Paginated user task completion history.
  - `GET /api/v1/admin/tasks`: Administrative task list with stats.
  - `POST /api/v1/admin/tasks`: Create new reward task.
  - `PATCH /api/v1/admin/tasks/[id]`: Update task properties.
  - `POST /api/v1/admin/tasks/[id]/toggle`: Pause or resume task.
  - `POST /api/v1/admin/tasks/[id]/duplicate`: Duplicate task.
  - `DELETE /api/v1/admin/tasks/[id]`: Archive or delete task.
  - `GET /api/v1/admin/tasks/analytics`: Real-time task analytics summary.
- **Automated Testing & Build Verification**:
  - Added 16 unit and integration tests in `tests/task.test.ts` covering Zod validation, duration anti-fraud (`INSUFFICIENT_TIME`), timing-safe tokens, cooldown math, daily completion limits, single-completion invariant (`ALREADY_COMPLETED`), budget exhaustion (`BUDGET_EXHAUSTED`), atomic ledger entries, and admin analytics.
  - Total 96/96 tests passing in Vitest test runner.
  - Production build successfully validated across 56 routes with exit code 0.

## [0.8.0] - 2026-10-12: Stage 7 Completed (Product Purchasing and Downloads)
### Added
- **CPC Coin Product Purchase Lifecycle & Atomic Checkout Engine**:
  - Implemented `OrderService.checkPurchaseEligibility`: Verifies product publication status, active version availability, existing active entitlement check (Rule 4), user coin balance, and calculation of missing coins.
  - Implemented `OrderService.checkoutOrder`: Atomic PostgreSQL transaction executing with `SELECT ... FOR UPDATE` row-level locking on `CoinWallet`. Enforces negative balance defense (`INSUFFICIENT_BALANCE`), debits coins, logs an immutable `PURCHASE_DEBIT` ledger transaction, creates snapshot `Order` & `OrderItem` records with formatted unique order numbers (`CPC-YYYYMM-XXXX`), and issues a perpetual commercial `PurchaseEntitlement` with a unique license key (`CPC-LIC-[SLUG]-[HEX]-2026`).
  - Supported `FREE` and `COINS` payment methods with strict backend revalidation preventing unpaid checkouts.
  - Idempotency deduplication: Duplicate purchase requests with the same `idempotencyKey` replay the existing order and entitlement without double charging coins or generating duplicate entitlements.
  - Immutable historical order price snapshotting: Product price changes never mutate historical order records or debit amounts.
- **Private Object Storage & Cryptographic Download Security**:
  - `StorageService.generateDownloadToken`: Generates short-lived (15-minute) HMAC-SHA256 cryptographically signed tokens containing `fileId`, `userId`, `entitlementId`, and expiration Unix timestamp.
  - `StorageService.verifyDownloadToken`: Enforces timing-safe signature comparison (`crypto.timingSafeEqual`), checks expiration, and rejects forged, tampered, or expired tokens with strict error codes (`FORBIDDEN_SIGNATURE`, `TOKEN_EXPIRED`).
  - `StorageService.recordDownloadEvent`: Atomically verifies entitlement ownership and non-revocation, enforces rate-limiting download quotas (`downloadCount < maxDownloads`), increments entitlement and product download counters, and records `DownloadEvent` audit logs.
  - Valid PDF-1.4 Commercial License Certificate stream generator (`StorageService.generatePdfCertificate`): Generates verifiable PDF certificates with licensee email, order reference, issued date, and license key terms.
  - Software package bundle generator (`StorageService.generatePackageArchive`): Generates standard ZIP archive packages (`PK\x03\x04`) including customized README, installation guide, and commercial license key.
- **Configurable Refund Policy & Compensating Ledger Transactions**:
  - `OrderService.requestOrProcessRefund`: Validates that the order is `COMPLETED` and requested within the 48-hour policy window (with administrator override).
  - Rule 2 & Rule 13 compliance: Never deletes historical `Order` or `CoinTransaction` rows. Atomically restores coins to user wallet, records a compensating `REFUND_CREDIT` transaction in the append-only ledger, updates order status to `REFUNDED`, revokes the entitlement (`isRevoked: true`), and creates an `AuditLog` entry.
- **REST API Endpoints (v1)**:
  - `GET /api/v1/products/[slug]/eligibility`: Real-time product price, entitlement check, and coin affordability breakdown.
  - `POST /api/v1/orders/checkout`: Atomic checkout with idempotency and balance validation.
  - `GET /api/v1/orders`: Paginated user order history with items, versions, and active entitlement references.
  - `GET /api/v1/orders/[id]`: Detailed order receipt with authorization enforcement.
  - `POST /api/v1/orders/[id]/refund`: Order refund endpoint with minimum 10-char reason validation.
  - `POST /api/v1/downloads/signed-url`: Generates 15-minute signed download tokens for entitled users.
  - `GET /api/v1/downloads/[token]`: Validates signed token, records `DownloadEvent`, and streams package download with secure anti-sniff headers.
  - `GET /api/v1/downloads/pdf/[entitlementId]`: Validates entitlement and streams official PDF License Certificate.
- **User Interface Enhancements**:
  - Replaced mock purchase context with live database `/purchases` page: order filtering, package downloads, PDF certificate downloads, 1-click license key copying, download quotas (`X / 15`), and interactive refund modal.
  - Redesigned `CheckoutModal.tsx`: Real-time coin balance check, insufficient coin alert with top-up/earn CTAs, license selector, and instant purchase receipt dialogue.
  - Wired live product detail page (`/products/[slug]`): Real-time eligibility check, "Owned & Entitled" badges, and instant checkout trigger.
- **Automated Testing & Build Verification**:
  - Added 24 unit and integration tests in `tests/purchase.test.ts` covering Zod schemas, HMAC tokens, PDF/ZIP generation, overdraft defense, atomic debits, idempotency replays, duplicate ownership rejection, 48h refund rules, compensating transactions, and download quota limits.
  - Total 80/80 tests passing in Vitest test runner.
  - Production build successfully validated across 52 routes with exit code 0.

## [0.7.0] - 2026-10-12: Stage 6 Completed (Deposits and Payment Gateway)
### Added
- **Pluggable Payment Provider Adapter Architecture (`IPaymentProviderAdapter`)**:
  - Implemented decoupling interface enabling payment provider replacements without modifying wallet or accounting logic.
  - `RazorpayAdapter`: Designed for approved Indian payment rails (UPI, NetBanking, Cards). Implements HMAC-SHA256 signature verification with constant-time buffer comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
  - `SandboxPaymentAdapter`: Deterministic local development adapter for offline verification without simulated production bypasses.
  - Dynamic factory `getPaymentAdapter(gateway)` providing fallback safety.
- **Deposit Intent & Double-Entry Accounting**:
  - `DepositService.createDepositIntent`: Validates user state, verifies compliance master switch (`DEPOSITS_ENABLED`), enforces minimum (₹100 = 10,000 paise) and maximum (₹50,000 = 5,000,000 paise) bounds, calculates exact coin credits via configurable conversion rule (`conversionRatePaise`), and creates initial `PENDING` deposit and gateway order.
  - `DepositService.processPaymentSuccess`: Transactional execution using PostgreSQL row lock (`FOR UPDATE`) on `CoinWallet`. Records atomic `DEPOSIT_CREDIT` entry in immutable append-only `CoinTransaction` ledger.
  - Strict idempotency & replay protection: If deposit is already `COMPLETED`, returns `{ alreadyProcessed: true }` without touching user wallet or ledger.
- **Payment Safety & Anti-Fraud Invariants (Rule 6 & Rule 7 Compliance)**:
  - Frontend success redirects are strictly prohibited from crediting coins; only server-side cryptographic verification or signed webhooks authorize credit.
  - Webhook verification: Validates amount, currency (INR), order ID, payment status, and provider signature against server secret.
  - Raw webhook event audit logging (`PaymentWebhookEvent`) tracking event ID, gateway, payload, processed state, and failure logs.
  - Stale deposit reconciliation scanner (`reconcilePaymentEvents`): Detects abandoned pending deposits older than 30 minutes and auto-expires them.
- **Secret Masking & Security Invariant**:
  - Server-side environment variables `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are never exposed to the frontend or returned by public/admin APIs.
  - `DepositService.getDepositConfig` exposes public `razorpayKeyId` while completely masking secret credentials.
- **User Deposit Experience (`DepositModal.tsx`)**:
  - Direct integration with `/api/v1/deposits/config` fetching live conversion rates and bounds.
  - Preset packages (Starter ₹100, Developer ₹250, Pro ₹500, Studio ₹1,000, Enterprise ₹5,000) and custom INR inputs.
  - Real-time coin conversion calculator.
  - End-to-end checkout with gateway verification and official cryptographic deposit receipt dialogue.
- **Admin Governance Center (`/admin` Deposits Tab)**:
  - Real-time KPI strip: Gateway Status (Active/Gated), Total Completed Fiat Volume (₹), Total Transactions, Webhook Logs trigger.
  - Gateway Configuration Form: Master switch (`depositsEnabled`), adapter selector, min/max paise limits, conversion rate, and compliance notices.
  - Payment Event Reconciliation console: On-demand scanner identifying stale pending deposits with audit reports.
  - Deposits Ledger Table: Search by Deposit ID, Gateway Order ID, or User Email; status filters (`ALL`, `COMPLETED`, `PENDING`, `FAILED`, `REFUNDED`), and pagination.
  - Official Deposit Receipt modal and raw Webhook Delivery Audit modal.
- **Automated Testing & Build Verification**:
  - Added 18 automated unit and integration tests in `tests/deposit.test.ts` covering Zod bounds, HMAC-SHA256 signatures, adapter resolution, single-credit invariant, idempotency replays, compliance gating, and secret protection.
  - Total 56/56 tests passing in Vitest test runner.
  - Production build successfully validated across 50 routes with exit code 0.

## [0.6.0] - 2026-10-12: Stage 5 Completed (CPC Coin Wallet and Ledger)
### Added
- **Append-Only Double-Entry Ledger Engine**:
  - Implemented transactional row-level locking (`SELECT ... FOR UPDATE`) in `WalletService` to eliminate race conditions, double spending, and concurrent balance drift.
  - Strict balance invariant enforced: `balanceAfter = balanceBefore + amount` recorded on every immutable `CoinTransaction`.
  - Negative balance protection: debits exceeding available balance immediately rejected (`INSUFFICIENT_BALANCE`).
  - Zero/negative credit validation: non-positive amounts rejected (`INVALID_AMOUNT`).
  - Strict idempotency key deduplication: duplicate request tokens return existing records without re-executing balance mutations.
  - Escrow hold and release mechanism (`holdCoins`, `releaseHeldCoins`) to separate spendable from committed funds.
- **Ledger Reconciliation Scanner & Auto-Repair Engine**:
  - Single wallet reconciliation (`reconcileWallet`) verifying `availableBalance === sum(transactions.amount)` in real time.
  - System-wide reconciliation scanner (`reconcileAllWallets`) auditing every registered account and surfacing variances.
  - Administrative auto-repair tool (`repairWalletDiscrepancy`) that generates audited compensating ledger transactions to rectify variances without destructive edits.
- **Statement Generation & Export**:
  - Statement generator (`generateStatement`) supporting official CSV and JSON formats.
  - Formatted CSV includes standard financial headers: Transaction ID, Receipt Number, Timestamp (UTC), Type, Direction, Amount, Balance After, Description, Reference Type, Reference ID, and Idempotency Key with RFC 4180 escaping.
- **API Endpoints (v1)**:
  - `GET /api/v1/wallet`: Returns wallet balances (available, locked, pending), reconciliation audit status, and paginated/filtered transactions.
  - `GET /api/v1/wallet/transactions/:id`: Returns detailed transaction receipt with polymorphic reference metadata (orders, deposits, tasks).
  - `GET /api/v1/wallet/statement`: Exports CSV or JSON financial statements.
  - `GET /api/v1/wallet/reconcile`: User ledger consistency check.
  - `GET /api/v1/admin/wallet/economy`: System-wide coin circulation KPIs, 24h volume, liability totals, and fraud patterns.
  - `GET /api/v1/admin/wallet/reconcile`: Platform-wide ledger audit scanner.
  - `POST /api/v1/admin/wallet/repair`: Administrative discrepancy resolution.
  - `GET /api/v1/admin/wallet/config` and `PUT /api/v1/admin/wallet/config`: Platform coin policy configuration.
  - `POST /api/v1/wallet/adjust`: Audited coin adjustments requiring mandatory documented reason and creating immutable `AuditLog` records.
- **User Wallet Experience (`/wallet`)**:
  - Connected directly to PostgreSQL backend.
  - Financial position cards: Available Balance, Held in Escrow, Pending Deposits, and Lifetime Accounting (Earned / Spent).
  - Real-time ACID Ledger Integrity badge verifying consistency with clickable re-audit.
  - Multi-facet transaction filter toolbar (type dropdown, credit/debit toggles, keyword search).
  - Interactive transaction receipt modal displaying cryptographic receipt number, balance impact, and linked entity pointers.
  - 1-click "Export Statement (CSV)" button.
- **Admin Economy Control Center (`/admin`)**:
  - Dedicated "Economy & Wallet Control" governance tab.
  - Real-time KPI cards: Circulating Supply, Escrow Total, 24h Volume, and System Soundness.
  - Double-Entry Reconciliation Scanner table with discrepancy alerts and auto-repair actions.
  - Audited Coin Adjustment console with user selector, signed delta, and mandatory audit reason.
  - Platform Coin Economy Policy editor (issuance limits, max wallet balance, min deposit, promo limits, expiry).
- **Automated Testing & Build Verification**:
  - Added 13 automated unit and integration tests in `tests/wallet.test.ts` covering financial constraints, negative balance defense, idempotency, reconciliation, CSV generation, and escrow hold mechanics.
  - Total 38/38 tests passing in Vitest test runner.
  - Production build successfully validated across 45 routes with exit code 0.

## [0.5.0] - 2026-10-12: Stage 4 Completed (Digital Product Marketplace)
### Added
- **Digital Product Catalog Engine**:
  - Full support for all 10 digital product categories: Web applications, Android applications, iOS applications, Website templates, Complete websites, SaaS applications, Admin dashboards, Source code packages, Developer tools, and UI kits & digital assets.
  - Category retrieval service (`CategoryService`) calculating live counts of published products per category.
  - Stored actual supported platforms (`platforms: String[]`) and technical specifications (`techStack: String[]`, `setupGuideMarkdown`).
  - Implemented SemVer version management with release notes and storage key links.
  - Implemented user review submission with automated aggregate star recalculation (`averageRating`, `totalReviews`).
- **Marketplace Home Discovery Shelves**:
  - Live data retrieval from database for Featured, Trending, Recently Added, Top-Rated, Free, and Popular Categories.
  - Mathematically defined and ordered trending metric: `(totalSales * 5 + viewCount) DESC`.
  - Atomic product view count increments (`viewCount: { increment: 1 }`) on slug access.
- **Enhanced Product Card Primitive**:
  - Displays product thumbnail, title, short description, category badge, and interactive platform chips.
  - Average rating star display with review count.
  - Dual pricing: CPC Coin price + optional fiat reference conversion (`≈ ₹X` at ₹1 = 1 CPC Coin).
  - Screenshot counter pill and Free/Paid indicator badge.
- **Search & Multi-Facet Filtering (`/explore`)**:
  - Full bidirectional URL query parameter synchronization (`search`, `category`, `platform`, `pricing`, `minRating`, `sort`, `page`).
  - Support for shareable search URLs with client hydration and server-side execution.
  - Sorting options: Trending, Most Popular, Highest Rated, Newest, Lowest Price, Highest Price.
- **Product Detail Experience (`/products/[slug]`)**:
  - Screenshot gallery with active previewer and thumbnail selector.
  - Technical specs drawer displaying platform badges, requirements, and tech stack tags.
  - Overview tabs: Features & Benefits, Setup Guide / Markdown documentation, and Version Changelog.
  - Interactive Review Submission modal with 1-5 star selector, comment validation, and live rating recalculation.
  - Sticky purchase/download pricing sidebar with license terms, instant delivery, and buyer protection guarantee.
  - Contextual "Related Products" shelf from the same category.
- **Admin Digital Product Governance (`/admin`)**:
  - Complete digital product management catalog with tabbed status filtering (ALL, DRAFT, PENDING, PUBLISHED, REJECTED, ARCHIVED).
  - Admin moderation actions: Publish, Unpublish, Reject with documented feedback reason modal, and Archive.
  - Full compliance audit logging (`AuditLog`) for every status transition.
  - "Create Digital Product" modal with category selection, platform tagging, tech stack input, and pricing.
- **API Endpoints (v1)**:
  - `GET /api/v1/categories`: Lists all 10 categories with active published item counts.
  - `GET /api/v1/products/home`: Returns grouped marketplace discovery shelves.
  - `GET /api/v1/products`: Multi-criteria search, filtering, sorting, and pagination.
  - `POST /api/v1/products`: Create product listing in DRAFT.
  - `GET /api/v1/products/:slug`: Single product detail with related products and view counter.
  - `PATCH /api/v1/products/:slug`: Update product listing.
  - `POST /api/v1/products/:slug/moderate`: Admin status update with moderation feedback reason.
  - `POST /api/v1/products/:slug/versions`: Add SemVer version and changelog.
  - `POST /api/v1/products/:slug/reviews`: Submit review and recalculate aggregates.
  - `GET /api/v1/admin/products`: Admin product moderation queue.
- **Database & System Fixes**:
  - Stripped UTF-8 BOM (`\u{feff}`) from initial Prisma migration script.
  - Seeded all 10 product categories and sample digital products clearly marked with `[SAMPLE CONTENT]`.
  - Added BigInt JSON serialization support in `ApiResponse` to serialize `ProductFile.fileSizeBytes`.
  - Configured `dotenv/config` loading in `src/lib/prisma.ts` for standalone CLI script executions.
- **Automated Testing**:
  - Added 11 automated marketplace tests in `tests/marketplace.test.ts` covering validation schemas, SemVer format, moderation transitions, rating calculations, and trending metrics.
  - Total 25/25 tests passing in Vitest test runner.

## [0.4.0] - 2026-10-12: Stage 3 Completed (Authentication & User Management)
### Added
- **Authentication & Security Engine**:
  - Sign in, registration, and logout with server-side session invalidation and cookie clearing.
  - Brute-force lockout protection: accounts locked for 30 minutes after 5 consecutive failed login attempts.
  - Forgot-password and reset-password flows powered by 64-character cryptographic hex tokens with 1-hour expiration and enumeration attack mitigation.
  - Change password workflow with automatic revocation of all other active sessions.
  - Active device session management: list active sessions (`ipAddress`, `userAgent`, `createdAt`, `isCurrent`) and revoke specific or all other sessions.
  - Account deletion request flow with mandatory `"DELETE_MY_ACCOUNT"` confirmation string, instant account suspension, session revocation, and immutable audit logging.
- **User Profile & Activity Tracking**:
  - `UserService` providing sanitized developer profile retrieval and editing (`displayName`, `bio`, `avatarUrl`, `website`, `githubUrl`, `twitterUrl`).
  - Unified chronological user activity timeline consolidating orders, task completions, and coin transactions.
- **Admin User Governance**:
  - `AdminUserService` providing search, status filtering (`ACTIVE`, `SUSPENDED`, `BANNED`), role filtering (`USER`, `PUBLISHER`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`), and pagination.
  - Detailed user inspection view with full purchases, entitlements, ledger history, and active sessions.
  - User status moderation (suspend/reactivate) requiring mandatory audit reasons and self-action prevention.
  - Role management restricted to Super Administrators with audit trail logging.
  - Suspicious security activity monitoring for brute-force locked accounts and anti-fraud flagged tasks.
- **API Endpoints (v1)**:
  - `POST /api/v1/auth/logout`, `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`, `POST /api/v1/auth/change-password`.
  - `GET /api/v1/auth/sessions`, `DELETE /api/v1/auth/sessions`, `DELETE /api/v1/auth/sessions/:id`.
  - `GET /api/v1/user/profile`, `PUT /api/v1/user/profile`, `GET /api/v1/user/activity`, `POST /api/v1/user/delete-request`.
  - `GET /api/v1/admin/users`, `GET /api/v1/admin/users/:id`, `PUT /api/v1/admin/users/:id/status`, `PUT /api/v1/admin/users/:id/role`, `GET /api/v1/admin/suspicious-activity`.
- **Frontend Pages & Experience**:
  - Dedicated authentication pages: `/login`, `/register`, `/forgot-password`, `/reset-password`.
  - Redesigned `/profile` page with 5 tabs (Profile, Security, Sessions, Activity Timeline, Privacy).
  - Redesigned `/admin` page with full User Management table, inspection drawer, moderation modals, and Suspicious Activity monitor.
- **Automated Testing**:
  - Integrated Vitest with `@/*` path resolution in `vitest.config.ts`.
  - Created 14 unit and integration tests covering password complexity, bcrypt cost 12 hashing, lockout logic, token generation, RBAC rules, and self-action prevention in `tests/auth.test.ts`.

## [0.3.0] - 2026-10-12: Stage 2 Completed (Database & Backend Architecture)
### Added
- **Database Architecture (PostgreSQL & Prisma 7)**:
  - Modeled 33 required relational entities with RFC 4122 UUID identifiers, strict foreign key constraints, and performance indexes.
  - Initialized Prisma 7 with configuration at `prisma.config.ts` and `@prisma/adapter-pg` driver adapter.
  - Generated full 923-line PostgreSQL DDL migration script at `prisma/migrations/20261012000000_init/migration.sql`.
- **Financial & Coin Precision Invariants**:
  - Double-entry ledger architecture with immutable `CoinTransaction` records.
  - Stored CPC Coins as integer units (`availableBalance: Int`) to prevent floating-point inaccuracies.
  - Stored fiat in integer paise (₹1 = 100 paise) for sub-unit currency precision.
  - Prevented negative balance spending with server-side validation and database constraints.
  - Idempotency key tracking on orders, transactions, deposits, and task completions to eliminate duplicate processing.
- **Service & Data Access Layer**:
  - `AuthService`: Password hashing (bcrypt cost 12), user & wallet atomic creation, session token management, account brute-force lockouts.
  - `WalletService`: Transactional coin credits/debits, balance snapshots, admin balance adjustments with mandatory reasons.
  - `ProductService`: Multi-criteria querying, safe sorting, pagination, and administrative approval workflow.
  - `OrderService`: Atomic order checkout, price and balance validation, automatic license key generation (`CPC-LIC-...`), and entitlement issuance.
  - `TaskService`: Anti-fraud engagement timer duration checks, 24h rolling cooldown calculation, budget deduction, and atomic reward issuance.
  - `DepositService`: Fiat-to-coin deposit intents, HMAC-SHA256 webhook signature verification, and raw webhook audit logging.
  - `AuditService`: Comprehensive administrative action compliance and tamper-evident audit trail.
- **Validation & Error Handling**:
  - Created Zod validation schemas for Auth, Products, Orders, Wallets, and Tasks.
  - Standardized JSON response envelope (`ApiResponse.success`, `ApiResponse.error`).
  - Centralized error handler (`handleApiError`) mapping Zod, Prisma, and domain `ApiError` instances.
  - Role-based access control middleware (`requireAuth`, `requireRole`, `requirePermission`).
- **Next.js App Router API Handlers (v1)**:
  - `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`.
  - `GET /api/v1/products`, `POST /api/v1/products`, `GET /api/v1/products/[slug]`.
  - `GET /api/v1/wallet`, `POST /api/v1/wallet/adjust`.
  - `POST /api/v1/orders/checkout`.
  - `GET /api/v1/tasks`, `POST /api/v1/tasks`, `POST /api/v1/tasks/[id]/verify`.
  - `GET /api/v1/deposits`, `POST /api/v1/deposits`, `POST /api/v1/payments/webhook`.
  - `GET /api/v1/admin/audit`.
- **Database Seed Script**:
  - `prisma/seed.ts` seeding 5 roles, 6 system permissions, 3 demo personas (`admin`, `publisher`, `customer`), 6 product categories, 5 detailed software products, 4 daily reward tasks, and platform configuration.
- **Documentation**:
  - Updated `docs/DATABASE_SCHEMA.md` with complete Mermaid ER diagram, entity dictionary, and migration runbook.
  - Updated `docs/API_SPECIFICATION.md` with full endpoint inventory, payload schemas, and RBAC rules.
  - Updated `docs/IMPLEMENTATION_STATUS.md` marking Stage 2 as COMPLETED.

## [0.2.0] - 2026-10-12: Stage 1 Completed (Product & UI Foundation)
### Added
- Scaffolding: Next.js 16 App Router application with React 19, strict TypeScript, Tailwind CSS v4, and Lucide icons.
- Design System: Custom tokens for Google Play discovery vibrancy and Google AI Studio sleek dark/light mode workspace aesthetics.
- State Management: `MarketplaceProvider` context supporting live coin balance, role switcher (Guest, User, Admin), persistent theme toggle, purchases list, and toast alerts.
- Core UI Primitives:
  - `CoinBadge`: Reusable coin indicator with animated sheen.
  - `PriceDisplay`: Formatter for Free, Coins, Mixed, and INR currency.
  - `RatingStars`: 1 to 5 star rating display with review counters.
  - `EmptyState`: Accessible empty view with icon, description, and action button.
  - `LoadingSkeleton`: Card, grid, and table skeleton loaders.
  - `ConfirmationDialog`: Accessible modal with keyboard ESC handling and backdrop blur.
  - `ToastNotifications`: Floating interactive toast notification stack.
  - `Pagination`: Accessible page navigation controls.
  - `ThemeToggle`: Smooth light/dark mode switch.
- Application Navigation:
  - `AppHeader`: Search input, live coin balance pill, quick Earn button, deposit action, theme toggle, and role-switcher dropdown.
  - `AppSidebar`: Desktop collapsible sidebar with quick category links and mini-wallet card.
  - `MobileNavigation`: Bottom mobile navigation bar and responsive slide-over drawer.
  - `SearchBar`: Autocomplete suggestions and shortcut focus (`Ctrl+K` / `/`).
  - `CategoryNavigation`: Horizontal scrolling category pills with counts.
- Sample Pages (with clearly labeled demo data):
  - `/`: Marketplace Home with `HeroCarousel`, daily task callout, and shelves.
  - `/explore`: Product exploration with live query search, category/platform/price filters, sorting, and pagination.
  - `/products/[slug]`: Product details page with screenshot gallery, purchasing sidebar, and tabbed specifications/reviews.
  - `/earn`: Daily task rewards with countdown engagement timer execution modal.
  - `/wallet`: CPC Coin wallet with balance summary card and immutable ledger table.
  - `/purchases`: My purchases page with license key copying and simulated download actions.
  - `/profile`: User profile and security settings with persona mode switcher.
  - `/admin`: Admin control center shell with moderation queue and audited coin adjustment form.
- Interactive Modals:
  - `CheckoutModal`: Product purchase confirmation with real-time balance check and deposit CTA.
  - `TaskModal`: Step-by-step task instructions with interactive countdown timer and coin claiming.
  - `DepositModal`: Sandbox payment package selection (₹100, ₹499, ₹999) and simulated coin crediting.

## [0.1.0] - 2026-10-12: Stage 0 Completed (Repository Discovery & Architecture Specification)
### Added
- Created complete documentation suite in `docs/`:
  - `docs/PROJECT_OVERVIEW.md`: Product vision, Google Play & AI Studio design philosophy, persona definitions, and technology roadmap.
  - `docs/BUSINESS_RULES.md`: Authoritative business logic governing accounts, coin ledger, publishing, checkout, tasks, short-links, and governance.
  - `docs/DEVELOPMENT_WORKFLOW.md`: 12-stage lifecycle, phase execution protocol, and quality gate standards.
  - `docs/DATABASE_SCHEMA.md`: PostgreSQL relational schema specification with Prisma ORM.
  - `docs/API_SPECIFICATION.md`: REST endpoints and route handler contracts with standard JSON envelopes.
  - `docs/SECURITY.md`: Threat model, anti-fraud algorithms, ACID ledger concurrency, and presigned download security.
  - `docs/TESTING.md`: Vitest & Playwright testing hierarchy with critical financial test specifications.
  - `docs/DEPLOYMENT.md`: Environment setup, credential matrix, and migration runbook.
  - `docs/IMPLEMENTATION_STATUS.md`: Stage-by-stage implementation tracker.
  - `.env.example`: Safe environment configuration template without secrets.

### Audited
- Audited legacy commit history (`codemarket-server` with Express + MongoDB + Mongoose):
  - Identified untyped JS backend and unindexed document queries.
  - Documented rationale for migration to Next.js App Router + TypeScript + PostgreSQL/Prisma.
  - Noted accidental historical commit of `server/node_modules/` in git tree and working directory deletion.
