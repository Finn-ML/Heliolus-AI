# Data Model Specification

## Core Entities

### User

Represents authenticated platform users.

```typescript
interface User {
  id: string // UUID
  email: string // Business email, unique
  firstName: string
  lastName: string
  password: string // Hashed
  emailVerified: boolean
  emailVerificationToken?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  role: UserRole // ADMIN | USER | VENDOR
  status: UserStatus // ACTIVE | SUSPENDED | DELETED
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date

  // Relations
  organization?: Organization
  subscription?: Subscription
  assessments: Assessment[]
  vendorProfile?: Vendor
}

enum UserRole {
  ADMIN = "ADMIN"
  USER = "USER"
  VENDOR = "VENDOR"
}

enum UserStatus {
  ACTIVE = "ACTIVE"
  SUSPENDED = "SUSPENDED"
  DELETED = "DELETED"
}
```

### Organization

Company/organization profile with compliance data.

```typescript
interface Organization {
  id: string // UUID
  userId: string // Owner user
  name: string
  website?: string
  industry?: string
  size?: CompanySize
  country: string
  region?: string
  description?: text

  // Parsed data
  parsedWebsiteData?: json
  complianceGaps?: json

  // Documents
  documents: Document[]

  // Metadata
  onboardingCompleted: boolean
  riskProfile?: RiskProfile
  createdAt: Date
  updatedAt: Date

  // Relations
  user: User
  assessments: Assessment[]
}

enum CompanySize {
  STARTUP = "STARTUP" // 1-50
  SMB = "SMB" // 51-500
  MIDMARKET = "MIDMARKET" // 501-5000
  ENTERPRISE = "ENTERPRISE" // 5000+
}

enum RiskProfile {
  LOW = "LOW"
  MEDIUM = "MEDIUM"
  HIGH = "HIGH"
  CRITICAL = "CRITICAL"
}
```

### Document

Uploaded compliance documents.

```typescript
interface Document {
  id: string // UUID
  organizationId: string
  filename: string
  originalName: string
  mimeType: string
  size: number // bytes
  s3Key: string
  s3Bucket: string

  // Document analysis
  documentType?: DocumentType
  parsedContent?: json
  extractedData?: json

  // Security
  encrypted: boolean
  encryptionKey?: string // If client-side encrypted

  // Metadata
  uploadedBy: string // userId
  createdAt: Date
  updatedAt: Date

  // Relations
  organization: Organization
}

enum DocumentType {
  POLICY = "POLICY"
  ANNUAL_REPORT = "ANNUAL_REPORT"
  COMPLIANCE_CERT = "COMPLIANCE_CERT"
  AUDIT_REPORT = "AUDIT_REPORT"
  OTHER = "OTHER"
}
```

### Assessment

Risk assessment instance.

```typescript
interface Assessment {
  id: string // UUID
  organizationId: string
  userId: string // Who ran it
  templateId: string

  // Assessment data
  status: AssessmentStatus
  responses?: json // User responses
  aiAnalysis?: json // AI evaluation results
  riskScore?: number // 0-100

  // Results
  gaps: Gap[]
  risks: Risk[]
  recommendations?: json
  strategyMatrix?: json

  // Credits
  creditsUsed: number

  // Metadata
  completedAt?: Date
  expiresAt?: Date // For caching
  createdAt: Date
  updatedAt: Date

  // Relations
  organization: Organization
  user: User
  template: Template
  report?: Report
}

enum AssessmentStatus {
  DRAFT = "DRAFT"
  IN_PROGRESS = "IN_PROGRESS"
  COMPLETED = "COMPLETED"
  FAILED = "FAILED"
}
```

### Gap

Identified compliance gaps.

```typescript
interface Gap {
  id: string // UUID
  assessmentId: string

  category: string
  title: string
  description: text
  severity: Severity
  priority: Priority

  // Remediation
  estimatedCost?: CostRange
  estimatedEffort?: EffortRange
  suggestedVendors: string[] // vendorIds

  createdAt: Date

  // Relations
  assessment: Assessment
  vendorMatches: VendorMatch[]
}

enum Severity {
  CRITICAL = "CRITICAL"
  HIGH = "HIGH"
  MEDIUM = "MEDIUM"
  LOW = "LOW"
}

enum Priority {
  IMMEDIATE = "IMMEDIATE" // 0-30 days
  SHORT_TERM = "SHORT_TERM" // 1-3 months
  MEDIUM_TERM = "MEDIUM_TERM" // 3-6 months
  LONG_TERM = "LONG_TERM" // 6+ months
}

enum CostRange {
  LOW = "LOW" // <€10k
  MEDIUM = "MEDIUM" // €10k-50k
  HIGH = "HIGH" // €50k-200k
  VERY_HIGH = "VERY_HIGH" // €200k+
}

enum EffortRange {
  DAYS = "DAYS"
  WEEKS = "WEEKS"
  MONTHS = "MONTHS"
  QUARTERS = "QUARTERS"
}
```

