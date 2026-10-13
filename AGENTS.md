1. Master rules for Antigravity IDE

# CPC MARKETPLACE — MASTER DEVELOPMENT RULES

You are the principal software architect, senior full-stack developer, UI/UX designer, database engineer, QA engineer and security reviewer for CPC Marketplace.

Your responsibility is to build a complete, secure, maintainable digital marketplace for selling web applications, mobile applications, websites, website templates, SaaS products, source code and downloadable digital products.

Do not treat this project as a UI-only prototype. Every production feature must have a working frontend, backend, database integration, authorization, validation, error handling and tests.

## RULE 1 — INSPECT BEFORE CHANGING CODE

Before implementing any feature:

1. Inspect the existing repository and project structure.
2. Identify the framework, installed packages, database, API architecture and current implementation status.
3. Read existing project documentation, environment examples, database schemas and relevant components.
4. Identify reusable code and existing functionality.
5. Write a short implementation plan.
6. Identify risks and dependencies.
7. Modify only the files required for the task.

Never delete or rewrite working code without a documented reason and explicit approval when the change is destructive.

Never assume a feature is missing before checking the repository.

## RULE 2 — MAINTAIN PROJECT DOCUMENTATION

Maintain these project documents:

- AGENTS.md — permanent development instructions.
- docs/PROJECT_OVERVIEW.md — product goals and architecture.
- docs/BUSINESS_RULES.md — authoritative business rules.
- docs/DEVELOPMENT_WORKFLOW.md — phase-by-phase workflow.
- docs/DATABASE_SCHEMA.md — entities, relationships and constraints.
- docs/API_SPECIFICATION.md — endpoints, validation and permissions.
- docs/SECURITY.md — security requirements and threat considerations.
- docs/TESTING.md — test strategy and acceptance criteria.
- docs/DEPLOYMENT.md — environment setup and deployment.
- docs/CHANGELOG.md — significant changes and migrations.
- docs/IMPLEMENTATION_STATUS.md — completed, incomplete and blocked features.

Create missing documents and update existing documents when the implementation changes.

Do not duplicate conflicting business rules across documents. BUSINESS_RULES.md is the source of truth for business behavior.

## RULE 3 — TECHNOLOGY AND ARCHITECTURE

Preferred stack:
- Next.js App Router
- React
- Strict TypeScript
- Tailwind CSS
- shadcn/ui and accessible Radix components
- Lucide icons
- PostgreSQL
- Prisma ORM
- A secure authentication library
- S3-compatible object storage or Cloudflare R2
- A supported payment gateway
- Background job processing only where necessary
- Automated unit, integration and end-to-end tests

First inspect the current project. If an existing stack differs, do not migrate it automatically. Explain the benefit, cost and risks before proposing a major migration.

Use modular services, reusable components, typed interfaces, database constraints and clear separation between presentation, business logic and persistence.

## RULE 4 — DESIGN SYSTEM

Create a premium, responsive digital marketplace.

Visual direction:
- Google Play Store-inspired discovery and product cards.
- Google AI Studio-inspired modern workspace aesthetics.
- Original CPC Marketplace branding.
- Light and dark themes.
- Clean typography, balanced spacing and restrained colors.
- Product icons, screenshots, preview galleries and feature sections.
- Visible CPC Coin balances and prices.
- Desktop, tablet and mobile support.
- Accessible controls, keyboard navigation and visible focus indicators.

Do not copy Google's exact UI, logos or brand assets.

Do not add unrelated features, unnecessary gradients, excessive animations or inconsistent component styles.

All visible buttons and forms must perform their intended actions. Never ship fake buttons or pretend-success messages.

## RULE 5 — IMPLEMENT ONE PHASE AT A TIME

Follow the documented development roadmap.

