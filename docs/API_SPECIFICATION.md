# CPC Marketplace — API Specification

## 1. Global Conventions & Standards

- **Base Path**: `/api/v1`
- **Content-Type**: `application/json`
- **Authentication**: Session cookie (`cpc_session`) or `Authorization: Bearer <sessionToken>`
- **Response Format**:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```
- **Error Format**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Your wallet has 150 coins, but this order requires 450 coins.",
    "details": null
  }
}
```

---

## 2. API Endpoint Inventory

### Authentication & Sessions
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/auth/register` | `POST` | Public | Register account with bcrypt (12), profile, and welcome bonus |
| `/api/v1/auth/login` | `POST` | Public | Authenticate user, lockout defense, issue secure session token |
| `/api/v1/auth/logout` | `POST` | Authenticated | Invalidate active session and clear HTTP-only cookie |
| `/api/v1/auth/me` | `GET` | Authenticated | Retrieve current user profile, role permissions, live coin balance |
| `/api/v1/auth/forgot-password` | `POST` | Public | Generate cryptographically signed 64-char password reset token |
| `/api/v1/auth/reset-password` | `POST` | Public | Reset password using valid token, revoke all previous sessions |
| `/api/v1/auth/change-password` | `POST` | Authenticated | Change password for logged-in user with session revocation option |
| `/api/v1/auth/sessions` | `GET` | Authenticated | List all active device sessions with IP, device, and timestamps |
| `/api/v1/auth/sessions` | `DELETE` | Authenticated | Revoke all other device sessions |
| `/api/v1/auth/sessions/:id` | `DELETE` | Authenticated | Revoke specific device session |

### User Profile & Account Management
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/user/profile` | `GET` | Authenticated | Retrieve sanitized user profile details and wallet balances |
| `/api/v1/user/profile` | `PUT` | Authenticated | Update developer display name, bio, avatar URL, social links |
| `/api/v1/user/activity` | `GET` | Authenticated | Retrieve chronological activity timeline (orders, tasks, coins) |
| `/api/v1/user/delete-request` | `POST` | Authenticated | Request account termination (suspends account and clears sessions) |

### Administrative Control & User Governance
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/admin/dashboard` | `GET` | Admin / Super Admin | Retrieve real-time executive dashboard KPIs, dual-currency volume (Paise vs Coins), and recent activity feeds |
| `/api/v1/admin/users` | `GET` | Admin / Super Admin | Search, filter, and paginate user records with role badges |
| `/api/v1/admin/users/:id` | `GET` | Admin / Super Admin | Inspect full user profile, purchases, entitlements, active sessions |
| `/api/v1/admin/users/:id/status` | `PUT` | Admin / Super Admin | Suspend or reactivate user accounts with mandatory audit reason |
| `/api/v1/admin/users/:id/role` | `PUT` | Super Admin Only | Assign or reassign user roles with audit trail logging |
| `/api/v1/admin/suspicious-activity` | `GET` | Admin / Super Admin | Monitor login lockouts, failed attempts, and task anti-fraud flags |
| `/api/v1/admin/orders` | `GET` | Admin / Super Admin | Search, filter, and paginate platform orders with entitlement and download history |
| `/api/v1/admin/orders/:id` | `GET` | Admin / Super Admin | Inspect full order record, items, perpetual licenses, and presigned download audit events |
| `/api/v1/admin/orders/:id/refund` | `POST` | Admin / Super Admin | Execute audited administrative refund, restore coins to wallet, revoke licenses, and log audit event |
| `/api/v1/admin/reviews` | `GET` | Admin / Moderator | Search, filter, and paginate product reviews queue by rating, approval status, or product |
| `/api/v1/admin/reviews/:id/moderate` | `PATCH` | Admin / Moderator | Approve or hide review with mandatory justification and automatic rating recalculation |
| `/api/v1/admin/reviews/:id` | `DELETE` | Admin / Super Admin | Permanently delete abusive review with justification and rating re-computation |
| `/api/v1/admin/settings` | `GET` | Admin / Super Admin | Retrieve platform configuration policies grouped across 5 operational categories |
| `/api/v1/admin/settings` | `PUT` | Super Admin Only | Update platform policies with diff tracking and immutable audit log entry |
| `/api/v1/admin/audit` | `GET` | Admin / Super Admin | Retrieve paginated compliance audit logs with filtering |

### Digital Product Catalog & Discovery
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/categories` | `GET` | Public | List all 10 active product categories with live published item counts |
| `/api/v1/products/home` | `GET` | Public | Retrieve curated discovery shelves (Featured, Trending, Recent, Top-Rated, Free, Categories) |
| `/api/v1/products` | `GET` | Public | List & filter products (`search`, `category`, `platform`, `pricing`, `minRating`, `sort`, `page`) |
| `/api/v1/products` | `POST` | Publisher / Admin | Create product listing in DRAFT status with platforms, techStack, and specs |
| `/api/v1/products/:slug` | `GET` | Public | Retrieve full product details, versions, features, reviews, and related products; atomic view increment |
| `/api/v1/products/:slug` | `PATCH` | Publisher / Admin | Update product metadata, technical specs, or pricing |
| `/api/v1/products/:slug/moderate` | `POST` | Admin / Super Admin | Transition status (PUBLISHED, REJECTED, ARCHIVED) with feedback reason & audit log |
| `/api/v1/products/:slug/versions` | `POST` | Publisher / Admin | Publish new SemVer version with release notes and storage key |
| `/api/v1/products/:slug/reviews` | `POST` | Authenticated | Submit verified product review (1-5 stars) and automatically recalculate aggregate rating |
| `/api/v1/admin/products` | `GET` | Admin / Super Admin | Retrieve administrative product catalog with status filtering and author details |

