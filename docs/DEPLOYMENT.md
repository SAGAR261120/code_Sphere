# CPC Marketplace — Master Deployment & Operations Guide

## 1. Deployment Topology & Environments

CPC Marketplace supports three segregated environments:
- **Development**: Local environment with Dockerized PostgreSQL and sandbox adapters.
- **Staging (`staging.cpcmarketplace.com`)**: Mirrors production architecture; connected to Razorpay Test Mode and staging Cloudflare R2 bucket.
- **Production (`cpcmarketplace.com`)**: High-availability setup with connection pooling, live Razorpay credentials, and strict security headers.

```
                           [ Cloudflare CDN & WAF ]
                                     |
                          [ Nginx Reverse Proxy ]
                                     |
                    [ Next.js Production Server (Node.js) ]
                    /                  |                  \
       [ PostgreSQL 17 + PgBouncer ]   [ Cloudflare R2 ]  [ Razorpay Rails ]
```

---

## 2. Environment Variables Matrix

| Variable Name | Environments | Purpose | Example / Requirements |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | All | Runtime optimization level | `development` \| `staging` \| `production` |
| `NEXT_PUBLIC_APP_URL`| All | Canonical platform URL | `https://cpcmarketplace.com` |
| `DATABASE_URL` | All | Pooled PostgreSQL connection string | `postgresql://user:pass@host:6543/db?pgbouncer=true` |
| `DIRECT_URL` | All | Direct DB connection (for migrations)| `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | All | 64-char key for cookie & token encryption | `openssl rand -hex 64` |
| `NEXTAUTH_SECRET` | All | NextAuth session signing key | `openssl rand -hex 64` |
| `S3_ENDPOINT` | All | R2 or AWS S3 endpoint | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_REGION` | All | Object storage region | `auto` \| `ap-south-1` |
| `S3_BUCKET_NAME` | All | Private encrypted asset bucket | `cpc-marketplace-production-assets` |
| `S3_ACCESS_KEY_ID` | All | S3 API Access Key ID | Storage credentials |
| `S3_SECRET_ACCESS_KEY`| All | S3 API Secret Key | Private credentials (never in git) |
| `RAZORPAY_KEY_ID` | Staging/Prod | Razorpay key ID | `rzp_test_...` (Staging) \| `rzp_live_...` (Prod) |
| `RAZORPAY_KEY_SECRET`| Staging/Prod | Razorpay secret | Private key |
| `RAZORPAY_WEBHOOK_SECRET`| Staging/Prod | Webhook HMAC-SHA256 signature key | Private signing secret |
| `TASK_SESSION_SECRET`| All | Task crypto verification key | `openssl rand -hex 32` |
| `LOG_LEVEL` | All | Structured logging threshold | `DEBUG` (Staging) \| `INFO` (Prod) |
| `ENABLE_RATE_LIMITING`| All | Enables in-memory sliding rate limiter | `true` |

---

## 3. Database Provisioning & Migration Workflow

### 3.1 Provisioning PostgreSQL 17
1. Set up managed PostgreSQL instance with UTF-8 encoding.
2. Enable SSL: `sslmode=require`.
3. Configure connection pooling (PgBouncer) with transaction mode.
4. Set minimum pool size = 20, max client connections = 100.

### 3.2 Safe Zero-Downtime Migration Policy
Prisma migrations must follow an **expand-and-contract** policy:
1. Validate pending migration SQL locally:
   ```bash
   npx prisma migrate status
   ```
2. Apply pending migrations using direct database connection (never via PgBouncer):
   ```bash
   npx prisma migrate deploy
   ```
3. Generate updated Prisma client bindings:
   ```bash
   npx prisma generate
   ```
4. Verify migration success with health probe:
   ```bash
   curl -s http://localhost:3000/api/ready | jq .
   ```

---

## 4. Object Storage & CORS Configuration

Private release builds, ZIP archives, and generated PDF documentation are stored in private Cloudflare R2 / AWS S3 buckets.

### S3 / R2 CORS Configuration
```json
[
  {
    "AllowedOrigins": ["https://cpcmarketplace.com", "https://staging.cpcmarketplace.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Disposition", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 5. Payment Gateway Webhook Configuration

1. In the **Razorpay Dashboard &rarr; Settings &rarr; Webhooks**:
   - Webhook URL: `https://cpcmarketplace.com/api/v1/payments/webhook`
   - Active Events:
     - `payment.captured`
     - `payment.failed`
     - `refund.processed`
   - Secret: Enter the value configured in `RAZORPAY_WEBHOOK_SECRET`.
2. Test delivery with a mock payload; confirm HTTP `200 OK` response with idempotency check.

---

## 6. Build & Deployment Commands

### Production Build & Launch
```bash
# 1. Install locked dependencies
npm ci

# 2. Generate Prisma Client
npx prisma generate

# 3. Compile optimized Next.js production bundle
npm run build

# 4. Start production server
npm run start
```

---

## 7. Rollback & Disaster Recovery Procedures

### 7.1 Application Code Rollback
If a newly deployed release exhibits unexpected runtime exceptions:
1. Revert Git tag to the previous stable release commit:
   ```bash
   git checkout tags/v0.12.0
   npm ci
   npm run build
   pm2 restart cpc-marketplace
   ```
2. Run smoke tests on `/api/health`.

### 7.2 Database Rollback
See [`docs/OPERATIONAL_RUNBOOKS.md`](file:///c:/AstraNova%20Technologies/CodeSphere/docs/OPERATIONAL_RUNBOOKS.md) (Runbook 5) for automated restoration using `scripts/restore-db.sh` or `scripts/restore-db.ps1`.
