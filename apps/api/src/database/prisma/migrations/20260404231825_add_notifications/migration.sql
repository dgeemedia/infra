-- CreateEnum
CREATE TYPE "PartnerRole" AS ENUM ('ADMIN', 'PARTNER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYOUT_DELIVERED', 'PAYOUT_FAILED', 'PAYOUT_FLAGGED', 'WEBHOOK_FAILED', 'API_KEY_CREATED', 'ACCOUNT_SUSPENDED', 'SYSTEM');

-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "role" "PartnerRole" NOT NULL DEFAULT 'PARTNER';

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_partnerId_read_idx" ON "notifications"("partnerId", "read");

-- CreateIndex
CREATE INDEX "notifications_partnerId_createdAt_idx" ON "notifications"("partnerId", "createdAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