### CPC Coin Wallet & Append-Only Ledger
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/wallet` | `GET` | Authenticated | Retrieve available, locked, and pending balances, reconciliation status, and filtered ledger |
| `/api/v1/wallet/transactions/:id` | `GET` | Authenticated | Retrieve transaction receipt details with polymorphic reference metadata |
| `/api/v1/wallet/statement` | `GET` | Authenticated | Export official financial statement in CSV (RFC 4180) or JSON format |
| `/api/v1/wallet/reconcile` | `GET` | Authenticated | Run instant double-entry ledger audit comparing balance against transaction sum |
| `/api/v1/wallet/adjust` | `POST` | Admin / Super Admin | Execute audited manual coin adjustment with row locking and mandatory reason |

### Admin Economy & Ledger Governance
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/admin/wallet/economy` | `GET` | Admin / Super Admin | Retrieve circulation KPIs, liabilities, 24h volume, and suspicious activity metrics |
| `/api/v1/admin/wallet/reconcile` | `GET` | Admin / Super Admin | Run system-wide double-entry reconciliation scanner across all registered wallets |
| `/api/v1/admin/wallet/repair` | `POST` | Admin / Super Admin | Resolve balance-ledger discrepancy via audited compensating ledger entry |
| `/api/v1/admin/wallet/config` | `GET` | Admin / Super Admin | Retrieve platform coin configuration policies and limits |
| `/api/v1/admin/wallet/config` | `PUT` | Super Admin Only | Update platform issuance limits, max wallet balances, and expiry rules with audit trail |

### Deposits & Payment Gateway Rails
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/deposits/config` | `GET` | Public | Retrieve active deposit configuration (min/max bounds, conversion rate, public Razorpay key ID; secrets strictly omitted) |
| `/api/v1/deposits` | `GET` | Authenticated | Retrieve user's paginated deposit history with statuses, fiat amount, and coins credited |
| `/api/v1/deposits` | `POST` | Authenticated | Create pending deposit intent & gateway order (validates bounds ₹100–₹50,000, conversion rate, idempotency key) |
| `/api/v1/deposits/:id` | `GET` | Authenticated | Retrieve official deposit detail and receipt with payment references and completion timestamp |
| `/api/v1/deposits/:id/verify` | `POST` | Authenticated | Cryptographic callback verification; credits coins exactly once upon HMAC-SHA256 verification (Rule 6 compliant) |
| `/api/v1/payments/webhook` | `POST` | Public (Signed) | Process signed Razorpay payment events (`payment.captured`, `order.paid`) with HMAC validation and replay deduplication |
| `/api/v1/admin/deposits` | `GET` | Admin / Super Admin | Search, filter, and inspect marketplace deposits with pagination and customer identity |
| `/api/v1/admin/deposits/config` | `GET` | Admin / Super Admin | Retrieve platform payment settings, gateway adapter status, and compliance notices |
| `/api/v1/admin/deposits/config` | `PUT` | Super Admin Only | Update deposit master switch (`depositsEnabled`), adapter selection, min/max limits, and conversion rate |
| `/api/v1/admin/deposits/reconcile`| `GET` | Admin / Super Admin | Run payment reconciliation scanner detecting stale pending deposits (>30m) and expiring abandoned intents |
| `/api/v1/admin/deposits/webhooks` | `GET` | Admin / Super Admin | Retrieve raw incoming webhook delivery audit logs with payload inspectability |

### Product Purchasing, Orders & Secure Downloads
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/products/:slug/eligibility` | `GET` | Public / Auth | Check real-time purchase eligibility, active version availability, license ownership, and coin affordability breakdown |
| `/api/v1/orders/checkout` | `POST` | Authenticated | Execute atomic purchase transaction with `SELECT ... FOR UPDATE` row locking; debits coins, creates snapshot order (`CPC-YYYYMM-XXXX`), and issues perpetual commercial license entitlement |
| `/api/v1/orders` | `GET` | Authenticated | Retrieve user's paginated order history with item snapshots, version info, and download entitlement references |
| `/api/v1/orders/:id` | `GET` | Authenticated | Retrieve specific order receipt details with ownership verification |
| `/api/v1/orders/:id/refund` | `POST` | Authenticated | Request/process order refund within 48h policy window; restores coins, logs compensating `REFUND_CREDIT` ledger transaction, and revokes license entitlement |
| `/api/v1/downloads/signed-url` | `POST` | Authenticated | Verify entitlement ownership and active status, enforce max download quotas, and generate short-lived (15m) HMAC-SHA256 signed download token |
| `/api/v1/downloads/:token` | `GET` | Public (Signed) | Cryptographic verification of download token; logs `DownloadEvent` audit record, increments counters, and streams ZIP software bundle |
| `/api/v1/downloads/pdf/:entitlementId`| `GET` | Authenticated | Verify entitlement ownership and stream official PDF-1.4 Commercial License Certificate |

