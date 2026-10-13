-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('OVERVIEW', 'MANUAL', 'INSTALLATION_GUIDE', 'TECHNICAL_SPEC', 'API_DOC', 'LICENSE', 'CHANGELOG', 'RECEIPT');

-- CreateTable
CREATE TABLE "ProductDocumentation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'OVERVIEW',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "fileName" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "language" TEXT NOT NULL DEFAULT 'English',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "storageKey" TEXT NOT NULL,
    "contentSummary" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDocumentation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductDocumentation_productId_isPublic_idx" ON "ProductDocumentation"("productId", "isPublic");

-- CreateIndex
CREATE INDEX "ProductDocumentation_documentType_idx" ON "ProductDocumentation"("documentType");

-- AddForeignKey
ALTER TABLE "ProductDocumentation" ADD CONSTRAINT "ProductDocumentation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
