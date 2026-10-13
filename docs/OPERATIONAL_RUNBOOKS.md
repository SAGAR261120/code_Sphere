# CPC Marketplace — Operational Runbooks

This document provides step-by-step Standard Operating Procedures (SOPs) for platform administrators, site reliability engineers (SREs), and support staff.

---

## Runbook 1: Payment Gateway Failure & Deposit Reconciliation

### Context
Users purchase CPC Coins by depositing INR fiat via Razorpay. Rule 6 mandates that client-side browser redirects never issue coins; only cryptographically verified webhooks or verified server-to-server status calls trigger `DEPOSIT` coin issuance.

### Trigger & Symptoms
- User reports that money was deducted from bank/UPI, but CPC Coins do not appear in wallet.
- Admin dashboard reports pending deposits older than 30 minutes.

### Investigation Steps
1. Navigate to **Admin Control Center &rarr; Deposits & Gateways** tab.
2. Inspect the **Payment Reconciliation Scanner**. Filter by `status = PENDING`.
3. Locate the transaction using the user's email or deposit reference ID (`DEP-YYYYMM-XXXX`).
4. Cross-reference the payment reference with the **Razorpay Dashboard**:
   - If payment status on Razorpay is `captured`: The webhook notification was delayed or dropped.
   - If payment status on Razorpay is `failed` or `created`: No coins may be issued.
5. In the Admin Deposits interface, click **"Reconcile & Verify Intent"**:
   - The server makes an authenticated call directly to `https://api.razorpay.com/v1/payments/{payment_id}`.
   - If confirmed captured, the server updates deposit status to `COMPLETED` and creates an atomic `COIN_DEPOSIT` ledger entry.
   - The reconciliation event is permanently logged in `AuditLog`.

---

## Runbook 2: Reward Disputes & Task Fraud Investigation

### Context
Users earn CPC Coins through instructional tasks and verified short-links. Cooldowns, maximum daily completions, and minimum wait times prevent abuse.

### Trigger & Symptoms
- Unusual spike in task completions from a single IP or user.
- User complaints regarding task verification delays.

### Investigation Steps
1. Navigate to **Admin Control Center &rarr; Tasks & Earn** tab.
2. Inspect the **Fraud & Velocity Metrics**:
   - Review average completion duration (attempts under the configured minimum duration are rejected with `INSUFFICIENT_TIME`).
   - Review callback replay rejection counts.
3. Check the **Short-Links & Postbacks** tab:
   - View `TaskCallbackEvent` log for the user's attempt ID.
   - Confirm signature verification result (`HMAC_VERIFIED` vs `SIGNATURE_MISMATCH`).
4. Remediation:
   - If provider failure caused legitimate user completion to fail, admin can execute an audited manual adjustment via **Wallet & Ledger &rarr; Adjust Balance** with mandatory documented reason (`"Task dispute resolution for Attempt #..."`).
   - If automated abuse is detected, navigate to **User Management**, locate user, and click **"Suspend Account"** with reason `"Automated task bot abuse"`.

---

## Runbook 3: Double-Entry Ledger Discrepancy & Supply Imbalance

### Context
The CPC Marketplace ledger is double-entry and append-only. Available balance must always equal lifetime earned/deposited minus spent.

### Trigger & Symptoms
- Health probe or Admin Economy dashboard indicates `LEDGER_MISMATCH`.
- User experiences balance lock or negative balance rejection.

### Investigation Steps
1. Navigate to **Admin Control Center &rarr; Economy & Ledger**.
2. Run the **System-Wide Ledger Scanner** (`reconcileAllWallets`).
3. If an anomaly is identified:
   - The scanner isolates the specific `CoinWallet` where `wallet.availableBalance !== sum(ledgerEntries)`.
   - Inspect transaction logs for incomplete distributed transactions.
4. Corrective Action:
   - Click **"Auto-Repair Compensating Entry"** on the affected wallet.
   - The engine generates an audited `SYSTEM_REPAIR` entry that reconciles available balance to the exact mathematical sum of immutable ledger entries.
   - Never delete original ledger records.

---

## Runbook 4: Download Abuse & Token Revocation

### Context
Paid source code packages and technical manuals are secured via 15-minute HMAC-SHA256 tokens and user-specific license keys.

### Trigger & Symptoms
- A single entitlement records an abnormal surge in download events within minutes.
- Suspicion of token sharing or credential compromise.

### Investigation Steps
1. Navigate to **Admin Control Center &rarr; Orders & Entitlements**.
2. Search for the user or product slug.
3. Open the **Download Event Audit Log** for the entitlement. Inspect IP addresses and user agents.
4. Remediation:
   - To immediately terminate access, click **"Revoke Entitlement"**.
   - This sets `isRevoked: true` on `PurchaseEntitlement`.
   - All subsequent download requests and token signatures will be rejected with HTTP 403 `ENTITLEMENT_REVOKED`.

---

## Runbook 5: Database Backup & Disaster Recovery

### Context
Routine backup schedules and emergency restore procedures.

### Scheduled Backups
- Automated cron runs `scripts/backup-db.sh` daily at `02:00 UTC`.
- Backups are stored in encrypted object storage and rotated after 14 days.

### Emergency Recovery Procedure
1. If database corruption or irreversible data loss occurs, place application in maintenance mode:
   ```bash
   # Set maintenance header via reverse proxy (Nginx / Cloudflare)
   ```
2. Verify target database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```
3. Execute restore script from the latest verified backup snapshot:
   ```bash
   # On Linux / Production
   ./scripts/restore-db.sh backups/cpc_marketplace_backup_YYYYMMDD_HHMMSS.sql.gz

   # On Windows / Staging
   powershell -File ./scripts/restore-db.ps1 -BackupFile backups/cpc_marketplace_backup_YYYYMMDD_HHMMSS.sql
   ```
4. Run Prisma database sanity check:
   ```bash
   npx prisma db push --skip-generate
   ```
5. Run the health & readiness probes:
   ```bash
   curl -i http://localhost:3000/api/ready
   ```
6. Lift maintenance mode.
