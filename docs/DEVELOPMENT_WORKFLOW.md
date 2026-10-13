# CPC Marketplace — Development Workflow

## 1. Overview and Quality Gate Standards

The development of CPC Marketplace follows a disciplined, 12-stage engineering lifecycle. Work proceeds strictly phase-by-phase. Each stage must satisfy clear exit criteria, maintain comprehensive test coverage, adhere to security rules, and keep documentation synchronized.

### Phase Completion Protocol
For every stage:
1. **State the Objective**: Clearly outline what is being constructed.
2. **Inspect Existing Code**: Verify existing files, dependencies, and patterns.
3. **List Intended File Changes**: Enumerate files to create, modify, or delete.
4. **Implement the Feature**: Build clean, strictly typed, accessible code.
5. **Run Relevant Tests**: Execute linting, type-checks, unit/integration tests.
6. **Fix Regressions**: Ensure earlier capabilities remain fully functional.
7. **Update Documentation**: Maintain `IMPLEMENTATION_STATUS.md` and related docs.
8. **Report Actual Results**: Provide an evidence-based summary of changes.
9. **Stop at the Phase Boundary**: Wait for explicit user authorization before commencing the next phase.

---

## 2. The 12-Stage Roadmap

### Stage 0: Repository Discovery & Documentation Architecture (CURRENT)
- **Goal**: Understand legacy codebase, audit repository history, establish project rules and baseline documentation.
- **Key Deliverables**:
  - Audit of legacy `codemarket-server` (Express + MongoDB).
  - Creation of all master specification files in `docs/`.
  - Definition of PostgreSQL relational schema and API endpoints.
  - Identification of architectural risks (committed node_modules, missing frontend).
- **Exit Criteria**: Repository inspected, legacy code analyzed, docs initialized, Phase 1 planned.

### Stage 1: Product & UI Foundation
- **Goal**: Establish the Next.js project foundation, design system tokens, layout hierarchy, and navigable shell.
- **Key Deliverables**:
  - Next.js App Router project initialized with Strict TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Lucide icons.
  - Theme provider (Light / Dark mode toggle) with curated color tokens.
  - Marketplace Shell: Top navbar (search bar, coin balance chip, notification bell, theme toggle, user avatar), sidebar navigation, mobile drawer.
  - Google Play Store-inspired discovery layout: Hero banner carousel, category pill filters, product grid cards, section shelves.
  - Interactive mock-free routing: Detail page shell, Wallet page shell, Tasks page shell, Admin dashboard shell.
  - Responsive layouts tested for Desktop, Tablet, and Mobile.
- **Exit Criteria**: All shell routes render cleanly without runtime errors; responsive navigation works across viewports.

### Stage 2: Database & Authentication
- **Goal**: Establish reliable relational persistence, user identity, and session security.
- **Key Deliverables**:
  - PostgreSQL database configured with Prisma ORM.
  - Initial database migrations for `User`, `Account`, `Session`, `Role`, `AuditLog`.
  - Secure authentication (credentials + OAuth if configured) with bcrypt/argon2 hashing and session management.
  - Server-side RBAC middleware and permission gates.
  - Development database seeding script (`prisma/seed.ts`).
- **Exit Criteria**: Database migrations run cleanly; users can register, log in, view authenticated session, and role gates reject unauthorized users.

### Stage 3: Product Catalog & Discovery Engine
- **Goal**: Make the digital marketplace fully functional with dynamic database records.
- **Key Deliverables**:
  - Product models: Categories, tags, tech stack, screenshots, versioning, pricing options.
  - Public Marketplace endpoints & Server Components: Search, filter by category/platform, sort by popularity/price/date.
  - Rich Product Detail Page: Screenshot carousel, tech stack chips, version history, setup guide preview, live pricing selector.
  - Admin/Publisher Product Creation & Management: File metadata upload, publishing approval workflow.
- **Exit Criteria**: Products populate dynamically from database; search and filtering execute accurately; draft/rejected products remain hidden from public users.

### Stage 4: CPC Coin Ledger & Wallet Engine
- **Goal**: Build the core financial accounting infrastructure.
- **Key Deliverables**:
  - Relational `CoinLedger` table with strict foreign keys, signed integer delta, and balance snapshot.
  - Atomic coin transaction service (`awardCoins`, `spendCoins`, `adminAdjustCoins`) with row-level locking.
  - Wallet Overview Page: Current balance, lifetime earned, lifetime spent, tabular paginated ledger with filters.
  - Administrative coin adjustment dialog with mandatory reason string and audit logging.
  - Concurrency tests verifying negative balance prevention and idempotency.
- **Exit Criteria**: Every coin delta produces an immutable ledger row; concurrent spend requests cannot overdraft wallet.