For each phase:
1. Inspect the current state.
2. Identify dependencies.
3. Present an implementation plan.
4. Implement the smallest complete vertical slice.
5. Run relevant tests.
6. Review security and edge cases.
7. Update documentation.
8. Report completed work and unresolved issues.
9. Stop before beginning the next major phase unless explicitly authorized.

Do not implement the entire roadmap in one uncontrolled change.

## RULE 6 — SERVER IS THE SOURCE OF TRUTH

The backend must independently validate:
- User identity and permissions.
- CPC Coin balances.
- Product prices.
- Purchase eligibility.
- Task eligibility and cooldowns.
- Reward amounts and budgets.
- Deposit and payment status.
- Product download entitlements.
- Review eligibility.
- Administrative privileges.

Never trust financial values, roles, reward claims, purchase success or task completion submitted by the browser.

## RULE 7 — NO FAKE FUNCTIONALITY

Never fabricate:
- Successful payments.
- Verified task completions.
- Coin credits.
- Purchases.
- Product downloads.
- Ratings or reviews.
- Revenue, user counts or analytics.
- Provider callback responses.

Use clearly labeled demo data only in development environments. Never allow demo mode to issue real production rewards or bypass payment verification.

If an integration requires credentials, implement the appropriate configuration and error states, document the missing credentials and leave the integration unverified until it is actually tested.

## RULE 8 — SECURITY AND PRIVACY

Implement authentication, server-side authorization, input validation, rate limiting, secure sessions, safe file uploads, protected downloads, audit logging and appropriate CSRF protection.

Prevent:
- Broken access control.
- IDOR vulnerabilities.
- SQL injection.
- XSS.
- Unauthorized admin actions.
- Double spending.
- Duplicate reward issuance.
- Payment webhook forgery.
- Callback replay.
- Unauthorized downloads.
- Secret leakage.
- Arbitrary redirects.
- Abuse of task limits.

Never commit secrets or expose them in client bundles or logs.

## RULE 9 — DATABASE AND MIGRATIONS

Use version-controlled database migrations.

Do not reset, drop or destructively alter production data.

Before a potentially destructive migration:
1. Explain the impact.
2. Identify affected data.
3. Propose a backup and recovery plan.
4. Obtain approval where required.

Use transactions and appropriate database constraints for all operations involving money, coins, orders, task completion and entitlements.

## RULE 10 — QUALITY GATES

A feature is complete only when:
- Its implementation exists.
- Its expected behavior works.
- Permissions are enforced.
- Errors are handled.
- Relevant tests pass.
- Existing functionality remains intact.
- Documentation is updated.
- No unresolved critical security issue remains.

Do not claim tests passed without executing them.

At the end of every phase, provide:
- Summary of changes.
- Files created or modified.
- Database changes.
- API changes.
- Tests executed and actual results.
- Security considerations.
- Manual setup required.
- Remaining blockers.
- Recommended next phase.

Begin by inspecting the repository and proposing Phase 1. Do not immediately rewrite the project.


2. CPC Marketplace business rules

# CPC MARKETPLACE — AUTHORITATIVE BUSINESS RULES

## 1. User Accounts and Permissions

1. Guests may browse published products and public documentation.
2. Registered users may earn coins, purchase products, download entitled files, submit eligible reviews and manage their accounts.
3. Admin routes and APIs must enforce server-side role permissions.
4. Users must never access another user's wallet, private orders, task history or protected downloads.
5. Suspended accounts cannot earn rewards or make purchases.
6. Account suspension must not silently delete transaction history or legally required records.

## 2. CPC Coin Accounting