### Tasks & Daily Rewards Engine
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/tasks` | `GET` | Public / Auth | Retrieve Earn dashboard summary (available tasks, featured opportunities, daily earnings, streak, cooldowns) |
| `/api/v1/tasks` | `POST` | Authenticated | Initiate task attempt; generates unpredictable 64-char crypto session token; validates status, budget, cooldown, and daily limits |
| `/api/v1/tasks/:id` | `GET` | Public / Auth | Retrieve task details by slug or ID with media embeds, instructions walkthrough, terms, and active user attempt progress |
| `/api/v1/tasks/:id/start-link` | `POST` | Authenticated | Initiate short-link attempt with provider adapter (GPLinks, Signed Postback); generates shortened URL and tracking session |
| `/api/v1/tasks/:id/verify` | `POST` | Authenticated | Timing-safe verification of session token & minimum required duration; executes atomic transaction issuing `TaskCompletion`, updating budget, locking wallet, and logging `TASK_REWARD` ledger entry |
| `/api/v1/tasks/attempts/:id/status` | `GET` | Public / Auth | Poll attempt verification state for `/tasks/return` processing screen; reads authentic DB status and rejects client parameter spoofing |
| `/api/v1/tasks/callback/:provider` | `GET / POST` | Public (Signed) | Receive provider postbacks/webhooks; validates HMAC-SHA256 signature, validates 15m timestamp freshness, enforces replay protection, and executes atomic ledger reward |
| `/api/v1/tasks/history` | `GET` | Authenticated | Retrieve user's paginated task completion history with rewards earned and completion timestamps |

### Administrative Task Management & Analytics
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/admin/tasks` | `GET` | Admin / Super Admin | Search, filter, and paginate administrative reward tasks with completion counters, budget utilization, and status |
| `/api/v1/admin/tasks` | `POST` | Admin / Super Admin | Create new reward task with type, reward coins, media attachments, schedule, duration requirements, and budget |
| `/api/v1/admin/tasks/:id` | `PATCH` | Admin / Super Admin | Update reward task configuration, instructions, reward amount, or budget parameters |
| `/api/v1/admin/tasks/:id/toggle` | `POST` | Admin / Super Admin | Pause (`PAUSED`) or resume (`ACTIVE`) reward task with immediate effect on user eligibility |
| `/api/v1/admin/tasks/:id/duplicate` | `POST` | Admin / Super Admin | Clone existing task into a `DRAFT` template with a fresh unique slug and zeroed attempt counters |
| `/api/v1/admin/tasks/:id` | `DELETE` | Admin / Super Admin | Archive (`ARCHIVED`) reward task; safely preserves completion and financial ledger audit trails |
| `/api/v1/admin/tasks/analytics` | `GET` | Admin / Super Admin | Retrieve platform task analytics summary (starts, completions, completion rate, anti-fraud flags, coins paid, budget remaining) |

