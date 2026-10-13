import { describe, it, expect, vi } from 'vitest';
import {
  createDocumentationSchema,
  documentationQuerySchema,
  documentTypeSchema,
} from '@/lib/validations/documentation.schema';
import {
  buildPdfBuffer,
  DocumentationService,
} from '@/services/documentation.service';
import { ApiError } from '@/lib/api-response';

describe('Phase 12: PDF Documentation & Download Center Test Suite', () => {
  describe('1. Zod Validation & Input Boundary Checks', () => {
    it('should validate valid documentation creation input with defaults', () => {
      const parsed = createDocumentationSchema.safeParse({
        productId: 'a0000000-0000-4000-8000-000000000001',
        title: 'Quickstart Developer Guide',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.documentType).toBe('OVERVIEW');
        expect(parsed.data.isPublic).toBe(false);
        expect(parsed.data.version).toBe('1.0.0');
        expect(parsed.data.language).toBe('English');
      }
    });

    it('should accept custom document types and public visibility', () => {
      const parsed = createDocumentationSchema.safeParse({
        productId: 'a0000000-0000-4000-8000-000000000002',
        title: 'Enterprise Architecture & Source Code Specifications',
        documentType: 'TECHNICAL_SPEC',
        isPublic: true,
        version: '2.1.0',
        language: 'English',
        contentSummary: 'Architecture breakdown and diagrams',
        contentMarkdown: '# Internal Architecture\n\nDeep dive into system components.',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.documentType).toBe('TECHNICAL_SPEC');
        expect(parsed.data.isPublic).toBe(true);
        expect(parsed.data.version).toBe('2.1.0');
      }
    });

    it('should validate all supported document types', () => {
      const types = [
        'OVERVIEW',
        'MANUAL',
        'INSTALLATION_GUIDE',
        'TECHNICAL_SPEC',
        'API_DOC',
        'LICENSE',
        'CHANGELOG',
        'RECEIPT',
      ];
      for (const t of types) {
        const res = documentTypeSchema.safeParse(t);
        expect(res.success).toBe(true);
      }

      const invalid = documentTypeSchema.safeParse('MARKETING_FLYER');
      expect(invalid.success).toBe(false);
    });

    it('should reject invalid titles and non-UUID product IDs', () => {
      const tooShort = createDocumentationSchema.safeParse({
        productId: 'a0000000-0000-4000-8000-000000000001',
        title: 'Hi',
      });
      expect(tooShort.success).toBe(false);

      const invalidUuid = createDocumentationSchema.safeParse({
        productId: 'not-a-valid-uuid',
        title: 'Valid Documentation Title',
      });
      expect(invalidUuid.success).toBe(false);
    });

    it('should parse documentation query parameters', () => {
      const parsed = documentationQuerySchema.safeParse({
        documentType: 'API_DOC',
        isPublic: 'true',
        page: '2',
        limit: '15',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.documentType).toBe('API_DOC');
        expect(parsed.data.isPublic).toBe(true);
        expect(parsed.data.page).toBe(2);
        expect(parsed.data.limit).toBe(15);
      }
    });
  });

  describe('2. PDF-1.4 Binary Generation Engine', () => {
    it('should generate valid PDF-1.4 compliant binary buffer', () => {
      const title = 'AstraNova Architecture Specification';
      const lines = [
        'Version: 1.0.0',
        'Author: System Architect',
        'Classified: Commercial Digital Asset',
        'Section 1: Distributed Ledger Architecture',
      ];

      const pdf = buildPdfBuffer(title, lines);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(300);

      const pdfString = pdf.toString('binary');
      // Standard PDF-1.4 header
      expect(pdfString.startsWith('%PDF-1.4')).toBe(true);
      // Catalog and Pages
      expect(pdfString).toContain('/Type /Catalog');
      expect(pdfString).toContain('/Type /Pages');
      // Font Definition
      expect(pdfString).toContain('/Type /Font');
      expect(pdfString).toContain('/BaseFont /Courier');
      // Content stream with text operators
      expect(pdfString).toContain('BT\n/F1 10 Tf');
      expect(pdfString).toContain('ET');
      // Cross-reference table and EOF
      expect(pdfString).toContain('xref');
      expect(pdfString).toContain('trailer');
      expect(pdfString.trim().endsWith('%%EOF')).toBe(true);
    });

    it('should properly sanitize and escape special characters in PDF strings', () => {
      const title = 'Test (Special) Characters \\ & Slash';
      const lines = [
        'Line with (nested parentheses) and \\ backslashes',
        'Normal text content',
      ];

      const pdf = buildPdfBuffer(title, lines);
      const pdfString = pdf.toString('binary');

      expect(pdfString.startsWith('%PDF-1.4')).toBe(true);
      // Escaped parentheses in PDF text
      expect(pdfString).toContain('\\(nested parentheses\\)');
      expect(pdfString.trim().endsWith('%%EOF')).toBe(true);
    });
  });

  describe('3. Order Receipt / Invoice Generation & Dual-Currency Separation', () => {
    it('should generate official invoice with dual-currency legal disclosures for coin purchases', async () => {
      const mockOrder = {
        id: 'ord-12345',
        orderNumber: 'ORD-20261013-ABCD',
        userId: 'usr-buyer-1',
        status: 'COMPLETED',
        paymentMethod: 'COINS',
        totalCoins: 250,
        fiatAmountPaise: 0,
        createdAt: new Date('2026-10-13T10:00:00Z'),
        user: {
          id: 'usr-buyer-1',
          email: 'buyer@example.com',
          profile: { displayName: 'John Doe' },
        },
        items: [
          {
            id: 'item-1',
            priceCoins: 250,
            fiatPricePaise: 0,
            licenseType: 'COMMERCIAL',
            product: {
              id: 'prod-1',
              title: 'NextJS AI CodeSphere Platform',
            },
            version: {
              version: '1.2.0',
            },
          },
        ],
      };

      const { prisma } = await import('@/lib/prisma');
      const findUniqueSpy = vi.spyOn(prisma.order, 'findUnique').mockResolvedValueOnce(mockOrder as any);

      const receipt = await DocumentationService.generateOrderReceiptPdf(
        'ord-12345',
        'usr-buyer-1',
        ['USER']
      );

      expect(receipt.fileName).toBe('CPC-Receipt-ORD-20261013-ABCD.pdf');
      expect(receipt.buffer).toBeInstanceOf(Buffer);

      const pdfText = receipt.buffer.toString('binary');
      expect(pdfText.startsWith('%PDF-1.4')).toBe(true);
      expect(pdfText.trim().endsWith('%%EOF')).toBe(true);

      // Verify that CPC Coins are clearly labeled and NOT represented as fiat
      expect(pdfText).toContain('ORD-20261013-ABCD');
      expect(pdfText).toContain('250 CPC Coins');
      expect(pdfText).toContain('CPC Coins represent internal digital utility credits and do');
      expect(pdfText).toContain('NOT constitute Indian Rupees, deposit currency, or cash');

      findUniqueSpy.mockRestore();
    });

    it('should reject invoice download if user is neither buyer nor admin', async () => {
      const mockOrder = {
        id: 'ord-secret-1',
        orderNumber: 'ORD-SEC-001',
        userId: 'usr-owner',
        user: { id: 'usr-owner', email: 'owner@example.com' },
        items: [],
      };

      const { prisma } = await import('@/lib/prisma');
      const findUniqueSpy = vi.spyOn(prisma.order, 'findUnique').mockResolvedValueOnce(mockOrder as any);

      await expect(
        DocumentationService.generateOrderReceiptPdf(
          'ord-secret-1',
          'usr-intruder', // different user
          ['USER']
        )
      ).rejects.toThrow(ApiError);

      findUniqueSpy.mockRestore();
    });
  });

  describe('4. Documentation Access Control (Rule 6 & Business Rules)', () => {
    it('should permit unauthenticated guest access to public documentation', async () => {
      const mockPublicDoc = {
        id: 'doc-public-1',
        productId: 'prod-1',
        title: 'Public Architecture Overview',
        documentType: 'OVERVIEW',
        fileName: 'Public-Architecture-Overview-v1.0.0.pdf',
        mimeType: 'application/pdf',
        isPublic: true,
        version: '1.0.0',
        fileSizeBytes: 50000,
        language: 'English',
        contentSummary: 'Overview of system',
        updatedAt: new Date(),
        product: {
          id: 'prod-1',
          title: 'CodeSphere',
          category: { name: 'Web Apps' },
          techStack: ['Next.js', 'PostgreSQL'],
          platforms: ['Web'],
        },
      };

      const { prisma } = await import('@/lib/prisma');
      const findDocSpy = vi.spyOn(prisma.productDocumentation, 'findUnique').mockResolvedValueOnce(mockPublicDoc as any);
      const updateDocSpy = vi.spyOn(prisma.productDocumentation, 'update').mockResolvedValueOnce(mockPublicDoc as any);

      // Guest: no userId provided
      const download = await DocumentationService.getDocumentDownload('doc-public-1');

      expect(download.fileName).toBe('Public-Architecture-Overview-v1.0.0.pdf');
      expect(download.mimeType).toBe('application/pdf');
      expect(download.buffer).toBeInstanceOf(Buffer);

      findDocSpy.mockRestore();
      updateDocSpy.mockRestore();
    });

    it('should reject unauthorized access to private documentation when user is not entitled', async () => {
      const mockPrivateDoc = {
        id: 'doc-private-1',
        productId: 'prod-paid-1',
        title: 'Paid Source Code Guide',
        documentType: 'MANUAL',
        fileName: 'Paid-Source-Code-Guide-v1.0.0.pdf',
        mimeType: 'application/pdf',
        isPublic: false,
        version: '1.0.0',
        product: { id: 'prod-paid-1', title: 'Paid Product' },
      };

      const { prisma } = await import('@/lib/prisma');
      const findDocSpy = vi.spyOn(prisma.productDocumentation, 'findUnique').mockResolvedValueOnce(mockPrivateDoc as any);
      const findEntitlementSpy = vi.spyOn(prisma.purchaseEntitlement, 'findUnique').mockResolvedValueOnce(null);

      // User without entitlement
      await expect(
        DocumentationService.getDocumentDownload(
          'doc-private-1',
          'usr-unentitled',
          ['USER']
        )
      ).rejects.toThrow(/purchased license for this product/i);

      findDocSpy.mockRestore();
      findEntitlementSpy.mockRestore();
    });

    it('should allow access to private documentation when user has active entitlement', async () => {
      const mockPrivateDoc = {
        id: 'doc-private-2',
        productId: 'prod-paid-2',
        title: 'Full Developer Setup Manual',
        documentType: 'INSTALLATION_GUIDE',
        fileName: 'Full-Developer-Setup-Manual-v1.0.0.pdf',
        mimeType: 'application/pdf',
        isPublic: false,
        version: '1.0.0',
        fileSizeBytes: 80000,
        language: 'English',
        contentSummary: 'Manual instructions',
        updatedAt: new Date(),
        product: {
          id: 'prod-paid-2',
          title: 'Paid Product 2',
          category: { name: 'Full-Stack Apps' },
          techStack: ['Node.js', 'React'],
          platforms: ['Web', 'Mobile'],
        },
      };

      const mockEntitlement = {
        id: 'ent-1',
        userId: 'usr-buyer-2',
        productId: 'prod-paid-2',
        isRevoked: false,
      };

      const { prisma } = await import('@/lib/prisma');
      const findDocSpy = vi.spyOn(prisma.productDocumentation, 'findUnique').mockResolvedValueOnce(mockPrivateDoc as any);
      const findEntitlementSpy = vi.spyOn(prisma.purchaseEntitlement, 'findUnique').mockResolvedValueOnce(mockEntitlement as any);
      const updateDocSpy = vi.spyOn(prisma.productDocumentation, 'update').mockResolvedValueOnce(mockPrivateDoc as any);

      const download = await DocumentationService.getDocumentDownload(
        'doc-private-2',
        'usr-buyer-2',
        ['USER']
      );

      expect(download.fileName).toBe('Full-Developer-Setup-Manual-v1.0.0.pdf');
      expect(download.buffer).toBeInstanceOf(Buffer);

      findDocSpy.mockRestore();
      findEntitlementSpy.mockRestore();
      updateDocSpy.mockRestore();
    });

    it('should allow administrator access to private documentation without purchase', async () => {
      const mockPrivateDoc = {
        id: 'doc-private-3',
        productId: 'prod-paid-3',
        title: 'Internal API Spec',
        documentType: 'API_DOC',
        fileName: 'Internal-API-Spec-v2.0.0.pdf',
        mimeType: 'application/pdf',
        isPublic: false,
        version: '2.0.0',
        fileSizeBytes: 95000,
        language: 'English',
        contentSummary: 'API reference',
        updatedAt: new Date(),
        product: {
          id: 'prod-paid-3',
          title: 'Paid Product 3',
          category: { name: 'Backend APIs' },
          techStack: ['Fastify', 'Docker'],
          platforms: ['Linux', 'Cloud'],
        },
      };

      const { prisma } = await import('@/lib/prisma');
      const findDocSpy = vi.spyOn(prisma.productDocumentation, 'findUnique').mockResolvedValueOnce(mockPrivateDoc as any);
      const updateDocSpy = vi.spyOn(prisma.productDocumentation, 'update').mockResolvedValueOnce(mockPrivateDoc as any);

      // Admin user
      const download = await DocumentationService.getDocumentDownload(
        'doc-private-3',
        'usr-admin-1',
        ['ADMIN']
      );

      expect(download.fileName).toBe('Internal-API-Spec-v2.0.0.pdf');
      expect(download.buffer).toBeInstanceOf(Buffer);

      findDocSpy.mockRestore();
      updateDocSpy.mockRestore();
    });
  });

  describe('5. Product Document Listing & Auto-Default Seeding', () => {
    it('should return documentation list with correct access flags for entitled vs non-entitled users', async () => {
      const mockDocs = [
        {
          id: 'doc-1',
          productId: 'prod-test',
          title: 'Public Overview',
          documentType: 'OVERVIEW',
          isPublic: true,
          version: '1.0.0',
          fileName: 'Public-Overview-v1.0.0.pdf',
          fileSizeBytes: 10000,
          language: 'English',
          contentSummary: 'Summary',
          downloadCount: 15,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'doc-2',
          productId: 'prod-test',
          title: 'Private Manual',
          documentType: 'MANUAL',
          isPublic: false,
          version: '1.0.0',
          fileName: 'Private-Manual-v1.0.0.pdf',
          fileSizeBytes: 80000,
          language: 'English',
          contentSummary: 'Summary',
          downloadCount: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const { prisma } = await import('@/lib/prisma');
      const countSpy = vi.spyOn(prisma.productDocumentation, 'count').mockResolvedValue(2);
      const findManySpy = vi.spyOn(prisma.productDocumentation, 'findMany').mockResolvedValue(mockDocs as any);
      // No entitlement
      const findEntitlementSpy = vi.spyOn(prisma.purchaseEntitlement, 'findUnique').mockResolvedValue(null);

      const result = await DocumentationService.getProductDocuments('prod-test', 'usr-guest-user');

      expect(result.documents.length).toBe(2);
      // Public doc: access granted, doesn't require purchase
      expect(result.documents[0].accessGranted).toBe(true);
      expect(result.documents[0].requiresPurchase).toBe(false);

      // Private doc: access denied, requires purchase
      expect(result.documents[1].accessGranted).toBe(false);
      expect(result.documents[1].requiresPurchase).toBe(true);

      countSpy.mockRestore();
      findManySpy.mockRestore();
      findEntitlementSpy.mockRestore();
    });
  });
});
