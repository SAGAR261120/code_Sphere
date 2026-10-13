-- AlterTable
ALTER TABLE "TaskAttempt" ADD COLUMN     "providerEventId" TEXT,
ADD COLUMN     "shortUrl" TEXT;

-- AlterTable
ALTER TABLE "TaskProvider" ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "config" JSONB,
ADD COLUMN     "permittedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "verificationType" TEXT NOT NULL DEFAULT 'SIGNED_POSTBACK';

-- CreateTable
CREATE TABLE "TaskCallbackEvent" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "providerSlug" TEXT NOT NULL,
    "providerEventId" TEXT,
    "attemptId" TEXT,
    "clientIp" TEXT,
    "signature" TEXT,
    "verificationResult" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "rewardStatus" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskCallbackEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskCallbackEvent_providerSlug_createdAt_idx" ON "TaskCallbackEvent"("providerSlug", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TaskCallbackEvent_attemptId_idx" ON "TaskCallbackEvent"("attemptId");

-- CreateIndex
CREATE INDEX "TaskCallbackEvent_providerEventId_idx" ON "TaskCallbackEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "TaskAttempt_providerEventId_idx" ON "TaskAttempt"("providerEventId");

-- AddForeignKey
ALTER TABLE "TaskCallbackEvent" ADD CONSTRAINT "TaskCallbackEvent_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "TaskProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