### Risk

Identified risks from assessment.

```typescript
interface Risk {
  id: string // UUID
  assessmentId: string

  category: RiskCategory
  title: string
  description: text
  likelihood: Likelihood
  impact: Impact
  riskLevel: RiskLevel // Calculated

  // Mitigation
  mitigationStrategy?: text
  residualRisk?: RiskLevel

  createdAt: Date

  // Relations
  assessment: Assessment
}

enum RiskCategory {
  GEOGRAPHIC = "GEOGRAPHIC"
  TRANSACTION = "TRANSACTION"
  GOVERNANCE = "GOVERNANCE"
  OPERATIONAL = "OPERATIONAL"
  REGULATORY = "REGULATORY"
  REPUTATIONAL = "REPUTATIONAL"
}

enum Likelihood {
  RARE = "RARE"
  UNLIKELY = "UNLIKELY"
  POSSIBLE = "POSSIBLE"
  LIKELY = "LIKELY"
  CERTAIN = "CERTAIN"
}

enum Impact {
  NEGLIGIBLE = "NEGLIGIBLE"
  MINOR = "MINOR"
  MODERATE = "MODERATE"
  MAJOR = "MAJOR"
  CATASTROPHIC = "CATASTROPHIC"
}

enum RiskLevel {
  LOW = "LOW"
  MEDIUM = "MEDIUM"
  HIGH = "HIGH"
  CRITICAL = "CRITICAL"
}
```

### Template

Assessment template structure.

```typescript
interface Template {
  id: string // UUID
  name: string
  slug: string // URL-friendly
  description: text
  category: TemplateCategory

  // Structure
  sections: TemplateSection[]
  scoringCriteria?: json
  aiPrompts?: json

  // Metadata
  version: string
  isActive: boolean
  createdBy: string // userId
  createdAt: Date
  updatedAt: Date

  // Relations
  assessments: Assessment[]
}

interface TemplateSection {
  id: string
  title: string
  description?: string
  questions: TemplateQuestion[]
  weight: number // For scoring
  order: number
}

interface TemplateQuestion {
  id: string
  text: string
  type: QuestionType
  required: boolean
  options?: string[] // For select/multi
  validation?: json
  helpText?: string
  order: number
}

enum TemplateCategory {
  FINANCIAL_CRIME = "FINANCIAL_CRIME"
  TRADE_COMPLIANCE = "TRADE_COMPLIANCE"
  DATA_PRIVACY = "DATA_PRIVACY"
  CYBERSECURITY = "CYBERSECURITY"
  ESG = "ESG"
}

enum QuestionType {
  TEXT = "TEXT"
  NUMBER = "NUMBER"
  SELECT = "SELECT"
  MULTISELECT = "MULTISELECT"
  BOOLEAN = "BOOLEAN"
  FILE = "FILE"
  DATE = "DATE"
}
```

### Vendor

Marketplace vendor profiles.

```typescript
interface Vendor {
  id: string // UUID
  userId: string // Vendor account owner

  // Company info
  companyName: string
  website: string
  logo?: string
  description: text
  shortDescription: string

  // Solutions
  categories: VendorCategory[]
  solutions: Solution[]

  // Contact
  contactEmail: string
  contactPhone?: string
  contactName?: string
  salesEmail?: string

  // Marketplace
  featured: boolean
  verified: boolean
  rating?: number // 0-5
  reviewCount: number

  // Metadata
  status: VendorStatus
  approvedAt?: Date
  approvedBy?: string // adminId
  createdAt: Date
  updatedAt: Date

  // Relations
  user: User
  solutions: Solution[]
  matches: VendorMatch[]
  contacts: VendorContact[]
}

enum VendorCategory {
  KYC_AML = "KYC_AML"
  TRANSACTION_MONITORING = "TRANSACTION_MONITORING"
  SANCTIONS_SCREENING = "SANCTIONS_SCREENING"
  TRADE_SURVEILLANCE = "TRADE_SURVEILLANCE"
  RISK_ASSESSMENT = "RISK_ASSESSMENT"
  COMPLIANCE_TRAINING = "COMPLIANCE_TRAINING"
  REGULATORY_REPORTING = "REGULATORY_REPORTING"
  DATA_GOVERNANCE = "DATA_GOVERNANCE"
}

enum VendorStatus {
  PENDING = "PENDING"
  APPROVED = "APPROVED"
  REJECTED = "REJECTED"
  SUSPENDED = "SUSPENDED"
}
```

