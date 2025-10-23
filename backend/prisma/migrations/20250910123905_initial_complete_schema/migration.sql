-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'USER', 'VENDOR');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."CompanySize" AS ENUM ('STARTUP', 'SMB', 'MIDMARKET', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."RiskProfile" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('POLICY', 'ANNUAL_REPORT', 'COMPLIANCE_CERT', 'AUDIT_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AssessmentStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "public"."CostRange" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "public"."EffortRange" AS ENUM ('DAYS', 'WEEKS', 'MONTHS', 'QUARTERS');

-- CreateEnum
CREATE TYPE "public"."RiskCategory" AS ENUM ('GEOGRAPHIC', 'TRANSACTION', 'GOVERNANCE', 'OPERATIONAL', 'REGULATORY', 'REPUTATIONAL');

-- CreateEnum
CREATE TYPE "public"."Likelihood" AS ENUM ('RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN');

-- CreateEnum
CREATE TYPE "public"."Impact" AS ENUM ('NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC');

-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."TemplateCategory" AS ENUM ('FINANCIAL_CRIME', 'TRADE_COMPLIANCE', 'DATA_PRIVACY', 'CYBERSECURITY', 'ESG');

-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'MULTISELECT', 'BOOLEAN', 'FILE', 'DATE');

-- CreateEnum
CREATE TYPE "public"."VendorCategory" AS ENUM ('KYC_AML', 'TRANSACTION_MONITORING', 'SANCTIONS_SCREENING', 'TRADE_SURVEILLANCE', 'RISK_ASSESSMENT', 'COMPLIANCE_TRAINING', 'REGULATORY_REPORTING', 'DATA_GOVERNANCE');

-- CreateEnum
CREATE TYPE "public"."VendorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."PricingModel" AS ENUM ('SUBSCRIPTION', 'LICENSE', 'USAGE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('FREE', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('EXECUTIVE_SUMMARY', 'DETAILED', 'COMPLIANCE_MATRIX', 'GAP_ANALYSIS', 'VENDOR_RECOMMENDATIONS');

-- CreateEnum
CREATE TYPE "public"."ReportFormat" AS ENUM ('PDF', 'HTML', 'JSON', 'EXCEL');

-- CreateEnum
CREATE TYPE "public"."ContactType" AS ENUM ('DEMO_REQUEST', 'INFO_REQUEST', 'RFP', 'PRICING', 'GENERAL');

-- CreateEnum
CREATE TYPE "public"."ContactStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('PURCHASE', 'BONUS', 'ASSESSMENT', 'REFUND', 'ADJUSTMENT', 'SUBSCRIPTION_RENEWAL');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "size" "public"."CompanySize",
    "country" TEXT NOT NULL,
    "region" TEXT,
    "description" TEXT,
    "parsedWebsiteData" JSONB,
    "complianceGaps" JSONB,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "riskProfile" "public"."RiskProfile",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "documentType" "public"."DocumentType",
    "parsedContent" JSONB,
    "extractedData" JSONB,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "encryptionKey" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Assessment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" "public"."AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "responses" JSONB,
    "aiAnalysis" JSONB,
    "riskScore" INTEGER,
    "recommendations" JSONB,
    "strategyMatrix" JSONB,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Gap" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "public"."Severity" NOT NULL,
    "priority" "public"."Priority" NOT NULL,
    "estimatedCost" "public"."CostRange",
    "estimatedEffort" "public"."EffortRange",
    "suggestedVendors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Risk" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "category" "public"."RiskCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "likelihood" "public"."Likelihood" NOT NULL,
    "impact" "public"."Impact" NOT NULL,
    "riskLevel" "public"."RiskLevel" NOT NULL,
    "mitigationStrategy" TEXT,
    "residualRisk" "public"."RiskLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."TemplateCategory" NOT NULL,
    "scoringCriteria" JSONB,
    "aiPrompts" JSONB,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateSection" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateQuestion" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "public"."QuestionType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT[],
    "validation" JSONB,
    "helpText" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vendor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "categories" "public"."VendorCategory"[],
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactName" TEXT,
    "salesEmail" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."VendorStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Solution" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."VendorCategory" NOT NULL,
    "features" TEXT[],
    "benefits" TEXT[],
    "useCases" TEXT[],
    "pricingModel" "public"."PricingModel" NOT NULL,
    "startingPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "pricingDetails" TEXT,
    "gapCategories" TEXT[],
    "industries" TEXT[],
    "companySizes" "public"."CompanySize"[],
    "demoUrl" TEXT,
    "brochureUrl" TEXT,
    "caseStudyUrls" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorMatch" (
    "id" TEXT NOT NULL,
    "gapId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "solutionId" TEXT,
    "matchScore" INTEGER NOT NULL,
    "matchReasons" TEXT[],
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "contacted" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "public"."SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePaymentMethodId" TEXT,
    "creditsBalance" INTEGER NOT NULL DEFAULT 0,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "creditsPurchased" INTEGER NOT NULL DEFAULT 0,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "stripeChargeId" TEXT,
    "number" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditTransaction" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "assessmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "format" "public"."ReportFormat" NOT NULL,
    "content" JSONB NOT NULL,
    "summary" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "pdfUrl" TEXT,
    "s3Key" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorContact" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "public"."ContactType" NOT NULL,
    "message" TEXT,
    "requirements" JSONB,
    "budget" TEXT,
    "timeline" TEXT,
    "status" "public"."ContactStatus" NOT NULL DEFAULT 'PENDING',
    "vendorResponse" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_emailVerificationToken_idx" ON "public"."User"("emailVerificationToken");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_userId_key" ON "public"."Organization"("userId");

-- CreateIndex
CREATE INDEX "Organization_userId_idx" ON "public"."Organization"("userId");

-- CreateIndex
CREATE INDEX "Organization_name_idx" ON "public"."Organization"("name");

-- CreateIndex
CREATE INDEX "Organization_country_idx" ON "public"."Organization"("country");

-- CreateIndex
CREATE INDEX "Organization_size_idx" ON "public"."Organization"("size");

-- CreateIndex
CREATE INDEX "Document_organizationId_idx" ON "public"."Document"("organizationId");

-- CreateIndex
CREATE INDEX "Document_s3Key_idx" ON "public"."Document"("s3Key");

-- CreateIndex
CREATE INDEX "Document_documentType_idx" ON "public"."Document"("documentType");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "public"."Document"("createdAt");

-- CreateIndex
CREATE INDEX "Assessment_organizationId_idx" ON "public"."Assessment"("organizationId");

-- CreateIndex
CREATE INDEX "Assessment_userId_idx" ON "public"."Assessment"("userId");

-- CreateIndex
CREATE INDEX "Assessment_status_idx" ON "public"."Assessment"("status");

-- CreateIndex
CREATE INDEX "Assessment_createdAt_idx" ON "public"."Assessment"("createdAt");

-- CreateIndex
CREATE INDEX "Assessment_completedAt_idx" ON "public"."Assessment"("completedAt");

-- CreateIndex
CREATE INDEX "Gap_assessmentId_idx" ON "public"."Gap"("assessmentId");

-- CreateIndex
CREATE INDEX "Gap_category_idx" ON "public"."Gap"("category");

-- CreateIndex
CREATE INDEX "Gap_severity_idx" ON "public"."Gap"("severity");

-- CreateIndex
CREATE INDEX "Gap_priority_idx" ON "public"."Gap"("priority");

-- CreateIndex
CREATE INDEX "Risk_assessmentId_idx" ON "public"."Risk"("assessmentId");

-- CreateIndex
CREATE INDEX "Risk_category_idx" ON "public"."Risk"("category");

-- CreateIndex
CREATE INDEX "Risk_riskLevel_idx" ON "public"."Risk"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "public"."Template"("slug");

-- CreateIndex
CREATE INDEX "Template_slug_idx" ON "public"."Template"("slug");

-- CreateIndex
CREATE INDEX "Template_category_idx" ON "public"."Template"("category");

-- CreateIndex
CREATE INDEX "Template_isActive_idx" ON "public"."Template"("isActive");

-- CreateIndex
CREATE INDEX "Template_createdAt_idx" ON "public"."Template"("createdAt");

-- CreateIndex
CREATE INDEX "TemplateSection_templateId_idx" ON "public"."TemplateSection"("templateId");

-- CreateIndex
CREATE INDEX "TemplateSection_order_idx" ON "public"."TemplateSection"("order");

-- CreateIndex
CREATE INDEX "TemplateQuestion_sectionId_idx" ON "public"."TemplateQuestion"("sectionId");

-- CreateIndex
CREATE INDEX "TemplateQuestion_order_idx" ON "public"."TemplateQuestion"("order");

-- CreateIndex
CREATE INDEX "TemplateQuestion_type_idx" ON "public"."TemplateQuestion"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_userId_key" ON "public"."Vendor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_companyName_key" ON "public"."Vendor"("companyName");

-- CreateIndex
CREATE INDEX "Vendor_userId_idx" ON "public"."Vendor"("userId");

-- CreateIndex
CREATE INDEX "Vendor_companyName_idx" ON "public"."Vendor"("companyName");

-- CreateIndex
CREATE INDEX "Vendor_status_idx" ON "public"."Vendor"("status");

-- CreateIndex
CREATE INDEX "Vendor_featured_idx" ON "public"."Vendor"("featured");

-- CreateIndex
CREATE INDEX "Vendor_verified_idx" ON "public"."Vendor"("verified");

-- CreateIndex
CREATE INDEX "Vendor_categories_idx" ON "public"."Vendor"("categories");

-- CreateIndex
CREATE INDEX "Solution_vendorId_idx" ON "public"."Solution"("vendorId");

-- CreateIndex
CREATE INDEX "Solution_category_idx" ON "public"."Solution"("category");

-- CreateIndex
CREATE INDEX "Solution_pricingModel_idx" ON "public"."Solution"("pricingModel");

-- CreateIndex
CREATE INDEX "Solution_isActive_idx" ON "public"."Solution"("isActive");

-- CreateIndex
CREATE INDEX "Solution_companySizes_idx" ON "public"."Solution"("companySizes");

-- CreateIndex
CREATE INDEX "Solution_gapCategories_idx" ON "public"."Solution"("gapCategories");

-- CreateIndex
CREATE INDEX "VendorMatch_gapId_idx" ON "public"."VendorMatch"("gapId");

-- CreateIndex
CREATE INDEX "VendorMatch_vendorId_idx" ON "public"."VendorMatch"("vendorId");

-- CreateIndex
CREATE INDEX "VendorMatch_matchScore_idx" ON "public"."VendorMatch"("matchScore");

-- CreateIndex
CREATE INDEX "VendorMatch_viewed_idx" ON "public"."VendorMatch"("viewed");

-- CreateIndex
CREATE INDEX "VendorMatch_contacted_idx" ON "public"."VendorMatch"("contacted");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "public"."Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "public"."Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "public"."Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "public"."Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Subscription_plan_idx" ON "public"."Subscription"("plan");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "public"."Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "public"."Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "public"."Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "public"."Invoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "Invoice_stripeInvoiceId_idx" ON "public"."Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "public"."Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "public"."Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Invoice_paidAt_idx" ON "public"."Invoice"("paidAt");

-- CreateIndex
CREATE INDEX "CreditTransaction_subscriptionId_idx" ON "public"."CreditTransaction"("subscriptionId");

-- CreateIndex
CREATE INDEX "CreditTransaction_type_idx" ON "public"."CreditTransaction"("type");

-- CreateIndex
CREATE INDEX "CreditTransaction_assessmentId_idx" ON "public"."CreditTransaction"("assessmentId");

-- CreateIndex
CREATE INDEX "CreditTransaction_createdAt_idx" ON "public"."CreditTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_assessmentId_key" ON "public"."Report"("assessmentId");

-- CreateIndex
CREATE INDEX "Report_assessmentId_idx" ON "public"."Report"("assessmentId");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "public"."Report"("type");

-- CreateIndex
CREATE INDEX "Report_isPublic_idx" ON "public"."Report"("isPublic");

-- CreateIndex
CREATE INDEX "Report_accessToken_idx" ON "public"."Report"("accessToken");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "public"."Report"("createdAt");

-- CreateIndex
CREATE INDEX "VendorContact_vendorId_idx" ON "public"."VendorContact"("vendorId");

-- CreateIndex
CREATE INDEX "VendorContact_userId_idx" ON "public"."VendorContact"("userId");

-- CreateIndex
CREATE INDEX "VendorContact_organizationId_idx" ON "public"."VendorContact"("organizationId");

-- CreateIndex
CREATE INDEX "VendorContact_type_idx" ON "public"."VendorContact"("type");

-- CreateIndex
CREATE INDEX "VendorContact_status_idx" ON "public"."VendorContact"("status");

-- CreateIndex
CREATE INDEX "VendorContact_createdAt_idx" ON "public"."VendorContact"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "public"."AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "public"."AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Organization" ADD CONSTRAINT "Organization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assessment" ADD CONSTRAINT "Assessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assessment" ADD CONSTRAINT "Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assessment" ADD CONSTRAINT "Assessment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Gap" ADD CONSTRAINT "Gap_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "public"."Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Risk" ADD CONSTRAINT "Risk_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "public"."Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateSection" ADD CONSTRAINT "TemplateSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateQuestion" ADD CONSTRAINT "TemplateQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."TemplateSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Solution" ADD CONSTRAINT "Solution_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorMatch" ADD CONSTRAINT "VendorMatch_gapId_fkey" FOREIGN KEY ("gapId") REFERENCES "public"."Gap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorMatch" ADD CONSTRAINT "VendorMatch_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorMatch" ADD CONSTRAINT "VendorMatch_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "public"."Solution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditTransaction" ADD CONSTRAINT "CreditTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditTransaction" ADD CONSTRAINT "CreditTransaction_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "public"."Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "public"."Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorContact" ADD CONSTRAINT "VendorContact_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorContact" ADD CONSTRAINT "VendorContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorContact" ADD CONSTRAINT "VendorContact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