1. CPC Coins are internal marketplace credits unless the business explicitly implements a different legally reviewed model.
2. Coins are not automatically equivalent to INR, cash, cryptocurrency or a redeemable financial asset.
3. Displayed coin values and any deposit conversion must follow the active server-side configuration.
4. All coin changes must produce ledger entries.
5. The ledger is the authoritative financial record.
6. Wallet balances must never be changed directly by client-side code.
7. Coin transactions must be atomic, idempotent and auditable.
8. A request retry must not create duplicate coin credits or debits.
9. Purchases cannot make the available balance negative.
10. Administrative coin adjustments require explicit permission, a reason and an audit record.
11. Reward budgets must be reserved or consumed atomically to prevent overspending.
12. Coin expiration, refunds, reversals and promotional restrictions must follow documented policies.
13. Never delete an original financial transaction to correct an error. Record an appropriate compensating transaction.

## 3. Product Publishing

1. Only authorized publishers or admins can create or modify products.
2. Only approved and published products are visible in the public marketplace.
3. Each product has a unique identifier, slug, category, description, supported platforms, pricing, screenshots and publication status.
4. Each downloadable file has a recorded storage key, version, size, file type and access policy.
5. Product prices must be revalidated by the server at purchase time.
6. Every completed order stores a snapshot of the purchased product name, version, price and applicable license terms.
7. Product price changes do not alter existing orders.
8. Products may be free or paid.
9. A free product still requires a valid entitlement if access is restricted.
10. Product files must be scanned or otherwise checked according to the upload security policy.
11. A product must not be advertised as tested, verified or secure without supporting evidence.

## 4. Purchase Rules

1. The server checks authentication, product availability, current price and available coins.
2. The server creates the order, debits coins and grants the entitlement in a single database transaction.
3. A duplicate purchase request must not debit coins twice.
4. A unique idempotency key or equivalent request-deduplication mechanism must be used.
5. A failed purchase must not leave an unexplained debit or entitlement.
6. Purchase success is displayed only after the transaction commits.
7. Every purchase has an order ID, status, timestamp and transaction reference.
8. Refunds follow the published policy and are recorded as separate ledger transactions.
9. Entitlement revocation after a refund follows the product and refund policy.
10. Payment providers, where used, must independently confirm fiat payments before related coins are issued.

## 5. Daily Task Rules

1. Each task has an ID, title, instructions, reward, status, schedule and eligibility rules.
2. Each task may contain an image, video or approved external instructional link.
3. Admins configure maximum completions per user, global completion limits, cooldowns and total reward budgets.
4. A task can be limited to once ever, once every 24 hours, a specified number of times per day or another supported interval.
5. Cooldown and eligibility checks must be calculated by the server using consistent timestamps.
6. Each task attempt belongs to a specific user and task.
7. Attempts have explicit statuses, such as started, pending verification, completed, rejected or expired.
8. Starting a task does not earn coins.
9. Returning to the website does not by itself earn coins.
10. Coins are awarded only after the configured verification method confirms a valid completion.
11. Rewards must be issued exactly once per eligible completion.
12. If verification is delayed, display a pending state rather than false success.
13. If verification fails, record the failure reason and apply the configured retry policy.
14. When a task reaches its budget or completion limit, prevent new eligible attempts.
15. Task rewards, rules and cooldowns must be visible to users before they begin.

## 6. Short-Link Verification Rules

1. Integrate only providers whose current terms permit the intended incentive model.
2. Use documented provider APIs and callback formats.
3. Validate provider signatures and event authenticity whenever supported.
4. Match every event to an existing server-created task attempt.
5. Enforce callback idempotency and replay protection.
6. Never trust a browser redirect, query parameter, timer or return URL as proof of completion.
7. A return page may poll for status but cannot award coins.
8. If a provider cannot reliably verify completion, use manual review or disable automatic rewards.
9. Store callback audit records with secrets and sensitive data redacted.
10. Never expose provider API keys or callback secrets to frontend code.

## 7. Wallet and Deposits

1. Deposits begin in a pending state.
2. Coin credits are issued only after independently verified payment success.
3. Validate the amount, currency, order reference and payment status.
4. Process every provider event idempotently.
5. Handle failures, cancellations, delayed notifications and refunds.
6. Display CPC Coins and fiat amounts as separate values.
7. Withdrawal functionality is disabled unless deliberately implemented, approved and compliant with applicable requirements.
8. Reconciliation must detect missing credits, duplicate events and ledger discrepancies.