### Solution

Vendor solution offerings.

```typescript
interface Solution {
  id: string // UUID
  vendorId: string

  name: string
  description: text
  category: VendorCategory

  // Details
  features: string[]
  benefits: string[]
  useCases: string[]

  // Pricing
  pricingModel: PricingModel
  startingPrice?: number
  currency: string
  pricingDetails?: text

  // Compatibility
  gapCategories: string[] // Which gaps it addresses
  industries: string[]
  companySizes: CompanySize[]

  // Resources
  demoUrl?: string
  brochureUrl?: string
  caseStudyUrls?: string[]

  isActive: boolean
  createdAt: Date
  updatedAt: Date

  // Relations
  vendor: Vendor
}

enum PricingModel {
  SUBSCRIPTION = "SUBSCRIPTION"
  LICENSE = "LICENSE"
  USAGE = "USAGE"
  CUSTOM = "CUSTOM"
}
```

### Subscription

User subscription management.

```typescript
interface Subscription {
  id: string // UUID
  userId: string

  // Plan details
  plan: SubscriptionPlan
  status: SubscriptionStatus

  // Stripe
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePaymentMethodId?: string

  // Credits
  creditsBalance: number
  creditsUsed: number
  creditsPurchased: number

  // Billing
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAt?: Date
  canceledAt?: Date

  // Trial
  trialEnd?: Date

  createdAt: Date
  updatedAt: Date

  // Relations
  user: User
  invoices: Invoice[]
  creditTransactions: CreditTransaction[]
}

enum SubscriptionPlan {
  FREE = "FREE"
  PREMIUM = "PREMIUM" // €599/month
  ENTERPRISE = "ENTERPRISE" // Custom
}

enum SubscriptionStatus {
  ACTIVE = "ACTIVE"
  TRIALING = "TRIALING"
  PAST_DUE = "PAST_DUE"
  CANCELED = "CANCELED"
  UNPAID = "UNPAID"
}
```

### Report

Generated assessment reports.

```typescript
interface Report {
  id: string // UUID
  assessmentId: string

  // Report data
  type: ReportType
  format: ReportFormat
  content: json // Full report data
  summary?: text

  // Access control
  isPublic: boolean
  accessToken?: string // For sharing
  viewCount: number
  downloadCount: number

  // Files
  pdfUrl?: string
  s3Key?: string

  createdAt: Date
  expiresAt?: Date

  // Relations
  assessment: Assessment
  shares: ReportShare[]
}

enum ReportType {
  EXECUTIVE_SUMMARY = "EXECUTIVE_SUMMARY"
  DETAILED = "DETAILED"
  COMPLIANCE_MATRIX = "COMPLIANCE_MATRIX"
  GAP_ANALYSIS = "GAP_ANALYSIS"
  VENDOR_RECOMMENDATIONS = "VENDOR_RECOMMENDATIONS"
}

enum ReportFormat {
  PDF = "PDF"
  HTML = "HTML"
  JSON = "JSON"
  EXCEL = "EXCEL"
}
```

### VendorMatch

Gap to vendor solution matching.

```typescript
interface VendorMatch {
  id: string; // UUID
  gapId: string;
  vendorId: string;
  solutionId?: string;

  // Matching
  matchScore: number; // 0-100
  matchReasons: string[];

  // User interaction
  viewed: boolean;
  contacted: boolean;
  dismissed: boolean;

  createdAt: Date;

  // Relations
  gap: Gap;
  vendor: Vendor;
  solution?: Solution;
}
```

### VendorContact

Track vendor contact requests.

```typescript
interface VendorContact {
  id: string // UUID
  vendorId: string
  userId: string
  organizationId: string

  // Contact details
  type: ContactType
  message?: text
  requirements?: json
  budget?: string
  timeline?: string

  // Status
  status: ContactStatus
  vendorResponse?: text
  respondedAt?: Date

  createdAt: Date

  // Relations
  vendor: Vendor
  user: User
  organization: Organization
}

enum ContactType {
  DEMO_REQUEST = "DEMO_REQUEST"
  INFO_REQUEST = "INFO_REQUEST"
  RFP = "RFP"
  PRICING = "PRICING"
  GENERAL = "GENERAL"
}

enum ContactStatus {
  PENDING = "PENDING"
  ACKNOWLEDGED = "ACKNOWLEDGED"
  IN_PROGRESS = "IN_PROGRESS"
  COMPLETED = "COMPLETED"
  REJECTED = "REJECTED"
}
```