### Short-Link Providers & Callback Monitoring
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/admin/shortlinks/providers` | `GET` | Admin / Super Admin | List all configured short-link network adapters with masked API tokens and webhook secrets |
| `/api/v1/admin/shortlinks/providers` | `POST` | Admin / Super Admin | Register new short-link provider with base URL, verification type, permitted domains, and HMAC secret |
| `/api/v1/admin/shortlinks/providers/:id` | `PATCH` | Admin / Super Admin | Update provider configuration, base URL, domains, or credentials |
| `/api/v1/admin/shortlinks/providers/:id/toggle` | `POST` | Admin / Super Admin | Toggle provider operational state (`ENABLED` vs `DISABLED`) with immediate effect on link creation |
| `/api/v1/admin/shortlinks/events` | `GET` | Admin / Super Admin | Search, filter, and inspect incoming callback delivery audit logs with sanitized metadata (secrets redacted) |

### Ratings & Verified Customer Reviews
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/products/:slug/reviews` | `GET` | Public | Paginated approved customer reviews with star distribution, live average rating, sorting, and user eligibility |
| `/api/v1/products/:slug/reviews` | `POST` | Authenticated (Verified Purchaser) | Submit or update 1-5 star review; strictly enforces active `PurchaseEntitlement`; atomically recomputes rating metrics |
| `/api/v1/reviews/:id/report` | `POST` | Authenticated | Flag inappropriate review for moderation with documented reason; prevents self-reporting and duplicate flags |

### Smart Recommendations Engine
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/products/:slug/recommendations` | `GET` | Public | Related products matching category, tags, and tech stack; excludes owned items for logged-in user |
| `/api/v1/recommendations` | `GET` | Public / Authenticated | Personalized recommendations based privately on past purchases; falls back to trending/top-rated items |

### In-App Notifications
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/notifications` | `GET` | Authenticated | Paginated user notifications with type-specific badges, unread count, and deep action URLs |
| `/api/v1/notifications/:id/read` | `PATCH` | Authenticated | Mark a single notification as read; enforces user ownership |
| `/api/v1/notifications/read-all` | `POST` | Authenticated | Mark all notifications as read for current user |
| `/api/v1/notifications/unread-count` | `GET` | Authenticated | Fetch current unread notifications count for header badge polling |

### Client Analytics & Telemetry
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/analytics/events` | `POST` | Public / Authenticated | Track privacy-respecting client event (`SEARCH`, `PRODUCT_VIEW`, `PURCHASE_INTENT`, `DOWNLOAD`, `TASK_ENGAGE`) |
| `/api/v1/admin/analytics/summary` | `GET` | Admin / Super Admin | Aggregated analytics telemetry grouped by event type over configured timeframe |

### Admin Review Moderation & Reported Content
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/admin/reviews/reports` | `GET` | Admin / Super Admin / Moderator | List user-reported reviews queue with flag reasons, reporter identity, and review details |
| `/api/v1/admin/reviews/reports/:id/dismiss` | `POST` | Admin / Super Admin / Moderator | Dismiss reported review flag without modifying review visibility |
| `/api/v1/admin/reviews/:id/moderate` | `PATCH` | Admin / Super Admin / Moderator | Approve or hide review with mandatory audit log; automatically resolves associated reports and updates ratings |

### Product Documentation & Download Center (Phase 12)
| Endpoint | Method | Access Level | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/products/:slug/documentation` | `GET` | Public / Authenticated | Lists product documentation PDFs with access flags (`accessGranted`, `requiresPurchase`) |
| `/api/v1/documentation/:id/download` | `GET` | Public (for public docs) / Purchaser / Admin | Streams authorized binary PDF (`application/pdf`) with atomic download counter increment |
| `/api/v1/admin/products/:id/documentation` | `POST` | Admin / Super Admin | Admin creates or generates product overview, manual, spec, or API doc |
| `/api/v1/admin/documentation/:id` | `DELETE` | Admin / Super Admin | Admin removes documentation record |
| `/api/v1/orders/:id/receipt` | `GET` | Authenticated (Buyer or Admin) | Streams official PDF transaction invoice / receipt with strict dual-currency legal disclosures |

---

## 3. Security, Authentication & Session Headers

- **Tokens & Cookies**:
  - `cpc_session`: `HttpOnly`, `SameSite=Lax`, `Secure` (in production), 7-day expiration.
  - Client can also pass `Authorization: Bearer <token>`.
- **Brute-Force & Abuse Defense**:
  - Consecutive failed logins are tracked (`failedLoginAttempts`).
  - At 5 failed attempts, the account is locked for 30 minutes (`lockedUntil = now + 30m`).
  - Account enumeration protection: `/api/v1/auth/forgot-password` always returns a generic success message.
- **Role Hierarchy**:
  - `SUPER_ADMIN`: Root permissions, can assign admin roles and moderate any entity.
  - `ADMIN`: Platform operations, user moderation (cannot self-suspend or assign Super Admin).
  - `MODERATOR`: Review moderation, support tickets, community oversight.
  - `PUBLISHER`: Product submission and version management.
  - `USER`: Browsing, earning coins via tasks, product purchasing, entitlement downloads.
  - `GUEST`: Public product browsing and documentation viewing.
