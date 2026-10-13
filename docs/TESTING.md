# CPC Marketplace — Testing Strategy & Quality Assurance

## 1. Testing Hierarchy

To maintain commercial reliability and financial correctness, testing is divided into three tiers:
1. **Unit Tests (Vitest)**: Pure logic, pricing calculations, fee structures, validation schemas, token verification, and utility helpers.
2. **Integration Tests (Vitest / Database Test Containers)**: Prisma transactions, financial ledger consistency, concurrent purchase attempts, task attempt state transitions, and RBAC middleware.
3. **End-to-End Tests (Playwright)**: Complete user flows from registration to product discovery, checkout, ledger deduction, and file download.

---

## 2. Critical Test Suites

### Suite A: Financial Ledger & Accounting
- **Negative Balance Test**: Attempting to spend 600 coins with 500 in balance must fail and throw `Insufficient balance` without mutating the balance.
- **Concurrent Purchase Overdraft**: Executing two simultaneous requests spending 400 coins with 500 in balance must succeed on one and fail cleanly on the other (no overdraft).
- **Idempotency Deduplication**: Resending the exact same checkout payload with identical `Idempotency-Key` must return the existing order without deducting coins twice.
- **Compensating Refund**: Admin refund must credit coins back to the user balance and revoke the product entitlement.

### Suite B: Task Verification & Anti-Fraud
- **Premature Completion**: Attempting to complete a 30-second task after 5 seconds must return `400 Bad Request (INSUFFICIENT_TIME)` and mark the session as fraud.
- **Cooldown Enforcement**: Attempting to start a task within its 24-hour cooldown window must return `400 Bad Request` with remaining cooldown seconds.
- **Budget Exhaustion**: Attempting to start a task whose `totalRewardedCoins >= totalRewardBudget` must transition to `BUDGET_EXHAUSTED` and reject the attempt.

### Suite C: Entitlement & Download Security
- **Unentitled Access**: Requesting a download URL for a paid product without an active entitlement must return `403 Forbidden`.
- **Entitled Presigned URL**: Requesting a download with a valid entitlement returns a valid signed URL with a 15-minute expiration timestamp.

---

## 3. Test Execution Commands

```bash
# Run unit and integration tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run coverage report
npm run test:coverage

# Run Playwright E2E tests
npm run test:e2e
```