### CreditTransaction

Track credit usage and purchases.

```typescript
interface CreditTransaction {
  id: string // UUID
  subscriptionId: string

  type: TransactionType
  amount: number // Positive for credit, negative for debit
  balance: number // After transaction

  // Context
  description: string
  metadata?: json
  assessmentId?: string

  createdAt: Date

  // Relations
  subscription: Subscription
  assessment?: Assessment
}

enum TransactionType {
  PURCHASE = "PURCHASE"
  BONUS = "BONUS"
  ASSESSMENT = "ASSESSMENT"
  REFUND = "REFUND"
  ADJUSTMENT = "ADJUSTMENT"
  SUBSCRIPTION_RENEWAL = "SUBSCRIPTION_RENEWAL"
}
```

### Invoice

Billing invoices.

```typescript
interface Invoice {
  id: string // UUID
  subscriptionId: string

  // Stripe
  stripeInvoiceId: string
  stripeChargeId?: string

  // Invoice details
  number: string
  amount: number
  currency: string
  status: InvoiceStatus

  // Dates
  periodStart: Date
  periodEnd: Date
  dueDate: Date
  paidAt?: Date

  // Files
  pdfUrl?: string

  createdAt: Date

  // Relations
  subscription: Subscription
}

enum InvoiceStatus {
  DRAFT = "DRAFT"
  OPEN = "OPEN"
  PAID = "PAID"
  VOID = "VOID"
  UNCOLLECTIBLE = "UNCOLLECTIBLE"
}
```

### AuditLog

Track all significant actions.

```typescript
interface AuditLog {
  id: string; // UUID
  userId?: string;

  // Action details
  action: string;
  entity: string;
  entityId?: string;

  // Change tracking
  oldValues?: json;
  newValues?: json;

  // Context
  ipAddress?: string;
  userAgent?: string;
  metadata?: json;

  createdAt: Date;

  // Relations
  user?: User;
}
```

## Validation Rules

### User

- Email must be business domain (no Gmail, Hotmail, etc.)
- Password minimum 8 characters, 1 uppercase, 1 number, 1 special
- Geographic restrictions on registration (block Iran, Russia, etc.)

### Organization

- Website URL must be valid and reachable
- Country must be from allowed list
- Size and industry from predefined lists

### Document

- Max file size: 50MB
- Allowed types: PDF, DOCX, XLSX, TXT
- Virus scanning required before storage

### Assessment

- Credits must be available before starting
- Template must be active
- Organization profile must be complete

### Vendor

- Unique company name
- Valid website required
- Admin approval required before marketplace listing

### Subscription

- Free tier: 1 assessment, limited features
- Premium: Unlimited assessments, full features
- Enterprise: Custom limits and features

## State Transitions

### User Status

```
ACTIVE <-> SUSPENDED -> DELETED
```

### Assessment Status

```
DRAFT -> IN_PROGRESS -> COMPLETED
      -> IN_PROGRESS -> FAILED
```

### Vendor Status

```
PENDING -> APPROVED -> SUSPENDED
        -> REJECTED
```

### Subscription Status

```
TRIALING -> ACTIVE -> PAST_DUE -> CANCELED
         -> ACTIVE -> CANCELED
                   -> UNPAID -> CANCELED
```

### Contact Status

```
PENDING -> ACKNOWLEDGED -> IN_PROGRESS -> COMPLETED
                                      -> REJECTED
```

## Indexes

### Performance Indexes

- User: email (unique), emailVerificationToken
- Organization: userId, name
- Assessment: organizationId, userId, status, createdAt
- Vendor: status, featured, categories
- Subscription: userId, status, stripeCustomerId
- Document: organizationId, s3Key
- VendorMatch: gapId, vendorId, matchScore

### Search Indexes

- Vendor: companyName, description (full-text)
- Solution: name, description, features (full-text)
- Template: name, description (full-text)

## Data Retention

### Soft Deletes

- User accounts (GDPR compliance)
- Organizations
- Assessments
- Documents

### Hard Deletes (after retention period)

- Audit logs (2 years)
- Credit transactions (7 years for accounting)
- Invoices (7 years for accounting)

### Archival

- Completed assessments (1 year active, then archive)
- Old reports (6 months active, then S3 glacier)
