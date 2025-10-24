-- CreateTable
CREATE TABLE "UserAssessmentQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalAssessmentsCreated" INTEGER NOT NULL DEFAULT 0,
    "assessmentsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "assessmentsUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAssessmentQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAssessmentQuota_userId_key" ON "UserAssessmentQuota"("userId");

-- CreateIndex
CREATE INDEX "UserAssessmentQuota_userId_idx" ON "UserAssessmentQuota"("userId");

-- AddForeignKey
ALTER TABLE "UserAssessmentQuota" ADD CONSTRAINT "UserAssessmentQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