## 8. Download and License Rules

1. Users can access paid files only if they have a valid entitlement.
2. Download URLs for private objects must be short-lived.
3. Every protected download requires server-side authorization.
4. Public documentation can be downloaded without purchase only if its visibility is explicitly public.
5. Download logs must not expose private file URLs or secrets.
6. Purchased products are subject to their documented license and update policy.
7. Source code, APKs, PDFs and other files must be served using appropriate content types and safe storage rules.

## 9. Ratings and Reviews

1. Reviews must be tied to an authenticated user and product.
2. Verified-purchase reviews require an eligible purchase.
3. The server validates rating values from 1 to 5.
4. Duplicate reviews must follow a defined edit-or-replace policy.
5. Rating averages and review counts are calculated from eligible records.
6. Admin moderation actions require an audit trail.
7. Demo reviews must never be presented as genuine customer reviews.

## 10. Admin Governance

1. Administrative permissions follow least privilege.
2. Sensitive changes must be auditable.
3. Coin adjustments require a reason.
4. Product publishing and task activation require the correct permission.
5. Payment credentials and provider secrets are never returned to the browser.
6. Admins cannot bypass ledger, purchase or verification services.
7. Critical financial actions must not rely solely on a hidden or disabled frontend button.
8. Every administrative operation must be validated by the server.

## 11. Privacy and Compliance

1. Collect only necessary user information.
2. Publish privacy, terms, refund, license and support policies.
3. Obtain required consent for applicable tracking and communications.
4. Define retention and deletion rules for personal information and audit records.
5. Do not encourage fraudulent traffic, artificial ad interactions or deceptive task completion.
6. Review payment provider requirements, consumer protection obligations, applicable Indian laws and tax requirements before launch.
7. Do not launch coin withdrawals or represent CPC Coins as cash-equivalent assets without appropriate legal and provider review.

These rules are mandatory. If a new feature conflicts with them, stop and propose a documented change instead of silently weakening a rule.

3. Development workflow for Antigravity IDE

# CPC MARKETPLACE — DEVELOPMENT WORKFLOW

## Stage 0 — Repository Discovery

Goal: Understand the project before changing anything.

Actions:
1. Inspect the complete repository structure.
2. Read AGENTS.md and existing project documentation.
3. Identify the frontend, backend, database, authentication and storage setup.
4. Inspect existing routes, shared components, APIs, migrations and tests.
5. Identify unfinished features, duplicate implementations and security risks.
6. Check whether environment variables are documented without printing secret values.
7. Produce a repository assessment and implementation plan.

Exit criteria:
- Architecture is documented.
- Existing functionality is identified.
- Missing dependencies and risks are listed.
- Phase 1 is planned.

Do not make destructive changes during discovery.

## Stage 1 — Product and UI Foundation

Goal: Establish the design system and navigable frontend.

Build:
- Branding and design tokens
- Responsive navigation
- Marketplace layout
- Product cards and detail-page template
- Search and filter components
- Wallet and task-page layouts
- User portal shell
- Admin portal shell
- Reusable loading, error and empty states

Exit criteria:
- Routes render correctly.
- Shared components are reusable.
- Light and dark themes work.
- Mobile navigation works.
- No critical accessibility or layout problems remain.

## Stage 2 — Database and Authentication

Goal: Establish reliable data and identity.

Build:
- Database schema and migrations
- Authentication and sessions
- User profiles
- Role-based access control
- Database constraints and indexes
- Audit logging foundation
- Seed data for development

Exit criteria:
- Migrations work in a clean development database.
- Authentication flows work.
- Protected endpoints reject unauthorized users.
- Database relationships and constraints are tested.

## Stage 3 — Product Catalog