### Stage 5: Purchase & Download Engine
- **Goal**: Enable complete product purchases using CPC Coins and provide protected file delivery.
- **Key Deliverables**:
  - Checkout confirmation modal / page with real-time balance check.
  - Atomic checkout transaction creating Order, Entitlement, and CoinLedger debit.
  - "My Purchases" user portal section displaying purchased products, license snapshots, and receipts.
  - Protected download handler generating short-lived (15-minute) presigned URLs for entitled users.
  - Admin refund workflow restoring coins and revoking entitlements.
- **Exit Criteria**: Purchases debit coins exactly once; unentitled users receive 403 Forbidden; downloads succeed with valid entitlement.

### Stage 6: Deposits & Payment Gateway
- **Goal**: Enable users to buy CPC Coins using Indian payment rails.
- **Key Deliverables**:
  - Deposit packages (e.g., ₹100 = 100 Coins, ₹500 = 550 Coins with bonus).
  - Razorpay / Cashfree sandbox payment integration.
  - Cryptographically verified webhook endpoint (`/api/v1/payments/webhook`) with HMAC-SHA256 signature validation.
  - Idempotent coin crediting to eliminate duplicate credit risk.
  - Deposit history page and downloadable payment invoices.
- **Exit Criteria**: Sandbox payment lifecycle succeeds; fake or forged webhooks are rejected; duplicate webhook calls do not create duplicate credits.

### Stage 7: Tasks & Rewards Engine
- **Goal**: Enable users to earn CPC Coins through engaging tasks.
- **Key Deliverables**:
  - Task discovery page categorized by type (Visit, Watch, Tutorial, Social).
  - Individual task execution view with interactive instruction checklist and countdown engagement timer.
  - Server-side task attempt tracking (`TaskAttempt`) with session tokens and cooldown timers (e.g., 24h).
  - Global task budget enforcement (tasks pause when budget is exhausted).
  - Verified reward crediting to user coin ledger.
- **Exit Criteria**: Server enforces cooldowns and limits; attempts completed prematurely fail verification; rewards credit exactly once.

### Stage 8: Short-Link & External Verification
- **Goal**: Integrate external short-link and promotional link providers safely.
- **Key Deliverables**:
  - Link provider adapter interface (supporting custom shorteners and third-party APIs).
  - Provider redirect handler appending encrypted attempt tokens.
  - Provider callback webhook with signature and replay verification.
  - Polling / status return page for users returning from external verification.
- **Exit Criteria**: Only verified third-party completion signals award coins; browser return alone cannot trigger coin reward.

### Stage 9: Admin Control Center
- **Goal**: Provide staff with total operational visibility and administrative control.
- **Key Deliverables**:
  - Executive Dashboard: Total revenue, coin circulation, active users, top products, pending reviews.
  - Product Moderation Queue: Approve, reject with reason, feature products.
  - Task & Budget Control: Create tasks, configure reward amounts, set global budgets, monitor fraud flags.
  - User Management: Search users, view wallet ledgers, suspend/ban accounts, execute audited coin adjustments.
  - System Audit Log Viewer: Filterable log of all administrative actions.
- **Exit Criteria**: All administrative metrics derive from live database records; unauthorized users are strictly barred.

### Stage 10: Documentation, Reviews & User Support
- **Goal**: Complete supporting customer experience features.
- **Key Deliverables**:
  - Product documentation & setup guides (Markdown / PDF renderer).
  - Verified purchase review system (1 to 5 stars, textual review, verified buyer badge).
  - In-app notification center for order confirmations, task rewards, and system alerts.
  - Support ticketing module for buyer assistance and dispute resolution.
- **Exit Criteria**: Reviews are restricted to verified purchasers; notifications trigger reliably; tickets can be created and replied to.

### Stage 11: Integration Testing & Security Hardening
- **Goal**: Thoroughly validate application resilience, security, and performance.
- **Key Deliverables**:
  - Unit tests for financial ledger, task verification algorithms, and pricing calculations.
  - Integration tests for purchase flows, webhook handling, and RBAC barriers.
  - End-to-end tests (Playwright) covering user sign-up, product browsing, checkout, and download.
  - Security audit: XSS, CSRF, IDOR, SQL injection, and rate limiting validation.
- **Exit Criteria**: 100% of critical paths verified; all quality gates pass without regressions.

### Stage 12: Production Deployment & Runbook
- **Goal**: Prepare production infrastructure and deployment pipelines.
- **Key Deliverables**:
  - Production build optimization and environment validation scripts.
  - Docker containerization / Vercel deployment configuration.
  - PostgreSQL connection pooling and migration runbook.
  - Object storage bucket policy and CDN configuration.
  - Healthcheck monitoring, error logging, and rollback procedures.
- **Exit Criteria**: Application deploys cleanly with verified SSL, active database migrations, and operational observability.
