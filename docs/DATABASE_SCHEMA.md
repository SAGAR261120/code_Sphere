# CPC Marketplace — Database Schema Specification

## 1. Overview & Architectural Principles

The CPC Marketplace persistence layer is built on **PostgreSQL** orchestrated by **Prisma ORM (v7.10)** with driver adapter support (`@prisma/adapter-pg`).

### Core Architectural Invariants:
1. **Relational Integrity & Foreign Keys**: All parent-child dependencies enforce strict referential actions (`Restrict` on products/orders to preserve purchase history; `Cascade` on ephemeral tokens/sessions).
2. **Immutable Double-Entry Financial Ledger**: Coin transactions (`CoinTransaction`) are strictly append-only. Every delta records a `balanceAfter` snapshot and unique `idempotencyKey` preventing duplicate balance changes.
3. **Integer Coin & Sub-Unit Fiat Precision**:
   - **CPC Coins**: Stored as non-negative integer units (`availableBalance: Int`). Displayed coins equal stored integer units (1:1).
   - **Fiat (INR)**: Stored in integer paise (e.g., ₹499.00 = `49900` paise) to avoid floating-point inaccuracies.
4. **Non-Guessable Non-Sequential Identifiers**: All primary keys employ RFC 4122 Version 4 UUIDs (`@default(uuid())`).
5. **Zero Client Trust**: Balances, product prices, download entitlements, and task completion verification are computed and asserted strictly on the server within atomic database transactions (`prisma.$transaction`).
6. **Object Storage Decoupling**: Downloadable archives, source code files, and installation media are never stored directly in PostgreSQL. Only presigned storage keys (`storageKey`), checksums (`sha256Checksum`), and MIME types are persisted.

---