Goal: Make the marketplace functional.

Build:
- Product CRUD
- Categories and supported platforms
- Product images and screenshots
- Search and filters
- Product details
- Admin publishing and approval
- Secure product file metadata

Exit criteria:
- Marketplace reads from the database.
- Published products are discoverable.
- Unpublished products are not publicly accessible.
- Product prices and versions are represented correctly.

## Stage 4 — CPC Coin Ledger and Wallet

Goal: Build the financial foundation.

Build:
- Wallet and ledger
- Coin balance queries
- Transaction history
- Administrative adjustments
- Ledger reconciliation
- Idempotency and concurrency controls

Exit criteria:
- Every balance change has a ledger entry.
- Concurrent spending cannot overspend the wallet.
- Duplicate requests do not duplicate transactions.
- Ledger consistency tests pass.

## Stage 5 — Purchase and Download Engine

Goal: Enable purchases using CPC Coins.

Build:
- Checkout confirmation
- Server-side price and balance checks
- Atomic purchase transactions
- Orders and purchase entitlements
- My Purchases
- Protected downloads
- Refund workflow

Exit criteria:
- A purchase debits coins exactly once.
- Failed purchases do not leave inconsistent balances.
- Unentitled users cannot download private files.
- Purchase history reflects actual transactions.

## Stage 6 — Deposits and Payment Gateway

Goal: Enable verified coin purchases.

Build:
- Deposit creation
- Payment provider adapter
- Signed webhook verification
- Idempotent coin credits
- Deposit history
- Receipts and reconciliation
- Admin payment monitoring

Exit criteria:
- Sandbox payments pass.
- Invalid and duplicate webhooks are rejected.
- Only confirmed payments issue coins.
- Production mode remains disabled until provider approval and credentials are ready.

## Stage 7 — Tasks and Rewards

Goal: Allow users to earn coins.

Build:
- Task listing and detail pages
- Task image and video management
- Reward settings
- Task attempts and status tracking
- Per-user and global limits
- Cooldown enforcement
- Reward budgets
- Task history

Exit criteria:
- Limits are enforced on the server.
- Users see accurate cooldowns.
- Pending tasks do not issue coins.
- Verified completions create exactly one reward transaction.

## Stage 8 — Short-Link Verification

Goal: Integrate a supported short-link provider.

Build:
- Provider adapter
- Task attempt creation
- Provider redirect
- Callback verification
- Return page and status polling
- Callback event log
- Fraud and replay protection

Exit criteria:
- Valid completion events are accepted.
- Invalid signatures are rejected.
- Browser return alone cannot issue rewards.
- Unsupported providers remain disabled for automatic rewards.

## Stage 9 — Admin Control Center

Goal: Give authorized staff control over the business.

Build:
- Admin overview
- Product management
- Task and reward management
- User management
- Wallet and transaction inspection
- Deposit and order management
- Review moderation
- Platform settings
- Audit log viewer

Exit criteria:
- Admin data comes from real records.
- Permissions are enforced by the backend.
- Financial changes are auditable.
- No administrative page exposes provider secrets.

## Stage 10 — Documentation, Reviews and Notifications

Goal: Complete the supporting marketplace experience.

Build:
- PDF documentation
- Product manuals
- Purchase receipts
- Ratings and reviews
- In-app notifications
- Support tickets
- Basic product recommendations

Exit criteria:
- PDF permissions work correctly.
- Reviews follow eligibility rules.
- Notifications reflect actual events.
- Private documents remain protected.

## Stage 11 — Integration and Testing

Goal: Validate the entire application.

Actions:
- Run linting and type checking.
- Run unit and integration tests.
- Run end-to-end user journeys.
- Test all major admin workflows.
- Test mobile layouts.
- Test permissions and file access.
- Test payment and callback failures.
- Test concurrent transactions and retries.
- Resolve critical bugs and regressions.

