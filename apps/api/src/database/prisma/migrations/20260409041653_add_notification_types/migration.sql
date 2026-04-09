/*
  Warnings:

  - You are about to drop the column `exchangeRate` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `fee` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `nairaAmount` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `sendAmount` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `sendCurrency` on the `payouts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[flwVanReference]` on the table `partners` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nairaAmountKobo` to the `payouts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BalanceTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'REFUND');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'BALANCE_LOW';
ALTER TYPE "NotificationType" ADD VALUE 'BALANCE_CREDITED';

-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "balanceKobo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "flwVanAccountNumber" TEXT,
ADD COLUMN     "flwVanBankCode" TEXT,
ADD COLUMN     "flwVanBankName" TEXT,
ADD COLUMN     "flwVanCreatedAt" TIMESTAMPTZ(6),
ADD COLUMN     "flwVanReference" TEXT,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payouts" DROP COLUMN "exchangeRate",
DROP COLUMN "fee",
DROP COLUMN "nairaAmount",
DROP COLUMN "sendAmount",
DROP COLUMN "sendCurrency",
ADD COLUMN     "exchangeRateAudit" DECIMAL(10,4),
ADD COLUMN     "feeKobo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nairaAmountKobo" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "balance_transactions" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "partnerId" TEXT NOT NULL,
    "type" "BalanceTransactionType" NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "balanceAfterKobo" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "balance_transactions_partnerId_idx" ON "balance_transactions"("partnerId");

-- CreateIndex
CREATE INDEX "balance_transactions_partnerId_type_idx" ON "balance_transactions"("partnerId", "type");

-- CreateIndex
CREATE INDEX "balance_transactions_createdAt_idx" ON "balance_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "idx_bal_created" ON "balance_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "idx_bal_partner" ON "balance_transactions"("partnerId");

-- CreateIndex
CREATE INDEX "idx_bal_type" ON "balance_transactions"("partnerId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "partners_flwVanReference_key" ON "partners"("flwVanReference");

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