## 2. Mermaid Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o{ UserRole : "assigned"
    Role ||--o{ UserRole : "grouped"
    Role ||--o{ RolePermission : "authorizes"
    Permission ||--o{ RolePermission : "defines"
    User ||--o| UserProfile : "profiles"
    User ||--o| CoinWallet : "owns"
    User ||--o{ Session : "authenticates"
    User ||--o{ Order : "places"
    User ||--o{ PurchaseEntitlement : "holds"
    User ||--o{ TaskAttempt : "initiates"
    User ||--o{ Deposit : "funds"
    User ||--o{ Product : "publishes"
    User ||--o{ ProductReview : "authors"
    User ||--o{ Notification : "receives"
    User ||--o{ SupportTicket : "opens"
    User ||--o{ AuditLog : "executes_admin"

    CoinWallet ||--o{ CoinTransaction : "ledgers"
    User ||--o{ CoinTransaction : "records"

    ProductCategory ||--o{ Product : "categorizes"
    Product ||--o{ ProductImage : "displays"
    Product ||--o{ ProductVersion : "releases"
    Product ||--o{ ProductFeature : "highlights"
    Product ||--o| ProductRating : "aggregates"
    Product ||--o{ ProductReview : "receives"
    ProductVersion ||--o{ ProductFile : "bundles"

    Order ||--o{ OrderItem : "contains"
    Product ||--o{ OrderItem : "itemizes"
    ProductVersion ||--o{ OrderItem : "pins"
    OrderItem ||--o| PurchaseEntitlement : "grants"
    PurchaseEntitlement ||--o{ DownloadEvent : "logs"
    ProductFile ||--o{ DownloadEvent : "downloads"

    RewardTask ||--o| RewardBudget : "funded_by"
    RewardTask ||--o{ TaskMedia : "presents"
    RewardTask ||--o{ RewardRule : "governed_by"
    RewardTask ||--o{ TaskAttempt : "attempted"
    TaskProvider ||--o{ RewardTask : "verifies"
    TaskAttempt ||--o| TaskCompletion : "completes"
    RewardTask ||--o{ TaskCompletion : "awards"
```

---

## 3. Entity Dictionary & Field Specifications

### Identity, Access & Sessions
- **`User`**: Base identity entity with email, bcrypt password hash (cost 12), account status (`ACTIVE`, `SUSPENDED`, `BANNED`), lockout tracking (`failedLoginAttempts`, `lockedUntil`).
- **`UserProfile`**: Public developer profile (`username`, `displayName`, `bio`, `avatarUrl`, social links).
- **`Session`**: Cryptographic session store (`sessionToken`, `ipAddress`, `userAgent`, `expiresAt`).
- **`Role`** & **`Permission`**: Role-based access control matrix (`RoleType` enum: `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `PUBLISHER`, `USER`) linked to granular subject:action permissions.

### Products & Asset Catalog
- **`ProductCategory`**: Discovery taxonomy (`name`, `slug`, `icon`, `displayOrder`, `isActive`).
- **`Product`**: Published software listing with title, slug, descriptions, publisher ID, category ID, price points (`coinPrice`, `fiatPricePaise`), status (`DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `REJECTED`, `ARCHIVED`), tags, tech stack, and platforms.
- **`ProductImage`**: Screenshots and hero preview graphics with display order and thumbnail indicators.
- **`ProductVersion`**: SemVer release versioning (`version`, `changelogMarkdown`, `setupGuideMarkdown`, `isCurrent`).
- **`ProductFile`**: Private object storage metadata (`storageKey`, `fileName`, `fileSizeBytes`, `mimeType`, `sha256Checksum`).
- **`ProductFeature`**: Bulleted feature capabilities (`title`, `description`, `displayOrder`).
- **`ProductRating`**: Aggregated rating distribution (`averageRating`, `reviewCount`, 1-star to 5-star counters).
- **`ProductReview`**: Authenticated customer ratings and testimonials (`rating`, `title`, `content`, `isVerifiedPurchase`, `isApproved`).

### Orders, Financial Ledger & Entitlements
- **`Order`**: Purchase transaction record (`orderNumber`, `userId`, `totalCoins`, `totalFiatPaise`, `paymentMethod`, `status`, `idempotencyKey`).
- **`OrderItem`**: Specific product and version snapshotted at time of purchase (`licenseType`, `priceCoins`, `priceFiatPaise`).
- **`PurchaseEntitlement`**: Cryptographic license entitlement (`licenseKey`, `maxDownloads`, `downloadCount`, `isRevoked`).
- **`DownloadEvent`**: Audit trail of every secured download request (`clientIp`, `userAgent`, `presignedUrlExpiresAt`).
- **`CoinWallet`**: Authoritative user coin vault (`availableBalance`, `totalEarned`, `totalSpent`, `lockedBalance`, `version`).
- **`CoinTransaction`**: Immutable double-entry ledger entry (`walletId`, `userId`, `amount`, `balanceAfter`, `type`, `description`, `idempotencyKey`, `referenceId`, `referenceType`).
- **`Deposit`**: Fiat-to-Coin conversion intents (`amountFiatPaise`, `coinsToCredit`, `gateway`, `gatewayOrderId`, `gatewayPaymentId`, `status`, `idempotencyKey`).
- **`PaymentWebhookEvent`**: Raw payment gateway webhook audit (`gateway`, `eventId`, `eventType`, `rawPayload`, `signature`, `processed`).

### Reward Tasks & Gamification
- **`RewardTask`**: Admin-created incentive tasks (`title`, `slug`, `rewardCoins`, `taskType`, `verificationMethod`, `requiredDurationSeconds`, `cooldownHours`, `targetUrl`).
- **`RewardBudget`**: Funding allocation (`totalAllocatedCoins`, `totalSpentCoins`, `isExhausted`).
- **`TaskMedia`**: Instructional videos and illustrative banners.
- **`TaskProvider`**: External short-link or verification service provider integration.
- **`TaskAttempt`**: User attempt session tracking (`sessionToken`, `status`, `timeSpentSeconds`, `fraudFlags`).
- **`TaskCompletion`**: Verified reward claim (`rewardCoins`, `verificationReference`).

### Platform Governance & Support
- **`Coupon`**: Promotional discount campaigns (`code`, `discountCoins`, `discountPercent`, `maxUses`, `expiresAt`).
- **`Notification`**: In-app notifications with read status and deep link routes.
- **`SupportTicket`**: Customer service tickets (`ticketNumber`, `subject`, `status`, `priority`, `message`).
- **`AuditLog`**: Tamper-evident admin actions (`adminId`, `action`, `targetType`, `targetId`, `reason`, `ipAddress`, `metadata`).
- **`PlatformSetting`**: Key-value platform configuration (`COIN_CONVERSION_RATE_INR_PAISE`, `MIN_DEPOSIT_PAISE`).

---

## 4. Database Setup & Migration Runbook

### Environment Variables
Configure your `.env` or `.env.local`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/cpc_marketplace?schema=public"
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your_razorpay_secret"
NODE_ENV="development"
```

### Applying Migrations
The initial PostgreSQL migration DDL is located at:
`prisma/migrations/20261012000000_init/migration.sql`

To apply to a live PostgreSQL database:
```bash
npx prisma migrate deploy
```

To regenerate the client:
```bash
npx prisma generate
```

To seed the database with demo accounts, roles, products, tasks, and settings:
```bash
npm run prisma db seed
# or directly:
npx tsx prisma/seed.ts
```