Exit criteria:
- Critical user journeys pass.
- No known critical security issue remains unresolved.
- All failed tests are documented.
- Any unimplemented feature is explicitly identified.

## Stage 12 — Production Deployment

Goal: Deploy safely.

Actions:
- Configure production environment variables.
- Provision database and object storage.
- Run reviewed database migrations.
- Configure HTTPS and domains.
- Configure payment and short-link providers.
- Configure backups and restore procedures.
- Set up logging, error monitoring and alerts.
- Run smoke tests after deployment.
- Verify rollback procedures.

Exit criteria:
- Production configuration is validated.
- Backup and recovery procedures are documented.
- Payment and reward features work only with verified integrations.
- Remaining blockers are documented and approved.

## Phase completion protocol

For every stage:
1. State the objective.
2. Inspect existing implementation.
3. List intended file changes.
4. Implement the feature.
5. Run relevant tests.
6. Fix regressions.
7. Update documentation and implementation status.
8. Report actual results.
9. Stop at the phase boundary.

Do not mark a phase complete if its acceptance criteria are not satisfied. Report blockers honestly and resume from the last verified state.

4. Phase execution prompt — use this every time

# CPC MARKETPLACE — EXECUTE NEXT DEVELOPMENT PHASE

Read and follow these project files before doing any work:

- AGENTS.md
- docs/PROJECT_OVERVIEW.md
- docs/BUSINESS_RULES.md
- docs/DEVELOPMENT_WORKFLOW.md
- docs/DATABASE_SCHEMA.md
- docs/API_SPECIFICATION.md
- docs/SECURITY.md
- docs/TESTING.md
- docs/IMPLEMENTATION_STATUS.md

## Your task

Identify the next incomplete phase in the development workflow and implement that phase only.

### Step 1: Inspect
Inspect the relevant files, routes, components, database models and tests. Confirm what already exists.

### Step 2: Plan
Provide:
- Phase objective
- Existing implementation
- Missing functionality
- Files to create or modify
- Database and API changes
- Security considerations
- Test plan

### Step 3: Implement
Implement the complete feature within the approved scope. Follow the business rules and reuse existing components and services. Do not use mock implementations for production functionality.

### Step 4: Verify
Run the relevant lint, type-check, unit, integration and end-to-end tests available in the repository. Review authorization, validation, error handling and edge cases.

### Step 5: Document
Update the relevant documentation and implementation status. Record any required credentials or manual configuration without exposing secrets.

### Step 6: Report
Provide a concise completion report containing:
- What was implemented
- Files created or modified
- Database migrations
- APIs added or changed
- Tests executed and their actual results
- Known issues and security risks
- Manual steps still required
- Whether the phase acceptance criteria are satisfied

Do not begin the next phase automatically.

If a requirement is ambiguous, ask a focused question when the decision affects business behavior, security, financial accounting or destructive data changes. Otherwise, use the documented project defaults.

Begin with repository discovery if the project has not yet been assessed. If discovery is complete, continue with the next incomplete phase.

5. Recommended project structure

cpc-marketplace/
├── AGENTS.md
├── docs/
│   ├── PROJECT_OVERVIEW.md
│   ├── BUSINESS_RULES.md
│   ├── DEVELOPMENT_WORKFLOW.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPECIFICATION.md
│   ├── SECURITY.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   ├── CHANGELOG.md
│   └── IMPLEMENTATION_STATUS.md
├── src/
│   ├── app/
│   │   ├── (marketplace)/
│   │   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── admin/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── marketplace/
│   │   ├── wallet/
│   │   ├── tasks/
│   │   └── admin/
│   ├── services/
│   │   ├── wallet/
│   │   ├── purchases/
│   │   ├── rewards/
│   │   ├── payments/
│   │   └── shortlinks/
│   ├── lib/
│   ├── schemas/
│   └── types/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
├── .env.example
└── package.json

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
