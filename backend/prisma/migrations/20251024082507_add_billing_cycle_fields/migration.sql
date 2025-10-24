-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "billingCycle" "BillingCycle",
ADD COLUMN "billingEmail" TEXT,
ADD COLUMN "renewalDate" TIMESTAMP(3),
ADD COLUMN "stripePriceId" TEXT;
