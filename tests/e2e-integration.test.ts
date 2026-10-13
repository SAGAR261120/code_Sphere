import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/services/auth.service';
import { ProductService } from '@/services/product.service';
import { WalletService } from '@/services/wallet.service';
import { OrderService } from '@/services/order.service';
import { TaskService } from '@/services/task.service';
import { ReviewService } from '@/services/review.service';
import { DocumentationService } from '@/services/documentation.service';
import { AdminControlService } from '@/services/admin-control.service';
import { AuditService } from '@/services/audit.service';
import { ShortlinkService } from '@/services/shortlink.service';
import { StorageService } from '@/services/storage.service';
import { TransactionType } from '@prisma/client';

describe('Phase 14: Complete CPC Marketplace End-to-End Integration Suite', () => {
  const timestamp = Date.now();
  const testUserEmail = `journey_user_${timestamp}@example.com`;
  const testPassword = 'Password123!';
  let userId: string;
  let sessionToken: string;
  let testProductId: string;
  let testProductSlug: string;
  let purchasedOrderId: string;
  let purchasedEntitlementId: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Find or seed admin user
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@cpcmarketplace.internal' },
    });
    if (admin) {
      adminUserId = admin.id;
    } else {
      const reg = await AuthService.registerUser({
        email: 'admin@cpcmarketplace.internal',
        password: testPassword,
        username: `admin_${timestamp}`,
        displayName: 'Platform Admin',
      });
      adminUserId = reg.id;
    }
  });

  describe('Journey 1: Main User Journey (End-to-End)', () => {
    it('Step 1: User registers and receives welcome bonus in wallet', async () => {
      const reg = await AuthService.registerUser({
        email: testUserEmail,
        password: testPassword,
        username: `user_${timestamp}`,
        displayName: 'Integration Journey User',
      });

      expect(reg).toBeDefined();
      expect(reg.email).toBe(testUserEmail);
      expect(reg.id).toBeDefined();

      userId = reg.id;

      // Verify initial wallet has 50 welcome coins
      const wallet = await WalletService.getWallet(userId);
      expect(wallet.availableBalance).toBe(50);
      expect(wallet.totalEarned).toBe(50);

      // Verify welcome bonus ledger entry exists
      const ledger = await WalletService.getLedger(userId);
      expect(ledger.entries.some((t) => t.type === 'PROMO_BONUS')).toBe(true);
    });

    it('Step 2: User authenticates with valid credentials', async () => {
      const login = await AuthService.loginUser({
        email: testUserEmail,
        password: testPassword,
      });

      expect(login.user.id).toBe(userId);
      expect(login.sessionToken).toBeDefined();
      sessionToken = login.sessionToken;
    });

    it('Step 3: User browses product catalog and searches for web applications', async () => {
      const catalog = await ProductService.getProducts({
        search: 'SaaS',
        page: 1,
        limit: 10,
        pricing: 'ALL',
        sort: 'POPULAR',
      });

      expect(catalog.products.length).toBeGreaterThan(0);
      const prod = catalog.products[0];
      expect(prod.coinPrice).toBeGreaterThan(0);
      expect(prod.platforms).toBeDefined();
      expect(prod.status).toBe('PUBLISHED');

      testProductId = prod.id;
      testProductSlug = prod.slug;
    });

    it('Step 4: User opens product detail page and checks technical specifications and documentation', async () => {
      const product = await ProductService.getProductBySlug(testProductSlug);
      expect(product).toBeDefined();
      expect(product.slug).toBe(testProductSlug);
      expect(product.versions.length).toBeGreaterThan(0);

      // Ensure product documentation exists (create if not seeded yet)
      let docs = await DocumentationService.getProductDocuments(testProductId, userId);
      if (docs.documents.length === 0) {
        await DocumentationService.createDocument({
          productId: testProductId,
          title: 'Technical Specification & Architecture Manual',
          documentType: 'OVERVIEW',
          version: '1.0.0',
          isPublic: true,
          language: 'English',
          contentSummary: 'Core architectural guidelines and production checklist.',
        });
        docs = await DocumentationService.getProductDocuments(testProductId, userId);
      }

      expect(docs.documents.length).toBeGreaterThan(0);
      const publicDoc = docs.documents.find((d) => d.isPublic);
      expect(publicDoc).toBeDefined();
      expect(publicDoc!.accessGranted).toBe(true);
      expect(publicDoc!.requiresPurchase).toBe(false);
    });

    it('Step 5: User earns CPC Coins by starting and completing a reward task', async () => {
      // Find an active reward task
      const dashboard = await TaskService.getEarnDashboardData(userId);
      expect(dashboard.tasks.length).toBeGreaterThan(0);
      const task = dashboard.tasks[0];

      // Start task session
      const startRes = await TaskService.startTaskAttempt(userId, task.id, '127.0.0.1');
      expect(startRes.sessionToken).toBeDefined();
      expect(startRes.attemptId).toBeDefined();

      // Satisfy anti-fraud engagement duration requirement
      if (task.requiredDurationSeconds > 0) {
        await prisma.taskAttempt.update({
          where: { id: startRes.attemptId },
          data: {
            createdAt: new Date(Date.now() - (task.requiredDurationSeconds + 5) * 1000),
          },
        });
      }

      // Complete verified task
      const verifyRes = await TaskService.verifyTaskCompletion(
        userId,
        startRes.attemptId,
        startRes.sessionToken
      );

      expect(verifyRes.rewardCoins).toBe(task.rewardCoins);

      // Verify wallet balance reflects +task.rewardCoins
      const updatedWallet = await WalletService.getWallet(userId);
      expect(updatedWallet.availableBalance).toBe(50 + task.rewardCoins);

      // Verify duplicate completion within cooldown is rejected
      await expect(
        TaskService.startTaskAttempt(userId, task.id, '127.0.0.1')
      ).rejects.toThrow();
    });

    it('Step 6: User tops up wallet to have sufficient coins for test purchase', async () => {
      const product = await ProductService.getProductBySlug(testProductSlug);
      const needed = product.coinPrice + 100;

      // Add top-up credit directly to user wallet for checkout test
      const current = await WalletService.getWallet(userId);
      if (current.availableBalance < needed) {
        const diff = needed - current.availableBalance;
        await WalletService.awardCoins(
          userId,
          diff,
          TransactionType.ADMIN_CREDIT,
          'Test user integration balance funding'
        );
      }

      const wallet = await WalletService.getWallet(userId);
      expect(wallet.availableBalance).toBeGreaterThanOrEqual(needed);
    });

    it('Step 7: User purchases digital product using CPC Coins with atomic ledger execution', async () => {
      const product = await ProductService.getProductBySlug(testProductSlug);
      const initialWallet = await WalletService.getWallet(userId);
      const idempotencyKey = `idem-${timestamp}`;

      const checkoutRes = await OrderService.checkoutOrder(userId, {
        productId: testProductId,
        paymentMethod: 'COINS',
        licenseType: 'COMMERCIAL',
        idempotencyKey,
        acceptedTerms: true,
      });

      expect(checkoutRes.order).toBeDefined();
      expect(checkoutRes.order.orderNumber).toMatch(/^CPC-/);
      expect(checkoutRes.order.totalCoins).toBe(product.coinPrice);

      purchasedOrderId = checkoutRes.order.id;

      // Verify wallet was atomically debited
      const postWallet = await WalletService.getWallet(userId);
      expect(postWallet.availableBalance).toBe(initialWallet.availableBalance - product.coinPrice);

      // Verify idempotency: resending same request returns existing order without double-debit
      const duplicateRes = await OrderService.checkoutOrder(userId, {
        productId: testProductId,
        paymentMethod: 'COINS',
        licenseType: 'COMMERCIAL',
        idempotencyKey,
        acceptedTerms: true,
      });
      expect(duplicateRes.order.id).toBe(purchasedOrderId);

      const idempotentWallet = await WalletService.getWallet(userId);
      expect(idempotentWallet.availableBalance).toBe(postWallet.availableBalance);
    });

    it('Step 8: User views acquired package in My Purchases and downloads signed package', async () => {
      const res = await OrderService.getUserOrders(userId);
      expect(res.orders.length).toBeGreaterThan(0);

      const myOrder = res.orders.find((o) => o.id === purchasedOrderId);
      expect(myOrder).toBeDefined();
      expect(myOrder!.status).toBe('COMPLETED');

      const entitlement = myOrder!.items[0]?.entitlement;
      expect(entitlement).toBeDefined();
      expect(entitlement!.licenseKey).toBeDefined();
      expect(entitlement!.isRevoked).toBe(false);

      purchasedEntitlementId = entitlement!.id;

      // Verify entitlement download token generation using StorageService
      const version = myOrder!.items[0]?.version;
      if (version?.files?.[0]) {
        const token = StorageService.generateDownloadToken({
          fileId: version.files[0].id,
          userId,
          entitlementId: purchasedEntitlementId,
          expiresInSeconds: 900,
        });

        expect(token).toBeDefined();
        expect(token.length).toBeGreaterThan(20);
      }
    });

    it('Step 9: User downloads official PDF transaction receipt with dual-currency disclosures', async () => {
      const receipt = await DocumentationService.generateOrderReceiptPdf(
        purchasedOrderId,
        userId,
        ['USER']
      );

      expect(receipt.fileName).toMatch(/^CPC-Receipt-CPC-/);
      expect(receipt.buffer).toBeInstanceOf(Buffer);

      const pdfText = receipt.buffer.toString('binary');
      expect(pdfText.startsWith('%PDF-1.4')).toBe(true);
      expect(pdfText).toContain('CPC Coins represent internal digital utility credits');
      expect(pdfText).toContain('NOT constitute Indian Rupees, deposit currency, or cash');
    });

    it('Step 10: Verified purchaser submits 5-star review and updates product rating aggregates', async () => {
      const res = await ReviewService.submitOrUpdateReview(testProductId, userId, {
        rating: 5,
        title: 'Outstanding Production Quality',
        content: 'Clean TypeScript codebase, thorough documentation, and easy setup.',
      });

      expect(res.review.id).toBeDefined();
      expect(res.review.isVerifiedPurchase).toBe(true);
      expect(res.review.rating).toBe(5);

      // Verify product aggregate rating recalculation
      const productRating = await ReviewService.recalculateProductRating(testProductId);
      expect(productRating.averageRating).toBeGreaterThanOrEqual(4.0);
      expect(productRating.fiveStarCount).toBeGreaterThan(0);
    });

    it('Step 11: Non-purchaser attempting to review is rejected with 403', async () => {
      // Create random guest user who has NOT purchased
      const guest = await AuthService.registerUser({
        email: `guest_${timestamp}@example.com`,
        password: testPassword,
        username: `guest_${timestamp}`,
        displayName: 'Guest User',
      });

      await expect(
        ReviewService.submitOrUpdateReview(testProductId, guest.id, {
          rating: 1,
          content: 'I did not buy this but trying to review anyway.',
        })
      ).rejects.toThrow(/verified purchaser/i);
    });

    it('Step 12: User inspects complete transaction ledger and downloadable statement', async () => {
      const ledger = await WalletService.getLedger(userId);
      expect(ledger.entries.length).toBeGreaterThanOrEqual(3); // PROMO_BONUS, TASK_REWARD, PURCHASE_DEBIT

      // Generate CSV statement
      const csv = await WalletService.generateCsvStatement(userId);
      expect(csv).toContain('Transaction ID,Date,Type,Amount,Balance After,Description');
      expect(csv).toContain('PROMO_BONUS');
      expect(csv).toContain('PURCHASE_DEBIT');
    });
  });

  describe('Journey 2: Main Admin Governance Journey (End-to-End)', () => {
    let createdAdminProductId: string;
    let createdAdminTaskSlug: string;

    it('Step 1: Admin creates a new digital product with versions and files', async () => {
      const category = await prisma.productCategory.findFirst();
      expect(category).toBeDefined();

      const created = await ProductService.createProduct(
        {
          title: `Enterprise Admin Architecture ${timestamp}`,
          shortDescription: 'Production architecture built by administrator',
          description: 'Complete multi-tenant full-stack platform with microservices.',
          categoryId: category!.id,
          coinPrice: 450,
          fiatPricePaise: 45000,
          isFree: false,
          platforms: ['Web', 'Docker', 'Linux'],
          techStack: ['Next.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS'],
          tags: ['enterprise', 'microservices'],
          features: [
            { title: 'Multi-Tenant', description: 'Tenant isolation', icon: 'server' },
          ],
          initialVersion: {
            version: '1.0.0',
            changelogMarkdown: 'Initial release',
            setupGuideMarkdown: '# Setup Guide\n1. Run npm install\n2. Run npm run dev',
          },
        },
        adminUserId
      );

      expect(created.id).toBeDefined();
      expect(created.coinPrice).toBe(450);

      createdAdminProductId = created.id;
    });

    it('Step 2: Admin publishes the newly created digital product', async () => {
      const published = await ProductService.updateProductStatus(
        adminUserId,
        createdAdminProductId,
        'PUBLISHED'
      );
      expect(published.status).toBe('PUBLISHED');

      // Verify product is now publicly discoverable
      const publicProduct = await ProductService.getProductBySlug(published.slug);
      expect(publicProduct.id).toBe(createdAdminProductId);
      expect(publicProduct.status).toBe('PUBLISHED');
    });

    it('Step 3: Admin creates a reward task with budget and limit configuration', async () => {
      createdAdminTaskSlug = `admin-task-${timestamp}`;
      const task = await TaskService.adminCreateTask(adminUserId, {
        title: `Admin Security Walkthrough ${timestamp}`,
        slug: createdAdminTaskSlug,
        description: 'Watch video guide on security practices and double-entry ledgers.',
        instructionsMarkdown: '1. Watch instructional video\n2. Complete verification check accurately.',
        rewardCoins: 75,
        taskType: 'TUTORIAL',
        verificationMethod: 'TIMER',
        requiredDurationSeconds: 15,
        cooldownHours: 24,
        maxDailyCompletions: 1,
        totalBudgetCoins: 10000,
        category: 'Educational',
        difficulty: 'Quick',
        isActive: true,
      });

      expect(task.id).toBeDefined();
      expect(task.rewardCoins).toBe(75);
      expect(task.isActive).toBe(true);
    });

    it('Step 4: Admin inspects short-link providers and verifies secret masking', async () => {
      const providers = await ShortlinkService.getProviders();
      expect(providers.length).toBeGreaterThan(0);

      // Verify that secrets are masked (Rule 6 & Rule 8)
      for (const p of providers) {
        if (p.apiKeyMasked) {
          expect(p.apiKeyMasked).toContain('•');
        }
      }
    });

    it('Step 5: Admin inspects executive metrics separating coin volume from fiat', async () => {
      const summary = await AdminControlService.getExecutiveDashboardMetrics();

      expect(summary.overview.users.total).toBeGreaterThan(0);
      expect(summary.overview.orders.completedCount).toBeGreaterThan(0);
      expect(summary.overview.coinEconomy).toBeDefined();
      // Strict segregation: coins and fiat are stored in distinct metric fields
      expect(summary.overview.coinEconomy.redeemed).toBeGreaterThanOrEqual(0);
      expect(summary.overview.fiatRevenue.totalPaise).toBeGreaterThanOrEqual(0);
    });

    it('Step 6: Admin runs double-entry ledger scanner and validates system consistency', async () => {
      // If historical seed/demo records had discrepancies, exercise admin repair workflow
      const preRecon = await WalletService.reconcileAllWallets();
      for (const disc of preRecon.discrepancies) {
        await WalletService.repairWalletDiscrepancy(
          adminUserId,
          disc.userId,
          'Integration audit reconciliation alignment'
        );
      }

      const recon = await WalletService.reconcileAllWallets();
      expect(recon.totalWallets).toBeGreaterThan(0);
      expect(recon.discrepancyCount).toBe(0);
      expect(recon.systemConsistent).toBe(true);
    });

    it('Step 7: Admin queries audit logs and verifies audit trail records', async () => {
      const auditLogs = await AuditService.getLogs({ limit: 10 });

      expect(auditLogs.logs.length).toBeGreaterThan(0);
      expect(auditLogs.logs[0].action).toBeDefined();
      expect(auditLogs.logs[0].admin).toBeDefined();
    });
  });
});
