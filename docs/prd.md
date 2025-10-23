# Enhanced Risk Assessment Logic Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Existing Project Overview

#### Analysis Source
**IDE-based fresh analysis** - Using existing CLAUDE.md documentation and comprehensive project brief

#### Current Project State

The Heliolus Platform is a production SaaS compliance assessment and vendor marketplace platform serving financial services organizations. The platform currently provides:

**Core Assessment Functionality:**
- AI-powered compliance assessments using OpenAI GPT-4
- Document upload and AI analysis with automatic answer generation
- Gap identification and risk analysis
- Vendor marketplace with basic matching algorithm
- PDF report generation
- Freemium and Premium subscription tiers (€599/month)

**Technical Foundation:**
- **Backend:** Fastify 4 + TypeScript with 16 specialized services
- **Frontend:** Vite + React 18 + TypeScript
- **Database:** Replit PostgreSQL with Prisma ORM (1034-line schema, 23+ models, 25 enums)
- **Infrastructure:** Redis caching, Replit object storage, Docker Compose dev environment
- **Architecture:** Monorepo with service-oriented architecture

**Current Limitations:**
- All documents treated equally regardless of evidence quality
- **Risk scoring implementation is non-functional** (designed but not completed)
- Basic vendor matching without user preference integration
- No transparent scoring methodology in place

### Available Documentation Analysis

✅ **Using existing project analysis from comprehensive documentation:**
- ✅ Tech Stack Documentation (CLAUDE.md - complete)
- ✅ Source Tree/Architecture (detailed structure, 16 services, 11 route files)
- ✅ Coding Standards (TypeScript, ESLint, Prettier)
- ✅ API Documentation (Swagger-annotated routes)
- ✅ Database Schema (Complete Prisma schema.prisma)
- ✅ Service Architecture (16 services: ai-analysis, assessment, document, vendor, etc.)
- ✅ Project Brief (Comprehensive enhancement specification)
- ⚠️ UX/UI Guidelines (Radix UI + TailwindCSS, but no formal design system)

### Enhancement Scope Definition

#### Enhancement Type
- ☑️ **Major Feature Modification** (core assessment engine transformation)
- ☑️ **New Feature Addition** (evidence classification, priorities questionnaire, strategy matrix)
- ☑️ **Performance/Scalability Improvements** (optimized weighted scoring algorithms)

#### Enhancement Description
Implement a sophisticated, evidence-weighted risk assessment scoring system (currently non-functional) that distinguishes between policy documentation and proof of execution, completing the assessment engine functionality. Implement 3-tier evidence classification (system-generated × 1.0, policies × 0.8, self-declared × 0.6), two-level weighted scoring architecture (question weights + section weights aligned with FFIEC/FATF frameworks), intelligent gap prioritization with severity/priority/effort/cost estimates, personal priorities questionnaire (6-step user preference capture), advanced vendor matching algorithm (0-140 point scoring with base + boost components), and strategy matrix timeline organizing gaps into phased remediation roadmap (0-6, 6-18, 18+ month buckets).

#### Impact Assessment
- ☐ Minimal Impact (isolated additions)
- ☐ Moderate Impact (some existing code changes)
- ☑️ **Significant Impact** (substantial existing code changes)
- ☐ Major Impact (architectural changes required)

**Impact Justification:**
- Database schema: Add 3 new models (AssessmentPriorities, EffortRange enum, CostRange enum), enhance 5 existing models (Document, Question, Section, Answer, Gap, VendorMatch)
- Backend services: 5 new services + enhancement of 2 existing services (ai-analysis, assessment)
- API routes: Extend assessment.routes.ts, vendor.routes.ts with new endpoints
- Frontend: New components for priorities questionnaire, enhanced results dashboard, strategy matrix timeline, evidence tier visualization
- Algorithm changes: Complete rewrite of scoring calculations and vendor matching
- Maintains backward compatibility through database migrations and feature flags

### Goals and Background Context

#### Goals
- Transform Heliolus from helpful assessment tool into defensible, audit-grade compliance platform with regulatory-aligned methodology
- Increase Premium conversion rate from 18% to 35% within 90 days of completing enhanced assessment
- Expand into enterprise market: sign 15 enterprise contracts at €2K-5K/month within 12 months
- Reduce Premium subscriber monthly churn from 12% to <5%
- Achieve >85% evidence tier classification accuracy on validation dataset
- Increase vendor match relevance score from 3.2/5.0 to >4.0/5.0
- Maintain assessment results page load <3 seconds with 50 questions, 20 documents
- Enable compliance officers to confidently present assessments to auditors and regulators

#### Background Context

The current Heliolus Platform provides AI-powered compliance gap identification but lacks functional risk scoring - a critical capability required for enterprise compliance teams who must defend their risk assessments to regulators during examinations. The platform currently faces three critical limitations:

1. **Evidence Quality Undifferentiated:** The document analysis system treats all uploaded documents equally, whether they're audit logs proving execution or informal emails describing intent. Without evidence classification, the system fails the regulatory standard of distinguishing "what you say you do" versus "proof you actually do it."

2. **Risk Scoring Non-Functional:** The platform can identify gaps but cannot calculate meaningful risk scores. Enterprise compliance teams need quantitative, defensible risk scores weighted by regulatory priorities - not just a list of gaps with equal treatment.

3. **Vendor Recommendations Lack Context:** Basic matching based solely on gap categories produces irrelevant recommendations that ignore budget constraints, implementation urgency, technical requirements, and strategic priorities.

This enhancement implements a methodology grounded in established regulatory frameworks (FFIEC BSA/AML Examination Manual, FATF 40 Recommendations) that addresses all three limitations. The evidence tier classification system automatically distinguishes document quality using AI content analysis. The two-level weighted scoring ensures critical controls (sanctions screening, transaction monitoring) carry appropriate weight while supplementary controls (training, documentation) are properly contextualized. The enhanced vendor matching integrates objective gap analysis with subjective user preferences captured through a structured questionnaire.

The result: Heliolus becomes the first compliance assessment platform where compliance officers can confidently state: "Our assessment used evidence-weighted scoring based on document quality and regulatory risk priorities, aligned with FFIEC and FATF frameworks - not just self-assessment."

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial PRD | 2025-10-07 | 1.0 | Enhanced Risk Assessment Logic - Brownfield enhancement specification from project brief | PM (John) |

---

## Requirements

### Functional

**FR1: Evidence Tier Classification**
The system shall automatically classify uploaded documents into one of three evidence tiers based on AI content analysis: Tier 2 (system-generated data: database fields, transaction IDs, timestamps, API responses, log files, metrics dashboards), Tier 1 (official policy documents: formal structure, version control, approval workflows, letterhead, regulatory citations), or Tier 0 (self-declared statements, informal documents, emails, memos).

**FR2: Evidence Tier Multiplier Application**
The system shall apply evidence tier multipliers to question scores: Tier 2 = ×1.0 (no penalty), Tier 1 = ×0.8 (20% reduction), Tier 0 = ×0.6 (40% reduction).

**FR3: AI Question Quality Scoring**
For each assessment question, the AI shall assign a raw quality score (0-5 scale) based on completeness of evidence: 5/5 = complete answer with clear evidence, 3-4/5 = partial answer or process description without proof, 1-2/5 = vague or incomplete information, 0/5 = no relevant information found.

**FR4: Question Weight Definition**
Assessment template questions shall support configurable weight values (0-1 decimal) indicating relative importance within their section, with foundational/critical questions carrying higher weights than supplementary questions.

**FR5: Section Weight Definition**
Assessment template sections shall support configurable weight values (0-1 decimal, summing to 1.0 across all sections) based on regulatory enforcement priorities and average penalty amounts for violations.

**FR6: Weighted Score Calculation**
The system shall calculate section scores as the weighted sum of (final question scores × question weights), and overall assessment scores as the weighted sum of (section scores × section weights), scaled to 0-100.

**FR7: Score Transparency**
The system shall provide complete transparency into all scoring calculations with expandable detail views showing: raw quality score, evidence tier applied, tier multiplier, question weight, final question score, section weight, and contribution to overall score.

**FR8: Gap Identification**
The system shall automatically flag any question scoring <3.0/5 (after tier multiplier) as a compliance gap.

**FR9: Gap Severity Classification**
For each identified gap, the system shall assign severity classification (Critical/High/Medium/Low) based on question importance, section context, and organizational risk profile.

**FR10: Gap Priority Ranking**
For each identified gap, the system shall assign priority ranking (1-10 scale) for remediation sequencing.

**FR11: Gap Effort Estimation**
For each identified gap, the system shall assign effort estimate (Small/Medium/Large) for remediation complexity.

**FR12: Gap Cost Estimation**
For each identified gap, the system shall assign cost range estimate (budget bands) for remediation investment.

**FR13: Personal Priorities Questionnaire - Organizational Context**
After assessment completion and before vendor matching, the system shall present a structured questionnaire capturing: company size (employees: 1-50/50-200/200-1000/1000+), annual revenue band, compliance team size (1-2/3-10/10-25/25+), primary regulatory jurisdictions (FCA/FinCEN/MAS/AUSTRAC/Multiple/Other), and existing systems requiring integration.

**FR14: Personal Priorities Questionnaire - Goals & Timeline**
The questionnaire shall capture primary goal (single select: reduce compliance risk, improve operational efficiency, cost reduction, digital transformation, regulatory readiness, AI adoption) and implementation urgency (Immediate 0-3 months, Planned 3-6 months, Strategic 6-12 months, Long-term 12+ months).

**FR15: Personal Priorities Questionnaire - Use Case Prioritization**
The questionnaire shall allow users to select all compliance areas where they have gaps (checkboxes from assessment sections), then rank top 3 priorities (numbered 1-2-3).

**FR16: Personal Priorities Questionnaire - Solution Requirements**
The questionnaire shall capture budget range (annual recurring: Under $50K/$50K-$200K/$200K-$500K/$500K-$1M/Over $1M), deployment preference (Cloud/On-Premise/Hybrid/Flexible), must-have features (select up to 5 from standardized list), and critical integrations needed.

**FR17: Personal Priorities Questionnaire - Vendor Preferences**
The questionnaire shall capture vendor maturity preference (Start-up/Established/No preference), geographic requirements (EU presence/US presence/Global/No constraints), and support model preference (Self-service/Managed service/Combination).

**FR18: Personal Priorities Questionnaire - Decision Factor Ranking**
The questionnaire shall allow users to rank decision factors by importance (drag to reorder 1-6): speed to value, innovation & AI capabilities, proven track record & references, integration ease, total cost of ownership, scalability for future growth.

**FR19: Vendor Base Scoring**
The system shall calculate vendor base scores (0-100 points) combining: Risk Area Coverage (40 points = gaps covered / total gaps × 40), Company Size Fit (20 points for target segment match), Geographic Coverage (20 points for jurisdiction match or global), Price Appropriateness (20 points based on budget alignment and cost consciousness preference).

**FR20: Vendor Priority Boosts**
The system shall apply priority boost points (0-40 additional points) for: Top Priority Coverage (+20 for #1, +15 for #2, +10 for #3 priority area, maximum one boost per vendor), Must-Have Features (+10 all features, +5 missing 1-2, +0 missing 3+), Deployment Match (+5 if matches preference), Speed to Deploy (+5 if urgency=Immediate AND implementation <3 months).

**FR21: Vendor Match Score Display**
The system shall display vendor match scores (total base + boost, max 140 points) with detailed match reasoning showing: gaps covered, priority alignments, feature matches, deployment fit, and scoring breakdown.

**FR22: Vendor Comparison**
The system shall support side-by-side vendor comparison with highlighted differentiators across scoring criteria.

**FR23: Strategy Matrix Timeline**
The system shall organize all identified gaps into three timeline buckets based on priority scores: 0-6 months/Immediate (Priority 8-10), 6-18 months/Near-term (Priority 4-7), 18+ months/Strategic (Priority 1-3).

**FR24: Timeline Bucket Aggregation**
For each timeline bucket, the system shall display: number of gaps, aggregated effort estimate (counts of small/medium/large), cost range (sum of gap cost estimates), and recommended vendors addressing multiple gaps in that timeframe.

**FR25: Enhanced Results Dashboard**
The system shall provide comprehensive assessment results view showing: overall risk score (0-100 with band: Critical 0-39/High 40-59/Medium 60-79/Low 80-100), section-by-section breakdown with drill-down to question-level scores, evidence tier distribution chart, gap summary with severity distribution, vendor recommendations with match scores, and strategy matrix timeline.

**FR26: Updated PDF Report**
The system shall generate enhanced PDF reports including: methodology explanation, evidence tier breakdown and classification rationale, two-level weighting visualization, detailed gap analysis with strategy matrix timeline, vendor match reasoning, and regulatory framework alignment statement (FFIEC/FATF references).

**FR27: Evidence Tier Confidence Scoring**
The AI evidence classification system shall provide confidence scores (0-1 decimal) for tier assignments, flagging classifications with <0.7 confidence for admin review.

**FR28: Evidence Tier Classification Explanation**
For each document, the system shall provide visible explanation of tier classification ("Classified as Tier 1 because: formal structure, version control, approval signatures detected").

**FR29: Historical Assessment Compatibility**
The system shall maintain backward compatibility with existing assessments (completed before scoring implementation) by displaying "Risk Score Not Available" message, while new assessments receive full scoring functionality.

**FR30: Template Weight Management**
The system shall provide admin interface to review and adjust question/section weights with audit trail logging all weight changes and mandatory rationale documentation.

### Non Functional

**NFR1: Evidence Classification Accuracy**
The AI evidence tier classification system shall achieve ≥85% accuracy on a validation dataset of 200+ diverse compliance documents (policies, system logs, emails, reports).

**NFR2: Evidence Classification Performance**
Document evidence tier classification shall complete within 5 seconds for documents up to 10MB.

**NFR3: Assessment Results Page Load Performance**
Assessment results page shall load within 3 seconds for assessments with 50 questions, 10 sections, and 20 uploaded documents.

**NFR4: Vendor Matching Performance**
Vendor matching algorithm shall execute within 2 seconds for matching against 100+ vendors.

**NFR5: PDF Report Generation Performance**
PDF report generation shall complete within 10 seconds for comprehensive 20+ page reports.

**NFR6: Concurrent User Capacity**
The system shall support 200 simultaneous active assessments without performance degradation.

**NFR7: Scoring Calculation Accuracy**
Weighted scoring calculations shall be mathematically accurate with floating-point precision, handling edge cases including: missing data (treat as 0/5), all Tier 0 responses (max score = 60/100), perfect scores (100/100), and partial section completion.

**NFR8: Database Migration Safety**
All Prisma schema changes shall be implemented through incremental migrations that maintain backward compatibility and allow rollback without data loss.

**NFR9: API Response Time**
New API endpoints (priorities questionnaire submission, vendor matching, strategy matrix retrieval) shall respond within 1 second at p95 latency under normal load.

**NFR10: Caching Effectiveness**
Redis caching for vendor matching results shall achieve ≥80% cache hit rate, with 24-hour TTL keyed by assessment priorities hash.

**NFR11: OpenAI API Cost Control**
Evidence tier classification shall not exceed €0.20 per document on average, with circuit breaker pattern to prevent cost overruns during classification failures.

**NFR12: Data Encryption**
User priorities data (containing PII: budget, company size, jurisdictions) shall be encrypted at rest using database-level encryption.

**NFR13: Audit Trail Completeness**
All evidence tier classification decisions, weight changes, and vendor match calculations shall be logged in audit trail with timestamp, user context, and input parameters.

**NFR14: GDPR Compliance**
User priorities data shall be exportable in machine-readable format and deletable on user request within 30 days, in compliance with GDPR Article 17 (Right to Erasure).

**NFR15: Browser Compatibility**
The enhanced UI (priorities questionnaire, strategy matrix, results dashboard) shall function correctly on Chrome/Edge (latest 2 versions), Firefox (latest 2 versions), Safari 15+.

**NFR16: Mobile Responsive Design**
While optimized for desktop, all enhanced features shall be accessible and functional on tablet devices (≥768px width).

**NFR17: Accessibility Compliance**
New UI components shall meet WCAG 2.1 Level AA standards for accessibility (keyboard navigation, screen reader compatibility, color contrast).

**NFR18: Error Handling**
Evidence classification failures shall gracefully degrade: classify as Tier 0 with user notification, log error details, allow manual re-classification in admin panel.

**NFR19: Maintenance Window Compatibility**
Enhanced scoring calculations shall be deployable without requiring assessment process interruption through feature flag controlled rollout.

**NFR20: Testing Coverage**
New services and scoring algorithms shall achieve ≥80% code coverage through Vitest unit and integration tests.

### Compatibility Requirements

**CR1: Existing API Compatibility**
All existing API endpoints shall maintain their current request/response schemas. New functionality shall be exposed through new endpoints (e.g., `/api/assessments/:id/priorities`, `/api/assessments/:id/vendor-matches-v2`, `/api/assessments/:id/strategy-matrix`).

**CR2: Database Schema Compatibility**
Prisma schema changes shall be additive only (new models, new fields, new enums). Existing fields shall not be renamed or removed. Migrations shall provide default values for new required fields on existing records.

**CR3: UI/UX Consistency**
New UI components (priorities questionnaire, strategy matrix, evidence tier indicators) shall use existing Radix UI component library, TailwindCSS utility classes, and established color palette. Visual design shall be consistent with current assessment journey.

**CR4: Integration Compatibility**
Existing Stripe subscription integration, Replit object storage, OpenAI API integration, and Redis caching shall remain unaffected. Enhanced features shall extend, not replace, these integrations.

**CR5: Freemium Tier Compatibility**
Enhanced assessment features shall respect existing freemium credit limits. Evidence classification and weighted scoring shall be available to all tiers, while priorities questionnaire and advanced vendor matching shall require Premium subscription.

**CR6: Historical Data Migration**
Existing completed assessments shall remain viewable but will display "Risk Score Not Available - Assessment completed before scoring implementation" message. Users shall be prompted to re-run assessments to receive risk scores using the new methodology.

**CR7: Email Template Compatibility**
Existing assessment completion and report ready email templates shall continue to function. Enhanced assessment completion emails shall include new content highlighting methodology improvements.

**CR8: Admin Dashboard Compatibility**
Existing admin vendor approval workflow shall remain functional. New admin features (weight management, evidence classification review) shall be added as separate sections.

---

## User Interface Enhancement Goals

### Integration with Existing UI

The enhanced assessment features will integrate seamlessly with the existing Heliolus UI design system:

**Component Library Integration:**
- Use existing Radix UI components (Dialog, Dropdown, Slider, RadioGroup, Checkbox) for priorities questionnaire
- Extend existing Card, Badge, and Button components for evidence tier indicators
- Leverage existing Recharts implementation for new visualizations (evidence distribution, section weight breakdown)

**Visual Consistency:**
- Maintain existing color palette: Primary blues, success greens, warning yellows, danger reds
- Use established typography hierarchy (Inter font family)
- Apply consistent spacing using Tailwind scale (4px base unit)
- Maintain existing assessment journey flow (multi-step wizard pattern)

**Design Patterns:**
- Progressive disclosure: Show overall score prominently, provide drill-down for calculation details
- Inline help: Tooltip explanations for evidence tiers, weighting methodology, priority concepts
- Status indication: Clear visual distinction between Tier 0/1/2 evidence using color-coded badges
- Empty states: Guidance for users with no Tier 2 evidence on how to obtain system-generated documentation

### Modified/New Screens and Views

**1. Document Upload Screen (Modified)**
- Add real-time evidence tier classification indicator as documents are analyzed
- Display tier badge (Tier 0: gray, Tier 1: blue, Tier 2: green) with confidence score
- Show expandable classification explanation panel
- Maintain existing drag-drop upload UX

**2. Assessment Results Dashboard (Major Enhancement)**
- **Overview Section:** Large risk score display (0-100 with color-coded band), evidence tier distribution donut chart, overall assessment quality indicator
- **Section Breakdown:** Expandable accordion per section showing section score, weight contribution, and question-level detail
- **Question Detail View:** Drill-down showing raw quality score, evidence tier applied, multiplier, question weight, final score, and supporting evidence citations
- **Gap Analysis Tab:** Filterable/sortable table of identified gaps with severity, priority, effort, cost columns
- **Strategy Matrix Tab:** Three-column timeline view (0-6 months, 6-18 months, 18+ months) with gap cards, metrics, and vendor recommendations
- **Vendor Matches Tab:** Ranked vendor cards with match scores, match reasoning badges, and comparison selection

**3. Personal Priorities Questionnaire (New)**
- 6-step multi-page form with progress indicator
- Step 1: Organizational context (dropdowns, multi-select for jurisdictions/systems)
- Step 2: Goals & timeline (radio buttons for primary goal, implementation urgency slider)
- Step 3: Use case prioritization (checkbox grid of gap areas, drag-to-rank top 3 interface)
- Step 4: Solution requirements (budget dropdown, deployment radio, feature multi-select up to 5, integration checklist)
- Step 5: Vendor preferences (radio groups for maturity/geography/support model)
- Step 6: Decision factor ranking (drag-and-drop list reordering 6 factors)
- Review & submit step with editable summary

**4. Vendor Comparison View (Enhanced)**
- Side-by-side comparison table (up to 3 vendors)
- Highlight cells showing differentiators (best in category)
- Match score breakdown visualization per vendor
- Gap coverage matrix showing which gaps each vendor addresses
- Feature comparison checklist
- Pricing comparison (if available)
- CTA buttons: "Contact Vendor", "Request More Info", "Remove from Comparison"

**5. Strategy Matrix Timeline View (New)**
- Three-column responsive layout (collapses to vertical on tablet)
- Each column: Timeline header (e.g., "0-6 Months: Immediate"), metrics summary (gap count, effort distribution, cost range), gap cards with severity badges, recommended vendors section
- Gap cards: Gap title, severity indicator, priority score, effort/cost estimates, "View Details" link
- Visual connectors showing gap-to-vendor relationships
- Export to PDF button for timeline roadmap

**6. Methodology Explanation Page (New)**
- Educational content explaining evidence tier system, two-level weighting, regulatory framework alignment (FFIEC/FATF)
- Worked example with sample calculations
- FAQ section addressing common questions
- Linked from assessment results with "How is this calculated?" button

**7. Admin Weight Management Interface (New)**
- Template selection dropdown
- Section list with current weights (editable sliders ensuring sum=1.0)
- Question list per section with current weights (editable, sum validation)
- Regulatory framework reference field (FFIEC/FATF citation)
- Audit trail panel showing weight change history
- Save with mandatory change rationale text area

**8. Admin Evidence Classification Review (New)**
- Filtered list of documents with confidence score <0.7
- Document preview panel
- Current tier classification with explanation
- Override dropdown (Tier 0/1/2 with mandatory justification)
- Bulk operations: "Approve All", "Flag for User Review"

### UI Consistency Requirements

**Visual Design Standards:**
- All new components shall use existing CVA (class-variance-authority) patterns for variant management
- Loading states shall use existing skeleton UI patterns
- Error states shall use existing inline error message styling
- Success confirmations shall use existing toast notification system

**Interaction Patterns:**
- Form validation shall show inline errors on blur, not on every keystroke
- Long-running operations (evidence classification, report generation) shall show progress indicators
- Destructive actions (override tier classification) shall require confirmation dialogs
- Navigation between enhancement features shall maintain existing breadcrumb pattern

**Responsive Behavior:**
- Priorities questionnaire shall be mobile-accessible but optimized for desktop (small text inputs acceptable on mobile)
- Strategy matrix shall stack vertically on screens <1024px
- Vendor comparison shall limit to 2 vendors on tablet, 3 on desktop
- Data tables shall be horizontally scrollable on small screens with sticky first column

**Performance UX:**
- Evidence tier classification shall show "Analyzing..." spinner during processing
- Vendor matching shall show skeleton vendor cards during calculation
- Strategy matrix shall lazy-load gap details on scroll
- PDF report generation shall show progress modal with cancel option

---

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages:**
- TypeScript 5.5 (frontend), TypeScript 5.2 (backend)
- Node.js >=18.0.0

**Frameworks:**
- **Frontend:** Vite 5.x + React 18 + React Router DOM 6
- **Backend:** Fastify 4 (faster alternative to Express)
- **State Management:** Zustand 5 (lightweight), TanStack Query 5 (server state)
- **UI Components:** Radix UI (35+ accessible components), TailwindCSS 3.4
- **Forms:** React Hook Form 7 + Zod validation
- **Charts:** Recharts 2
- **Animations:** Framer Motion 12

**Database:**
- Replit PostgreSQL with Prisma 6 ORM
- Redis for caching and sessions

**Infrastructure:**
- Docker Compose for local development
- Replit object storage for document storage
- GitHub Actions for CI/CD

**External Dependencies:**
- OpenAI API (GPT-4 for AI analysis and classification)
- Stripe (payments and subscriptions)
- Replit storage API (object storage)

**Constraints:**
- Must maintain backward compatibility with Prisma schema
- Cannot introduce breaking API changes
- Must work within OpenAI API rate limits (60 requests/minute)
- Must respect Fastify 4 plugin architecture patterns
- Must use existing authentication middleware (@fastify/jwt)

### Integration Approach

**Database Integration Strategy:**

*Schema Extensions (Additive Only):*
```prisma
// New enums
enum EvidenceTier {
  TIER_0  // Self-declared (×0.6)
  TIER_1  // Policy documents (×0.8)
  TIER_2  // System-generated (×1.0)
}

enum EffortRange {
  SMALL
  MEDIUM
  LARGE
}

enum CostRange {
  UNDER_10K
  RANGE_10K_50K
  RANGE_50K_100K
  RANGE_100K_250K
  OVER_250K
}

// Extend existing Document model
model Document {
  // ... existing fields ...
  evidenceTier              EvidenceTier?
  tierClassificationReason  String?       // AI explanation
  tierConfidenceScore       Float?        // 0-1 confidence
  classifiedAt              DateTime?
}

// Extend existing Question model (template level)
model Question {
  // ... existing fields ...
  weight                    Float?        @default(1.0) // Within section
  isFoundational            Boolean       @default(false)
}

// Extend existing Section model (template level)
model Section {
  // ... existing fields ...
  weight                    Float         @default(0.1) // Overall assessment
  regulatoryPriority        String?       // FFIEC, FATF reference
}

// Extend existing Answer model
model Answer {
  // ... existing fields ...
  rawQualityScore           Float?        // AI score 0-5 before multiplier
  evidenceTier              EvidenceTier? // Tier of best evidence
  tierMultiplier            Float?        // 0.6, 0.8, or 1.0
  finalScore                Float?        // rawQualityScore × tierMultiplier
}

// Extend existing Gap model
model Gap {
  // ... existing fields ...
  effort                    EffortRange?
  costRange                 CostRange?
}

// New model for priorities questionnaire
model AssessmentPriorities {
  id                        String        @id @default(cuid())
  assessmentId              String        @unique
  assessment                Assessment    @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  // Step 1: Organizational context
  companySize               CompanySize
  annualRevenue             AnnualRevenue
  complianceTeamSize        ComplianceTeamSize
  jurisdictions             String[]      // ["FinCEN", "FCA", "MAS"]
  existingSystems           String[]      // ["Salesforce", "SAP"]

  // Step 2: Goals & timeline
  primaryGoal               String        // "Reduce compliance risk"
  implementationUrgency     String        // "Immediate"

  // Step 3: Use case prioritization
  selectedUseCases          String[]      // ["Sanctions", "KYC", "TM"]
  rankedPriorities          String[]      // ["Sanctions", "TM", "KYC"]

  // Step 4: Solution requirements
  budgetRange               String        // "$200K-$500K"
  deploymentPreference      String        // "Cloud"
  mustHaveFeatures          String[]      // ["Real-time", "AI/ML"]
  criticalIntegrations      String[]      // ["Salesforce"]

  // Step 5: Vendor preferences
  vendorMaturity            String        // "Established"
  geographicRequirements    String        // "US presence"
  supportModel              String        // "Managed service"

  // Step 6: Decision factors (ordered)
  decisionFactorRanking     String[]      // ["Speed", "Innovation", "Track record"]

  createdAt                 DateTime      @default(now())
  updatedAt                 DateTime      @updatedAt
}

// Extend existing VendorMatch model
model VendorMatch {
  // ... existing fields ...
  baseScore                 Float?        // 0-100 base points
  priorityBoost             Float?        // 0-40 boost points
  totalScore                Float?        // baseScore + priorityBoost
  matchReasons              Json?         // Detailed breakdown
}
```

*Migration Strategy:*
- Phase 1: Add new enums and nullable fields to existing models (non-breaking)
- Phase 2: Add new AssessmentPriorities model
- Phase 3: Backfill default values for existing assessments (weight=1.0 for all questions/sections)
- Phase 4: Feature flag to enable enhanced scoring for new assessments

**API Integration Strategy:**

*New Endpoints (RESTful):*
```
POST   /api/assessments/:id/priorities              # Submit priorities questionnaire
GET    /api/assessments/:id/priorities              # Retrieve saved priorities
PUT    /api/assessments/:id/priorities              # Update priorities

GET    /api/assessments/:id/vendor-matches-v2       # Enhanced vendor matching
GET    /api/assessments/:id/strategy-matrix         # Timeline-based gap organization

POST   /api/documents/:id/reclassify                # Admin: override evidence tier
GET    /api/admin/evidence-classification/review    # Documents with low confidence

PUT    /api/admin/templates/:id/weights             # Update question/section weights
GET    /api/admin/templates/:id/weight-history      # Audit trail of weight changes
```

*Existing Endpoint Enhancements:*
```
GET /api/assessments/:id/results
  - Add evidenceTierDistribution object to response
  - Add scoringMethodology: "complete" | "unavailable"
  - Add weightedSectionScores array with breakdown

POST /api/assessments/:id/complete
  - Trigger evidence classification for all documents
  - Calculate weighted scores
  - Redirect to priorities questionnaire (if Premium)
```

*Backward Compatibility Approach:*
- Pre-implementation assessments return `scoringMethodology: "unavailable"` with "Risk Score Not Available" message
- New assessments return `scoringMethodology: "complete"` with weighted score calculations
- Frontend conditionally renders scoring results or "not available" message based on methodology flag

**Frontend Integration Strategy:**

*New Component Structure:*
```
src/components/assessment/
  evidence-tier/
    EvidenceTierBadge.tsx           # Tier 0/1/2 indicator
    EvidenceTierExplanation.tsx     # Classification reasoning
    EvidenceTierDistribution.tsx    # Donut chart visualization

  priorities/
    PrioritiesQuestionnaire.tsx     # Main wrapper
    OrganizationalContext.tsx       # Step 1
    GoalsTimeline.tsx               # Step 2
    UseCasePrioritization.tsx       # Step 3
    SolutionRequirements.tsx        # Step 4
    VendorPreferences.tsx           # Step 5
    DecisionFactorRanking.tsx       # Step 6
    PrioritiesReview.tsx            # Summary step

  results/
    EnhancedResultsDashboard.tsx    # Main results view
    ScoringBreakdown.tsx            # Expandable calculation details
    SectionScoreCard.tsx            # Section-level drill-down
    QuestionDetailView.tsx          # Question-level detail

  strategy-matrix/
    StrategyMatrixTimeline.tsx      # Three-column timeline
    TimelineBucket.tsx              # Single bucket (0-6, 6-18, 18+)
    GapCard.tsx                     # Individual gap in timeline

  vendor-matching/
    EnhancedVendorCard.tsx          # Vendor with match score
    VendorMatchReasons.tsx          # Match reasoning badges
    VendorComparisonView.tsx        # Side-by-side comparison
```

*State Management Approach:*
- Use TanStack Query for server state (assessment results, vendor matches, priorities)
- Use Zustand for UI state (questionnaire step, comparison selections, expanded sections)
- Leverage optimistic updates for priorities questionnaire submission

*API Client Updates:*
```typescript
// src/lib/api.ts extensions
export const prioritiesApi = {
  submit: (assessmentId: string, data: PrioritiesData) =>
    api.post(`/assessments/${assessmentId}/priorities`, data),
  get: (assessmentId: string) =>
    api.get(`/assessments/${assessmentId}/priorities`),
  update: (assessmentId: string, data: PrioritiesData) =>
    api.put(`/assessments/${assessmentId}/priorities`, data),
};

export const vendorMatchingApiV2 = {
  getMatches: (assessmentId: string) =>
    api.get(`/assessments/${assessmentId}/vendor-matches-v2`),
};

export const strategyMatrixApi = {
  get: (assessmentId: string) =>
    api.get(`/assessments/${assessmentId}/strategy-matrix`),
};
```

**Testing Integration Strategy:**

*Unit Tests (Vitest):*
- `weighted-scoring.service.spec.ts` - Test scoring algorithm with edge cases
- `evidence-classification.service.spec.ts` - Test tier classification logic
- `vendor-matching.service.spec.ts` - Test matching algorithm point calculations
- `strategy-matrix.service.spec.ts` - Test timeline bucket assignment

*Integration Tests:*
- `assessment-enhanced-flow.spec.ts` - End-to-end enhanced assessment flow
- `priorities-questionnaire.spec.ts` - Priorities submission and retrieval
- `vendor-matching-v2.spec.ts` - Enhanced vendor matching with priorities

*Contract Tests:*
- Validate new API endpoint request/response schemas
- Ensure backward compatibility of existing endpoints with new fields

### Code Organization and Standards

**File Structure Approach:**

*Backend Service Organization:*
```
backend/src/
  services/
    evidence-classification.service.ts    # NEW: AI document tier classification
    weighted-scoring.service.ts           # NEW: Two-level weighted calculations
    vendor-matching.service.ts            # NEW: Enhanced matching algorithm
    priorities.service.ts                 # NEW: Questionnaire data management
    strategy-matrix.service.ts            # NEW: Timeline gap organization
    ai-analysis.service.ts                # MODIFIED: Add classification prompts
    assessment.service.ts                 # MODIFIED: Integrate weighted scoring

  scoring/                                 # NEW: Shared scoring utilities
    weight-calculator.ts                   # Question/section weight calculations
    tier-multiplier.ts                     # Evidence tier multiplier application
    score-aggregator.ts                    # Weighted sum calculations

  classification/                          # NEW: Classification utilities
    tier-classifier.ts                     # AI-based classification
    confidence-scorer.ts                   # Classification confidence
    tier-validator.ts                      # Validation rules

  matching/                                # NEW: Vendor matching utilities
    base-scorer.ts                         # Base score calculation (0-100)
    priority-booster.ts                    # Priority boost calculation (0-40)
    match-reasoner.ts                      # Match reasoning generation
```

*Frontend Component Organization:*
```
frontend/src/
  components/assessment/
    evidence-tier/                         # NEW: Evidence tier components
    priorities/                            # NEW: Questionnaire components
    results/                               # MODIFIED: Enhanced results
    strategy-matrix/                       # NEW: Timeline components
    vendor-matching/                       # MODIFIED: Enhanced matching
```

**Naming Conventions:**
- Services: `<feature>.service.ts` (e.g., `evidence-classification.service.ts`)
- Utilities: `<function>-<noun>.ts` (e.g., `weight-calculator.ts`)
- React Components: PascalCase with descriptive names (e.g., `EvidenceTierBadge.tsx`)
- API routes: kebab-case (e.g., `/vendor-matches-v2`)
- Database models: PascalCase singular (e.g., `AssessmentPriorities`)

**Coding Standards:**
- **TypeScript Strict Mode:** Enforce strict type checking (noImplicitAny, strictNullChecks)
- **Error Handling:** Use try-catch with structured error responses, never throw untyped errors
- **Async/Await:** Prefer async/await over promises for readability
- **Service Patterns:** Services extend BaseService class, use dependency injection for Prisma client
- **React Patterns:** Functional components with hooks, custom hooks for reusable logic (e.g., `useWeightedScore`)
- **Form Validation:** Zod schemas defined alongside components, reused for API validation
- **Testing:** Co-locate test files (`.spec.ts`) with source files

**Documentation Standards:**
- JSDoc comments for all public service methods with @param and @returns
- Inline comments for complex scoring algorithm logic
- README.md in new directories explaining module purpose
- API endpoint documentation via @fastify/swagger decorators

### Deployment and Operations

**Build Process Integration:**
- Backend: `npm run build` in `backend/` - TypeScript compilation to `dist/`
- Frontend: `npm run build` in `frontend/` - Vite production build to `dist/`
- Root: `npm run build` - Concurrent build of both frontend and backend
- No changes to existing build process required

**Deployment Strategy:**
- **Phase 1 (Week 1):** Deploy backend schema migrations only (additive, non-breaking)
- **Phase 2 (Week 2):** Deploy backend services with feature flag `ENHANCED_SCORING_ENABLED=false`
- **Phase 3 (Week 3):** Deploy frontend with enhanced UI components (hidden behind feature flag)
- **Phase 4 (Week 4):** Enable feature flag for internal testing (10 beta users)
- **Phase 5 (Week 6):** Gradual rollout to Premium users (10% daily increase)
- **Phase 6 (Week 8):** Full production rollout to all users

**Monitoring and Logging:**
- **New Metrics:**
  - `evidence_classification_duration_ms` (histogram) - Time to classify documents
  - `evidence_classification_confidence` (gauge) - Average confidence scores
  - `weighted_score_calculation_duration_ms` (histogram) - Scoring performance
  - `vendor_matching_v2_duration_ms` (histogram) - Matching algorithm performance
  - `priorities_questionnaire_completion_rate` (counter) - Completion vs abandonment

- **Logging:**
  - Log all evidence tier classifications with document ID, tier, confidence, reasoning
  - Log vendor match calculations with assessment ID, priorities hash, top 10 vendors
  - Log weight changes with admin user, template ID, old/new values, rationale
  - Log scoring algorithm errors with full context for debugging

- **Alerts:**
  - Evidence classification accuracy drops below 80% (based on admin override rate)
  - OpenAI API error rate exceeds 5%
  - Vendor matching execution time exceeds 5 seconds (p95)
  - Assessment results page load exceeds 5 seconds (p95)

**Configuration Management:**
- **Environment Variables (New):**
  ```
  ENHANCED_SCORING_ENABLED=true|false           # Feature flag
  EVIDENCE_CLASSIFICATION_CONFIDENCE_THRESHOLD=0.7  # Low confidence flagging
  VENDOR_MATCHING_MIN_SCORE=80                  # Min score to display vendor
  STRATEGY_MATRIX_PRIORITY_THRESHOLDS=8,4,1     # Timeline bucket thresholds
  OPENAI_CLASSIFICATION_MAX_TOKENS=1000         # Token limit per classification
  ```

- **Configuration Files (New):**
  ```
  backend/src/config/scoring-weights.json       # Default question/section weights
  backend/src/config/vendor-matching-weights.json # Matching algorithm weights
  backend/src/config/evidence-tier-prompts.json  # AI classification prompts
  ```

- **Redis Keys:**
  ```
  vendor_matches:v2:<priorities_hash>           # Cached matching results (24hr TTL)
  strategy_matrix:<assessment_id>               # Cached timeline (7 day TTL)
  evidence_classification:<document_id>         # Cached classification (30 day TTL)
  ```

### Risk Assessment and Mitigation

**Technical Risks:**

*Risk 1: Evidence Classification Accuracy Below 85% Target*
- **Impact:** User trust eroded, inflated/deflated scores, manual admin overhead
- **Mitigation:**
  - Build comprehensive validation dataset (500+ labeled documents) before launch
  - Implement confidence scoring with admin review queue for <0.7 confidence
  - A/B test multiple prompt variations to optimize accuracy
  - Provide user-visible explanation for every classification to build trust
  - Plan for rapid prompt iteration based on production data

*Risk 2: Weighted Scoring Algorithm Bugs*
- **Impact:** Incorrect risk scores, regulatory defensibility compromised, user complaints
- **Mitigation:**
  - Extensive unit test coverage (edge cases: missing data, all zeros, perfect scores, single-question sections)
  - Manual verification of scoring calculations with worked examples
  - During beta: validate scoring calculations against manually calculated test cases
  - Audit trail of all scores with input parameters for debugging
  - Gradual rollout with 10 beta users before broad release

*Risk 3: Performance Degradation on Large Assessments*
- **Impact:** User frustration, assessment abandonment, server resource exhaustion
- **Mitigation:**
  - Load testing with realistic data (100 questions, 50 documents)
  - Aggressive caching strategy (Redis for vendor matches, memoization for score calculations)
  - Async processing for evidence classification (background jobs, don't block UI)
  - Database query optimization (add indexes on new fields)
  - Set hard performance budgets (p95 latency SLOs) and monitor continuously

*Risk 4: OpenAI API Rate Limits / Cost Overruns*
- **Impact:** Evidence classification failures, degraded user experience, unexpected costs
- **Mitigation:**
  - Circuit breaker pattern: after 5 consecutive failures, classify as Tier 0 with notification
  - Rate limiting: max 10 classification requests per user per minute
  - Cost monitoring: alert if daily OpenAI spend exceeds €100
  - Caching: cache classification results for 30 days to avoid re-classification
  - Token optimization: limit prompt + response to 1500 tokens per classification

**Integration Risks:**

*Risk 5: Prisma Migration Failures*
- **Impact:** Database corruption, data loss, deployment rollback required
- **Mitigation:**
  - Staging environment testing before production migration
  - Incremental migrations with rollback scripts prepared
  - Database backup immediately before migration
  - Migrations deployed separately from code (Phase 1 deployment)
  - Zero-downtime migration strategy using nullable fields initially

*Risk 6: Frontend/Backend Version Mismatch*
- **Impact:** API errors, broken UI, user confusion
- **Mitigation:**
  - Version API endpoints (e.g., `/vendor-matches-v2`)
  - Frontend feature detection: check for `scoringMethodology` field, gracefully degrade if missing
  - Synchronized deployment: backend first, frontend second, minimize window
  - Feature flags: enable enhanced features only when both backend and frontend deployed

*Risk 7: Existing Assessment Compatibility Issues*
- **Impact:** Historical assessments unviewable, user complaints about changed scores
- **Mitigation:**
  - Feature flag per assessment: store `scoringMethodology` field on Assessment model
  - Historical assessment mode: render "Risk Score Not Available - Assessment completed before scoring implementation"
  - Clear labeling for new assessments: "Evidence-Weighted Risk Assessment"
  - Migration tool: allow users to opt-in to re-scoring historical assessments
  - Documentation: explain methodology differences in help center

**Deployment Risks:**

*Risk 8: Gradual Rollout Failures*
- **Impact:** Inconsistent user experience, feature flag bugs, partial failures
- **Mitigation:**
  - Robust feature flag implementation using environment variable + database override
  - Rollout monitoring dashboard: track % users with enhanced features enabled, error rates
  - Rollback plan: disable feature flag immediately if error rate >5%
  - Phased rollout: 10% day 1, 25% day 2, 50% day 3, 100% day 5
  - Beta cohort selection: invite power users, Premium subscribers first

---

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision:** Single comprehensive epic for brownfield enhancement with logical story sequencing

**Rationale:**

This enhancement, while significant in scope, represents a cohesive transformation of the existing assessment engine around a single theme: evidence-weighted, regulatory-aligned risk scoring. Breaking into multiple epics would create artificial boundaries and coordination challenges across tightly coupled components (e.g., evidence classification feeds weighted scoring, which feeds gap prioritization, which feeds vendor matching, which depends on priorities questionnaire).

**Single Epic Benefits:**
- Maintains clear narrative: "Transform assessment engine from basic to audit-grade"
- Simplifies dependency management: stories naturally sequence within one epic
- Aligns with user journey: users experience all enhancements as integrated improvement
- Facilitates testing: full end-to-end testing of enhanced assessment flow
- Matches delivery timeline: 12-14 week MVP aligns with single epic cadence

**Story Sequencing Strategy:**

Stories will follow "foundation-first, UI-last" sequencing to minimize risk:

1. **Foundation Stories (Weeks 1-4):** Database schema, core services, scoring algorithms without UI
2. **Integration Stories (Weeks 5-8):** Connect new services to existing assessment flow, API endpoints
3. **UI Stories (Weeks 9-12):** Enhanced visualization, priorities questionnaire, strategy matrix
4. **Polish Stories (Weeks 13-14):** Admin tools, methodology page, PDF report enhancements

Each story includes integration verification steps to ensure existing functionality remains intact.

---

## Epic 1: Enhanced Risk Assessment Logic

**Epic Goal:** Implement the core risk assessment scoring functionality (currently non-functional) with a defensible, regulatory-aligned compliance scoring system featuring evidence-weighted methodology, intelligent gap prioritization, integrated user preferences, and phased remediation planning.

**Integration Requirements:**
- Maintain 100% backward compatibility with existing assessments (display without scores for pre-implementation assessments)
- Preserve existing API contracts (new functionality via new endpoints)
- Extend existing Prisma schema additively (no field removals/renames)
- Integrate seamlessly with existing Stripe subscription, Replit object storage, OpenAI AI analysis
- Respect existing freemium credit limits (enhanced features gated by subscription tier)

---

### Story 1.1: Database Schema Foundation - Evidence Tiers and Scoring Fields

As a **backend developer**,
I want **to extend the Prisma schema with evidence tier classification fields, scoring weight fields, and new enums**,
so that **the database can store enhanced assessment data without breaking existing functionality**.

#### Acceptance Criteria

1. New `EvidenceTier` enum created with values TIER_0, TIER_1, TIER_2
2. New `EffortRange` enum created with values SMALL, MEDIUM, LARGE
3. New `CostRange` enum created with values UNDER_10K, RANGE_10K_50K, RANGE_50K_100K, RANGE_100K_250K, OVER_250K
4. `Document` model extended with nullable fields: `evidenceTier`, `tierClassificationReason`, `tierConfidenceScore`, `classifiedAt`
5. `Question` model extended with fields: `weight` (default 1.0), `isFoundational` (default false)
6. `Section` model extended with fields: `weight` (default 0.1), `regulatoryPriority`
7. `Answer` model extended with nullable fields: `rawQualityScore`, `evidenceTier`, `tierMultiplier`, `finalScore`
8. `Gap` model extended with nullable fields: `effort`, `costRange`
9. Prisma migration generated and runs successfully on test database
10. Migration is reversible (rollback tested)
11. Existing assessments remain queryable after migration
12. Default values populate correctly for existing records

#### Integration Verification

1. **IV1: Existing assessment retrieval works** - Query existing assessments before and after migration, verify identical results
2. **IV2: Existing document upload works** - Upload document to existing assessment, verify no errors with new nullable fields
3. **IV3: Existing answer creation works** - Create answer in existing assessment, verify new fields remain null and don't break queries

---

### Story 1.2: Database Schema Foundation - Assessment Priorities Model

As a **backend developer**,
I want **to create the AssessmentPriorities model for storing user questionnaire responses**,
so that **vendor matching can access user preferences and priorities**.

#### Acceptance Criteria

1. `AssessmentPriorities` model created with all 6 questionnaire step fields
2. Model includes: companySize, annualRevenue, complianceTeamSize, jurisdictions (array), existingSystems (array)
3. Model includes: primaryGoal, implementationUrgency
4. Model includes: selectedUseCases (array), rankedPriorities (array)
5. Model includes: budgetRange, deploymentPreference, mustHaveFeatures (array), criticalIntegrations (array)
6. Model includes: vendorMaturity, geographicRequirements, supportModel
7. Model includes: decisionFactorRanking (array)
8. Model has unique constraint on assessmentId (one priorities per assessment)
9. Model has cascading delete relationship with Assessment
10. Prisma migration generated and runs successfully
11. Model can be created, read, updated via Prisma client
12. Validation: arrays cannot be empty for required fields

#### Integration Verification

1. **IV1: Assessment creation works** - Create new assessment without priorities, verify no foreign key errors
2. **IV2: Assessment deletion cascades** - Delete assessment with priorities, verify priorities also deleted
3. **IV3: Prisma client generates types** - Run `prisma generate`, verify `AssessmentPriorities` type available in TypeScript

---

### Story 1.3: Evidence Classification Service - AI Tier Classifier

As a **backend developer**,
I want **to create an evidence classification service that uses OpenAI to analyze documents and assign evidence tiers**,
so that **documents can be automatically classified as Tier 0, 1, or 2 based on content characteristics**.

#### Acceptance Criteria

1. New service file `evidence-classification.service.ts` created extending BaseService
2. Service method `classifyDocument(documentId: string): Promise<ClassificationResult>` implemented
3. Method fetches document content from Replit object storage
4. Method sends document to OpenAI GPT-4 with classification prompt
5. Prompt instructs AI to identify: formal structure, version control indicators, approval workflows, system-generated data markers
6. AI returns: tier (0/1/2), confidence (0-1), reasoning (string explanation)
7. Method saves classification to Document record: evidenceTier, tierConfidenceScore, tierClassificationReason, classifiedAt
8. Method handles OpenAI API errors gracefully: log error, classify as TIER_0, return low confidence
9. Method includes circuit breaker: after 5 consecutive failures, disable classification for 5 minutes
10. Method caches classification results in Redis (key: `evidence_classification:<document_id>`, TTL: 30 days)
11. Unit tests cover: successful classification, API errors, circuit breaker activation, cache hits
12. Integration test: classify real sample documents (policy PDF, CSV log file, email TXT)

#### Integration Verification

1. **IV1: Existing document parsing works** - Upload document through existing flow, verify parsedContent field still populated correctly
2. **IV2: Existing AI analysis works** - Run existing assessment, verify ai-analysis.service still generates answers without interference
3. **IV3: Object storage document retrieval works** - Classification service fetches document from Replit object storage using existing objectStorage.ts wrapper

---

### Story 1.4: Weighted Scoring Service - Question and Section Scoring

As a **backend developer**,
I want **to create a weighted scoring service that calculates assessment scores using evidence tier multipliers and two-level weighting**,
so that **assessment risk scores reflect regulatory priorities and evidence quality**.

#### Acceptance Criteria

1. New service file `weighted-scoring.service.ts` created
2. Method `calculateQuestionScore(answerId: string): Promise<QuestionScore>` implemented:
   - Fetches Answer with related Document(s) evidenceTier
   - Applies tier multiplier: TIER_2=1.0, TIER_1=0.8, TIER_0=0.6
   - Calculates finalScore = rawQualityScore × tierMultiplier
   - Saves to Answer: evidenceTier (best tier used), tierMultiplier, finalScore
   - Returns: { questionId, rawScore, tier, multiplier, finalScore }
3. Method `calculateSectionScore(sectionId: string, assessmentId: string): Promise<SectionScore>` implemented:
   - Fetches all Questions in Section with weights
   - Fetches all Answers for those Questions
   - Calculates weighted sum: Σ(finalScore × questionWeight) / Σ(questionWeights)
   - Returns: { sectionId, questionScores, weightedAverage, sectionWeight }
4. Method `calculateOverallScore(assessmentId: string): Promise<OverallScore>` implemented:
   - Fetches all Sections with weights
   - Calculates section scores
   - Calculates weighted sum: Σ(sectionScore × sectionWeight)
   - Scales to 0-100
   - Determines risk band: 0-39 Critical, 40-59 High, 60-79 Medium, 80-100 Low
   - Returns: { overallScore, riskBand, sectionScores, methodology: "complete" }
5. Utility functions in `backend/src/scoring/`:
   - `weight-calculator.ts` - Validates weights sum to 1.0
   - `tier-multiplier.ts` - Tier to multiplier mapping
   - `score-aggregator.ts` - Weighted sum calculations
6. Edge cases handled: missing answers (treat as 0/5), all Tier 0 (max score 60), perfect score (100)
7. Unit tests achieve 90% coverage with edge case scenarios
8. Performance: calculateOverallScore completes <500ms for 50-question assessment

#### Integration Verification

1. **IV1: Existing assessment completion works** - Run assessment completion flow, verify other assessment functionality (gap identification, AI analysis) still works
2. **IV2: Assessment service integration** - Verify assessment.service.ts can call weighted-scoring.service when feature flag enabled
3. **IV3: Database writes don't break queries** - After scoring, query assessment results through existing API, verify no schema errors with new score fields

---

### Story 1.5: Gap Prioritization Enhancement - Severity, Priority, Effort, Cost

As a **backend developer**,
I want **to enhance gap identification to automatically assign severity, priority, effort, and cost estimates**,
so that **users receive actionable prioritization guidance for remediation**.

#### Acceptance Criteria

1. Extend existing gap identification logic in `assessment.service.ts` to assign:
   - **Severity:** Critical (score <1.5), High (1.5-2.5), Medium (2.5-3.5), Low (3.5+)
   - **Priority:** 1-10 scale based on: severity + question.isFoundational + section.weight
   - **Effort:** SMALL (isolated change), MEDIUM (moderate integration), LARGE (extensive work)
   - **Cost:** Budget range based on effort and gap category
2. Priority calculation formula:
   ```
   priority = (5 - score) * 2                    // Base: 0-10 from score
   priority += question.isFoundational ? 2 : 0   // Boost foundational
   priority += section.weight * 5                // Boost high-weight sections
   priority = Math.min(10, Math.round(priority)) // Cap at 10
   ```
3. Effort estimation logic:
   - SMALL: Section weight <0.15 or non-foundational question
   - MEDIUM: Section weight 0.15-0.25 or foundational question
   - LARGE: Section weight >0.25 and foundational and score <2.0
4. Cost estimation logic:
   - UNDER_10K: Small effort
   - RANGE_10K_50K: Small effort + foundational, or Medium effort
   - RANGE_50K_100K: Medium effort + foundational, or Large effort
   - RANGE_100K_250K: Large effort + Critical severity
   - OVER_250K: Large effort + Critical severity + high section weight (>0.20)
5. Gap records updated with: severity, priority, effort, costRange
6. Method `prioritizeGaps(assessmentId: string): Promise<Gap[]>` returns sorted gaps (priority desc)
7. Unit tests verify priority calculations for all severity/foundational/weight combinations
8. Integration test: Complete assessment, verify gaps have all new fields populated correctly

#### Integration Verification

1. **IV1: Existing gap identification works** - Verify existing gap identification logic (threshold-based) is enhanced, not replaced
2. **IV2: Gap dashboard query works** - Query gaps through existing API after enhancement, verify new fields (priority, effort, costRange) returned without breaking frontend
3. **IV3: Gap data structure preserved** - Verify gaps still have existing fields (title, description, severity) plus new prioritization fields

---

### Story 1.6: Priorities Questionnaire Service - Data Management

As a **backend developer**,
I want **to create a service for managing assessment priorities questionnaire data**,
so that **user preferences can be stored, retrieved, and validated for vendor matching**.

#### Acceptance Criteria

1. New service file `priorities.service.ts` created
2. Method `submitPriorities(assessmentId: string, data: PrioritiesDTO): Promise<AssessmentPriorities>` implemented:
   - Validates data using Zod schema (all required fields present, arrays non-empty, valid enum values)
   - Creates or updates AssessmentPriorities record
   - Returns created/updated priorities
3. Method `getPriorities(assessmentId: string): Promise<AssessmentPriorities | null>` implemented
4. Method `validatePriorities(data: PrioritiesDTO): ValidationResult` implemented:
   - Checks: rankedPriorities array has exactly 3 elements
   - Checks: rankedPriorities are subset of selectedUseCases
   - Checks: mustHaveFeatures has max 5 elements
   - Checks: decisionFactorRanking has all 6 factors (no duplicates, no missing)
   - Returns: { valid: boolean, errors: string[] }
5. Zod schema `PrioritiesSchema` defined with all field validations
6. Service integrates with existing `assessment.service.ts` for assessment existence check
7. Unit tests cover: validation failures, successful creation, updates, retrieval
8. Integration test: Submit priorities via service, retrieve, verify data integrity

#### Integration Verification

1. **IV1: Assessment completion flow works** - Complete assessment without priorities, verify assessment status = COMPLETED (priorities optional)
2. **IV2: Premium subscription check works** - Non-Premium user attempts to submit priorities, verify graceful handling (optional: gate behind subscription)
3. **IV3: Assessment deletion cascades** - Delete assessment, verify priorities deleted via cascade relationship

---

### Story 1.7: Enhanced Vendor Matching Service - Base Scoring Algorithm

As a **backend developer**,
I want **to implement the base scoring component (0-100 points) of the vendor matching algorithm**,
so that **vendors can be objectively evaluated on gap coverage, size fit, geography, and price**.

#### Acceptance Criteria

1. New service file `vendor-matching.service.ts` created
2. Method `calculateBaseScore(vendor: Vendor, assessment: Assessment, priorities: AssessmentPriorities): Promise<BaseScore>` implemented
3. **Risk Area Coverage (40 points):**
   - Fetch gaps for assessment
   - Count gaps in categories vendor covers (based on vendor.categories array)
   - Calculate: (coveredGaps / totalGaps) × 40
4. **Company Size Fit (20 points):**
   - Match priorities.companySize against vendor.targetSegments array
   - Full match: 20 points
   - Partial match (e.g., user=mid-market, vendor=mid-market+enterprise): 15 points
   - No match: 0 points
5. **Geographic Coverage (20 points):**
   - Match priorities.jurisdictions against vendor.geographicCoverage array
   - All jurisdictions covered OR vendor.geographicCoverage includes "Global": 20 points
   - Some jurisdictions covered: (covered / total) × 20
   - No match: 0 points
6. **Price Appropriateness (20 points):**
   - Convert priorities.budgetRange and vendor.pricingRange to numeric ranges
   - If vendor price overlaps user budget: 20 points
   - If vendor price is ≤25% over budget: 10 points
   - If vendor price is >25% over budget: 0 points
7. Method returns: `{ vendorId, riskAreaCoverage, sizeFit, geoCoverage, priceScore, totalBase }`
8. Utility functions in `backend/src/matching/base-scorer.ts`
9. Unit tests cover all scoring scenarios including edge cases (no gaps, global coverage, budget mismatch)
10. Performance: Score 100 vendors in <1 second

#### Integration Verification

1. **IV1: Existing vendor data accessible** - Service fetches vendors using existing vendor.service.ts methods
2. **IV2: Vendor profile fields exist** - Verify vendor.categories, vendor.targetSegments, vendor.geographicCoverage, vendor.pricingRange fields exist in Prisma schema (add if missing)
3. **IV3: Gap data accessible** - Service fetches gaps using existing assessment.service.ts methods

---

### Story 1.8: Enhanced Vendor Matching Service - Priority Boost Algorithm

As a **backend developer**,
I want **to implement the priority boost component (0-40 points) of the vendor matching algorithm**,
so that **vendor scores reflect user-specific priorities, must-have features, and urgency**.

#### Acceptance Criteria

1. Extend `vendor-matching.service.ts` with boost calculations
2. Method `calculatePriorityBoost(vendor: Vendor, priorities: AssessmentPriorities, gaps: Gap[]): Promise<PriorityBoost>` implemented
3. **Top Priority Coverage (+20 max):**
   - Check if vendor.categories includes any of priorities.rankedPriorities
   - #1 priority: +20 points
   - #2 priority: +15 points
   - #3 priority: +10 points
   - Vendor receives boost for highest-ranked priority only (no stacking)
4. **Must-Have Features (+10 max):**
   - Match priorities.mustHaveFeatures against vendor.features array
   - All features present: +10 points
   - Missing 1-2 features: +5 points
   - Missing 3+ features: 0 points
5. **Deployment Match (+5):**
   - If vendor.deploymentOptions includes priorities.deploymentPreference: +5 points
   - If priorities.deploymentPreference = "Flexible": all vendors get +5 points
   - Otherwise: 0 points
6. **Speed to Deploy (+5):**
   - If priorities.implementationUrgency = "Immediate" AND vendor.implementationTimeline ≤ 90 days: +5 points
   - Otherwise: 0 points
7. Method returns: `{ vendorId, topPriorityBoost, featureBoost, deploymentBoost, speedBoost, totalBoost }`
8. Method `calculateTotalScore(baseScore: BaseScore, priorityBoost: PriorityBoost): VendorMatchScore` combines scores
9. Method `generateMatchReasons(vendor, baseScore, priorityBoost): string[]` creates human-readable reasoning:
   - Example: "Covers your #1 priority: Sanctions Screening"
   - Example: "Addresses 3 out of 4 identified gaps"
   - Example: "Has all must-have features: Real-time monitoring, AI/ML, Integration capabilities"
10. Unit tests verify boost calculations for all priority combinations
11. Integration test: Match 10 vendors against sample priorities, verify top vendor has highest score and clear reasoning

#### Integration Verification

1. **IV1: Base score integration** - Priority boost service uses base score results correctly
2. **IV2: Vendor feature data** - Verify vendor.features, vendor.deploymentOptions, vendor.implementationTimeline fields exist (add if missing)
3. **IV3: Match reason generation** - Generate reasons for 5 vendors, verify all scoring factors represented in reasons

---

### Story 1.9: Strategy Matrix Service - Timeline-Based Gap Organization

As a **backend developer**,
I want **to create a strategy matrix service that organizes gaps into timeline buckets with aggregated metrics**,
so that **users receive a phased remediation roadmap**.

#### Acceptance Criteria

1. New service file `strategy-matrix.service.ts` created
2. Method `generateStrategyMatrix(assessmentId: string): Promise<StrategyMatrix>` implemented
3. **Timeline Bucket Assignment:**
   - 0-6 months/Immediate: gaps with priority 8-10
   - 6-18 months/Near-term: gaps with priority 4-7
   - 18+ months/Strategic: gaps with priority 1-3
4. **Bucket Aggregation:**
   - Count gaps per bucket
   - Count effort distribution (small: X, medium: Y, large: Z)
   - Calculate cost range (sum individual gap costRanges, convert to human-readable total)
5. **Vendor Recommendations per Bucket:**
   - For each bucket, find vendors covering multiple gaps in that bucket
   - Rank by number of gaps covered
   - Return top 3 vendors per bucket with gap coverage details
6. Method returns:
   ```typescript
   {
     immediate: { gaps: Gap[], gapCount: number, effortDist: {S:x,M:y,L:z}, costRange: string, vendors: Vendor[] },
     nearTerm: { gaps: Gap[], gapCount: number, effortDist: {S:x,M:y,L:z}, costRange: string, vendors: Vendor[] },
     strategic: { gaps: Gap[], gapCount: number, effortDist: {S:x,M:y,L:z}, costRange: string, vendors: Vendor[] }
   }
   ```
7. Cache strategy matrix in Redis (key: `strategy_matrix:<assessmentId>`, TTL: 7 days)
8. Method invalidates cache when assessment updated or gaps modified
9. Unit tests verify bucket assignment logic, aggregation calculations, vendor ranking
10. Integration test: Generate matrix for assessment with 15 gaps across all priority levels, verify correct distribution

#### Integration Verification

1. **IV1: Gap data consistency** - Strategy matrix uses same gaps as displayed in gap dashboard
2. **IV2: Vendor data access** - Matrix recommends vendors from existing vendor database without duplicating matching logic
3. **IV3: Cache invalidation** - Update assessment gap, regenerate matrix, verify cache refreshed

---

### Story 1.10: Assessment API Enhancements - Priorities and Enhanced Results Endpoints

As a **backend developer**,
I want **to create new API endpoints for priorities questionnaire and enhanced assessment results**,
so that **the frontend can submit priorities and retrieve weighted scoring data**.

#### Acceptance Criteria

1. New routes in `assessment.routes.ts`:
   ```
   POST   /api/assessments/:id/priorities
   GET    /api/assessments/:id/priorities
   PUT    /api/assessments/:id/priorities
   ```
2. **POST /priorities endpoint:**
   - Validates assessmentId exists and belongs to authenticated user
   - Validates request body using PrioritiesSchema (Zod)
   - Calls priorities.service.submitPriorities()
   - Returns: 201 Created with priorities data
   - Error handling: 400 validation errors, 403 not authorized, 404 assessment not found
3. **GET /priorities endpoint:**
   - Validates assessmentId access
   - Calls priorities.service.getPriorities()
   - Returns: 200 OK with priorities data or 404 if not submitted
4. **PUT /priorities endpoint:**
   - Validates assessmentId access
   - Validates request body
   - Updates existing priorities
   - Returns: 200 OK with updated data
5. Enhance existing `GET /api/assessments/:id/results` endpoint:
   - Add `scoringMethodology: "complete" | "unavailable"` field
   - If enhanced: include `evidenceTierDistribution: { tier0: X, tier1: Y, tier2: Z }`
   - If enhanced: include `weightedSectionScores: [{ sectionId, score, weight, contribution }]`
   - If enhanced: include detailed `scoringBreakdown` with question-level data
   - If unavailable: return response without scoring fields, include unavailableReason message
6. Swagger documentation updated for all new/modified endpoints
7. Contract tests validate request/response schemas
8. Rate limiting: max 10 requests/minute per user for priorities endpoints

#### Integration Verification

1. **IV1: Existing results endpoint backward compatible** - Request results for pre-implementation assessment, verify response includes scoringMethodology: "unavailable"
2. **IV2: Authentication middleware works** - Unauthenticated request to priorities endpoints returns 401
3. **IV3: Assessment ownership check** - User A attempts to access User B's assessment priorities, verify 403 response

---

### Story 1.11: Vendor API Enhancements - Enhanced Matching and Strategy Matrix Endpoints

As a **backend developer**,
I want **to create new API endpoints for enhanced vendor matching and strategy matrix retrieval**,
so that **the frontend can display improved vendor recommendations and phased remediation roadmap**.

#### Acceptance Criteria

1. New routes in `vendor.routes.ts`:
   ```
   GET    /api/assessments/:id/vendor-matches-v2
   GET    /api/assessments/:id/strategy-matrix
   ```
2. **GET /vendor-matches-v2 endpoint:**
   - Validates assessmentId exists and user has access
   - Requires priorities submitted (return 400 if missing)
   - Fetches assessment, priorities, gaps
   - Calls vendor-matching.service for all vendors in database
   - Filters vendors with totalScore ≥ 80 (configurable threshold)
   - Sorts by totalScore descending
   - Returns: `{ vendors: [{ vendor, baseScore, priorityBoost, totalScore, matchReasons }], count }`
   - Cache results in Redis (key: `vendor_matches:v2:<priorities_hash>`, TTL: 24 hours)
3. **GET /strategy-matrix endpoint:**
   - Validates assessmentId access
   - Calls strategy-matrix.service.generateStrategyMatrix()
   - Returns: `{ immediate: {...}, nearTerm: {...}, strategic: {...} }`
   - Cache results (handled by service layer)
4. Swagger documentation for both endpoints
5. Contract tests validate response schemas
6. Performance: vendor-matches-v2 responds <2 seconds for 100 vendors
7. Error handling: 400 priorities missing, 403 unauthorized, 404 assessment not found, 500 matching algorithm errors

#### Integration Verification

1. **IV1: Basic vendor matching still works** - Existing `/api/assessments/:id/vendor-matches` endpoint continues to function for assessments without priorities
2. **IV2: Vendor database queries** - Both endpoints fetch vendor data using existing vendor.service.ts methods
3. **IV3: Frontend conditional rendering** - Frontend checks for `priorities` existence before calling vendor-matches-v2, falls back to v1 if missing

---

### Story 1.12: Evidence Tier UI Components - Badge, Explanation, Distribution Chart

As a **frontend developer**,
I want **to create reusable React components for displaying evidence tiers**,
so that **users can see document quality classifications throughout the assessment journey**.

#### Acceptance Criteria

1. **Component: EvidenceTierBadge.tsx**
   - Props: `tier: EvidenceTier`, `confidence?: number`, `size?: "sm" | "md" | "lg"`
   - Displays color-coded badge: Tier 0 (gray), Tier 1 (blue), Tier 2 (green)
   - Shows tier label: "Self-Declared", "Policy Documents", "System-Generated"
   - Optionally shows confidence score as percentage: "85% confidence"
   - Uses existing Badge component from Radix UI
2. **Component: EvidenceTierExplanation.tsx**
   - Props: `documentId: string`, `tier: EvidenceTier`, `reason: string`, `confidence: number`
   - Expandable panel showing classification reasoning
   - Icon indicating tier quality (⚠️ low, ℹ️ medium, ✅ high)
   - Formatted explanation text with bullet points
   - "Why this matters" section explaining tier impact on scoring
3. **Component: EvidenceTierDistribution.tsx**
   - Props: `distribution: { tier0: number, tier1: number, tier2: number }`
   - Donut chart using Recharts showing percentage breakdown
   - Legend with counts: "Tier 2: 5 documents (25%)"
   - Responsive sizing (200px on mobile, 300px on desktop)
   - Hover tooltips showing document count and percentage
4. All components use TypeScript with strict typing
5. All components styled with TailwindCSS utilities
6. Unit tests using React Testing Library (render, props validation, conditional rendering)
7. Storybook stories demonstrating all component variants

#### Integration Verification

1. **IV1: Existing UI component library** - Components use Radix UI primitives (Badge, Tooltip, etc.) from existing library
2. **IV2: Existing color palette** - Tier colors match established theme (gray-500, blue-500, green-500)
3. **IV3: Responsive design** - Components render correctly on mobile, tablet, desktop breakpoints

---

### Story 1.13: Document Upload Enhancement - Real-Time Evidence Classification

As a **frontend developer**,
I want **to enhance the document upload screen to show real-time evidence tier classification as documents are processed**,
so that **users receive immediate feedback on document quality**.

#### Acceptance Criteria

1. **Modified Component: DocumentUpload.tsx** (existing component enhanced)
2. After document upload completes:
   - Show loading spinner with "Analyzing document quality..." message
   - Poll backend for classification status (every 2 seconds, max 30 seconds)
   - Display EvidenceTierBadge when classification completes
   - Show EvidenceTierExplanation in expandable panel
3. Document card UI updates:
   - Before classification: filename, size, upload timestamp
   - After classification: + EvidenceTierBadge, + "View Classification" button
   - Click "View Classification": expand EvidenceTierExplanation panel inline
4. Handle classification failures gracefully:
   - If classification times out (>30 seconds): show "Classification in progress, check back shortly"
   - If classification fails: show "Unable to classify, defaulting to Self-Declared" with Tier 0 badge
5. Batch upload: classify documents in parallel, show progress counter "Classifying 3 of 5 documents..."
6. Use TanStack Query for polling and cache management
7. Optimistic UI: immediately show document in list, update with classification when ready
8. Accessibility: announce classification completion to screen readers

#### Integration Verification

1. **IV1: Existing upload flow** - Document uploads to Replit object storage using existing objectStorage flow
2. **IV2: Existing document parser** - Classification happens after parser extracts content, doesn't interfere with parsedContent field
3. **IV3: Assessment journey** - After uploading documents with classifications, proceeding to questions works without errors

---

### Story 1.14: Personal Priorities Questionnaire - Multi-Step Form UI

As a **frontend developer**,
I want **to create the 6-step priorities questionnaire as a multi-page form with progress tracking**,
so that **users can input their organizational context and preferences for vendor matching**.

#### Acceptance Criteria

1. **Component: PrioritiesQuestionnaire.tsx** - Main wizard component
   - Multi-step form with 6 pages + review step (7 total)
   - Progress indicator at top showing current step (e.g., "Step 3 of 7")
   - "Back" and "Next" navigation buttons
   - Form state managed with React Hook Form + Zod validation
   - Validates each step before allowing "Next"
2. **Step 1 Component: OrganizationalContext.tsx**
   - Company size dropdown (4 options)
   - Annual revenue dropdown (revenue bands)
   - Compliance team size dropdown (4 options)
   - Jurisdictions multi-select checkboxes (8 options: FinCEN, FCA, MAS, etc.)
   - Existing systems multi-select checkboxes (common systems list)
3. **Step 2 Component: GoalsTimeline.tsx**
   - Primary goal radio buttons (6 options in card layout)
   - Implementation urgency slider (4 positions: Immediate, Planned, Strategic, Long-term)
4. **Step 3 Component: UseCasePrioritization.tsx**
   - Checkbox grid of compliance areas (populated from assessment sections)
   - Drag-and-drop ranking interface for top 3 priorities
   - Uses react-beautiful-dnd or @dnd-kit for drag functionality
   - Validation: must select at least 3 use cases, must rank exactly 3
5. **Step 4 Component: SolutionRequirements.tsx**
   - Budget range dropdown (5 options)
   - Deployment preference radio buttons (4 options)
   - Must-have features multi-select (limit 5 selections with counter)
   - Critical integrations checklist (based on Step 1 existing systems)
6. **Step 5 Component: VendorPreferences.tsx**
   - Vendor maturity radio buttons (3 options with descriptions)
   - Geographic requirements radio buttons (4 options)
   - Support model radio buttons (3 options)
7. **Step 6 Component: DecisionFactorRanking.tsx**
   - Drag-to-reorder list of 6 decision factors
   - Visual indicators (drag handles, hover states)
   - Instructions: "Drag factors to rank by importance (most important at top)"
8. **Step 7 Component: PrioritiesReview.tsx**
   - Summary of all selections (read-only)
   - Edit buttons per section to jump back to that step
   - Submit button calls API POST /assessments/:id/priorities
   - Loading state during submission
   - Success: redirect to vendor matches view
   - Error handling: display validation errors inline
9. Responsive design: questionnaire usable on tablet (≥768px), optimized for desktop
10. Auto-save draft to localStorage every step (restore on browser refresh)
11. Framer Motion animations for step transitions (slide left/right)

#### Integration Verification

1. **IV1: Assessment journey flow** - Questionnaire triggered after assessment completion (status = COMPLETED)
2. **IV2: API integration** - Form submission calls correct endpoint with properly formatted data
3. **IV3: Navigation** - After questionnaire completion, user navigates to results view with vendor matches enabled

---

### Story 1.15: Enhanced Assessment Results Dashboard - Overview and Scoring Breakdown

As a **frontend developer**,
I want **to create an enhanced assessment results dashboard with overall score, evidence distribution, and section breakdowns**,
so that **users can understand their risk score and underlying calculations**.

#### Acceptance Criteria

1. **Component: EnhancedResultsDashboard.tsx** - Main results view
   - Conditional rendering: check `scoringMethodology` field
   - If "unavailable": render message "Risk Score Not Available"
   - If "enhanced": render new enhanced view
2. **Section: Overview**
   - Large risk score display (0-100) with color-coded band:
     - Critical (0-39): red background
     - High (40-59): orange background
     - Medium (60-79): yellow background
     - Low (80-100): green background
   - Risk band label prominently displayed
   - Methodology badge: "Regulatory-Aligned Scoring"
   - EvidenceTierDistribution donut chart
   - Assessment quality indicator: "Strong evidence base" (>50% Tier 1+2) or "Limited documentation" (<30% Tier 1+2)
3. **Component: ScoringBreakdown.tsx** - Expandable section breakdown
   - Accordion component showing all sections
   - Each section card displays:
     - Section title
     - Section score (0-5 scale with progress bar)
     - Section weight (e.g., "18% of overall score")
     - Contribution to overall score (weighted contribution)
   - Click to expand: shows all questions in section
4. **Component: QuestionDetailView.tsx** - Question-level drill-down
   - Appears when section expanded
   - Each question shows:
     - Question text
     - Raw quality score (0-5 stars visualization)
     - Evidence tier badge
     - Tier multiplier (e.g., "×0.8 Policy Document")
     - Question weight within section
     - Final score after multiplier (0-5 with progress bar)
   - Supporting evidence citations (linked to uploaded documents)
   - "Why this score?" button opens explanation modal
5. Tabbed interface:
   - Tab 1: "Overview" (overall score + section breakdown)
   - Tab 2: "Gaps" (gap analysis table - existing, enhanced)
   - Tab 3: "Strategy Matrix" (timeline view - separate story)
   - Tab 4: "Vendor Matches" (vendor recommendations - separate story)
6. "How is this calculated?" button opens methodology explanation page
7. "Download Report" button triggers PDF generation (existing functionality, enhanced template)
8. Responsive: sections stack vertically on mobile, two-column on desktop
9. Loading states: skeleton UI while fetching results
10. Error handling: display friendly message if scoring data incomplete

#### Integration Verification

1. **IV1: Pre-implementation assessment display** - Navigate to pre-implementation assessment results, verify "score unavailable" message displays correctly
2. **IV2: Data fetching** - Uses existing API endpoint /assessments/:id/results with enhanced fields
3. **IV3: Navigation** - Header breadcrumbs and assessment journey navigation work correctly with enhanced results

---

### Story 1.16: Strategy Matrix Timeline View - Phased Remediation Roadmap

As a **frontend developer**,
I want **to create a visual strategy matrix showing gaps organized into timeline buckets**,
so that **users can see a phased remediation roadmap with effort, cost, and vendor recommendations**.

#### Acceptance Criteria

1. **Component: StrategyMatrixTimeline.tsx** - Main timeline view
   - Three-column layout (desktop) or vertical stack (mobile/tablet)
   - Fetches data from GET /assessments/:id/strategy-matrix
2. **Component: TimelineBucket.tsx** - Single timeline bucket
   - Props: `bucket: { gaps, gapCount, effortDist, costRange, vendors }`, `title: string`, `timeframe: string`
   - Header: "0-6 Months: Immediate" with timeframe badge
   - Metrics summary card:
     - Gap count: "5 gaps identified"
     - Effort distribution: "2 small, 2 medium, 1 large"
     - Cost range: "Total estimated cost: $100K-$250K"
   - Gap list: scrollable container with GapCard components
   - Vendors section: "Recommended Vendors" with top 3 vendor cards
3. **Component: GapCard.tsx** - Individual gap card
   - Gap title
   - Severity badge (Critical/High/Medium/Low with color coding)
   - Priority score (1-10 with visual indicator)
   - Effort badge (S/M/L)
   - Cost estimate
   - "View Details" button (expands inline or opens modal with full gap description)
4. Visual design:
   - Color-coded severity: Critical (red), High (orange), Medium (yellow), Low (blue)
   - Timeline buckets have distinct background colors (light red, light yellow, light green for immediate/near-term/strategic)
   - Visual connectors: dotted lines between gaps and recommended vendors showing relationship
5. Vendor cards in bucket show:
   - Vendor name and logo
   - "Addresses X gaps in this timeframe" label
   - Gap coverage list (which specific gaps)
   - "View Vendor Details" button
6. "Export Timeline" button generates PDF of strategy matrix
7. Responsive design:
   - Desktop (≥1024px): three columns side-by-side
   - Tablet (768-1023px): two columns (immediate + near-term, strategic below)
   - Mobile (<768px): vertical stack, one bucket per section
8. Empty states: "No gaps identified in this timeframe" with checkmark icon

#### Integration Verification

1. **IV1: Data consistency** - Gaps shown in strategy matrix match gaps in Gap Analysis tab
2. **IV2: Vendor links** - Clicking "View Vendor Details" navigates to vendor profile or opens vendor comparison
3. **IV3: Gap details** - Clicking "View Details" on gap shows same information as Gap Analysis tab

---

### Story 1.17: Enhanced Vendor Matching - Match Scores and Reasoning Display

As a **frontend developer**,
I want **to display vendor match scores with detailed reasoning and support vendor comparison**,
so that **users understand why vendors are recommended and can make informed selection decisions**.

#### Acceptance Criteria

1. **Component: EnhancedVendorCard.tsx** - Vendor card with match score
   - Props: `vendor: Vendor`, `matchData: { baseScore, priorityBoost, totalScore, matchReasons }`
   - Vendor logo, name, short description
   - Large match score display: "135/140 points" with progress bar
   - Match score visualization: stacked bar showing base (green) + boost (blue) components
   - "Highly Relevant" / "Good Match" / "Fair Match" label based on score (>120 / 100-120 / 80-100)
2. **Component: VendorMatchReasons.tsx** - Match reasoning badges
   - Displays each reason as a badge with icon:
     - "Covers your #1 priority: Sanctions Screening" with ⭐ icon
     - "Addresses 4 out of 4 identified gaps" with ✓ icon
     - "Has all must-have features" with ✓ icon
     - "Cloud deployment (your preference)" with ☁️ icon
   - Expandable "See scoring breakdown" section showing point allocation:
     - Base Score: 100 points (Risk Area: 40, Size Fit: 20, Geography: 20, Price: 20)
     - Priority Boost: 35 points (Top Priority: 20, Features: 10, Deployment: 5)
3. **Component: VendorComparisonView.tsx** - Side-by-side comparison
   - Select up to 3 vendors using checkbox on vendor cards
   - "Compare" button (disabled until 2+ vendors selected)
   - Comparison table with rows:
     - Match score (bar chart)
     - Gap coverage (checklist of gaps, ✓ if covered)
     - Must-have features (checklist, ✓ if present)
     - Deployment options (badges)
     - Pricing range (formatted currency)
     - Implementation timeline (days)
     - Company size fit (match indicator)
     - Geographic coverage (list of jurisdictions)
   - Highlight cells in green for "best in category" (highest score, most gaps covered, etc.)
   - "Contact Vendor" button per column
4. Vendor list sorting:
   - Default: sorted by totalScore descending (highest match first)
   - User can toggle sort: "Best Match" / "Best Price" / "Fastest Implementation"
5. Vendor list filtering:
   - Filter by priority coverage: "Show only vendors covering my #1 priority"
   - Filter by score threshold: slider (min score: 80-140)
6. Empty state: "No vendors match your criteria. Try adjusting your priorities or budget range."
7. Loading states: skeleton vendor cards while fetching matches
8. Responsive: vendor cards in grid (3 columns desktop, 2 tablet, 1 mobile)

#### Integration Verification

1. **IV1: Vendor data** - Vendor cards display correct vendor profile information from existing vendor database
2. **IV2: Gap coverage accuracy** - Gap coverage checklist matches gaps identified in Gap Analysis tab
3. **IV3: Contact vendor flow** - "Contact Vendor" button integrates with existing vendor contact form/modal

---

### Story 1.18: Admin Weight Management Interface

As a **frontend developer**,
I want **to create an admin interface for reviewing and adjusting assessment template question/section weights**,
so that **admins can maintain and update the regulatory-aligned weighting methodology**.

#### Acceptance Criteria

1. **Component: AdminWeightManagement.tsx** - Main admin page
   - Route: `/admin/templates/weights`
   - Template selection dropdown (lists all assessment templates)
   - Loads selected template's sections and questions with current weights
2. **Component: SectionWeightEditor.tsx**
   - List of all sections with current weights
   - Each section row:
     - Section name
     - Current weight (0-1 decimal, displayed as percentage)
     - Editable slider (0-100% with 1% increments)
     - Regulatory priority reference (text field, e.g., "FFIEC BSA/AML Pillar 1")
   - Live validation: sum of all section weights must equal 100%
   - Warning indicator if sum ≠ 100%
3. **Component: QuestionWeightEditor.tsx**
   - Expandable per section
   - Each question row:
     - Question text (truncated, hover for full)
     - Current weight within section
     - Editable slider (0-100% with 1% increments)
     - "Foundational" checkbox (marks question as critical)
   - Live validation: sum of question weights per section must equal 100%
   - Color coding: foundational questions highlighted in yellow
4. Save functionality:
   - "Save Changes" button (disabled until valid + changes made)
   - On click: opens "Change Rationale" modal
   - Modal requires:
     - Rationale text area (mandatory, min 50 characters)
     - Change summary auto-generated: "Modified 3 section weights, 5 question weights"
   - Submit calls PUT /admin/templates/:id/weights
   - Success: show toast "Weights updated successfully", refresh template
   - Error: show inline errors
5. Audit trail panel:
   - "Weight Change History" expandable section
   - Table showing: Date, Admin User, Changes Summary, Rationale, View Details
   - "View Details" opens modal with before/after weight values
6. "Reset to Defaults" button:
   - Confirmation dialog: "This will reset all weights to regulatory framework defaults. Proceed?"
   - Resets weights to framework-aligned values (from config file)
7. "Preview Impact" button:
   - Calculates how weight changes would affect existing completed assessments
   - Shows: "12 assessments would see score changes: +5 avg, -2 min, +12 max"
   - Helps admins understand impact before committing changes
8. Responsive: admin interface desktop-only (≥1024px), mobile shows "Use desktop browser" message
9. Authorization: only users with ADMIN role can access

#### Integration Verification

1. **IV1: Admin route protection** - Non-admin users attempting to access /admin/templates/weights see 403 error
2. **IV2: Template data** - Weight editor loads template structure from existing template.service.ts
3. **IV3: Weight updates applied** - After saving weight changes, new assessments use updated weights in scoring calculations

---

### Story 1.19: Admin Evidence Classification Review Interface

As a **frontend developer**,
I want **to create an admin interface for reviewing and overriding low-confidence evidence tier classifications**,
so that **admins can ensure classification accuracy and handle edge cases**.

#### Acceptance Criteria

1. **Component: AdminEvidenceClassificationReview.tsx** - Main review page
   - Route: `/admin/evidence-classification/review`
   - Fetches documents with `tierConfidenceScore < 0.7` from GET /admin/evidence-classification/review
   - Displays filterable list of documents needing review
2. **Component: ClassificationReviewCard.tsx** - Individual document review
   - Document information:
     - Filename
     - Uploaded by (user email, organization)
     - Upload date
     - File type and size
   - Current classification:
     - EvidenceTierBadge with confidence score
     - Classification reasoning (expandable text)
   - Document preview panel (if supported file type: PDF, images, text)
   - Override controls:
     - "Approve Classification" button (accepts AI classification, removes from review queue)
     - "Override Tier" dropdown (Tier 0/1/2)
     - Mandatory justification text area (appears when override selected, min 30 characters)
     - "Submit Override" button
3. Bulk operations:
   - Checkbox selection for multiple documents
   - "Approve All Selected" button (batch approval)
   - "Flag for User Review" button (notifies user to upload better evidence)
4. Filters:
   - Confidence range slider (0-0.7, show documents below threshold)
   - Tier filter: "Show only Tier X classifications"
   - Date range: "Uploaded in last X days"
5. Sorting:
   - Default: lowest confidence first
   - Options: "Newest First", "Oldest First", "Alphabetical"
6. Override submission:
   - POST /documents/:id/reclassify with new tier + justification
   - Success: remove from review list, show toast
   - Error: show inline error message
7. Audit trail per document:
   - "View Classification History" button
   - Modal showing: Original classification, overrides (if any), admin user, timestamps
8. Pagination: 20 documents per page with page controls
9. Empty state: "No documents need review" with checkmark icon

#### Integration Verification

1. **IV1: Document access** - Preview panel loads documents from Replit object storage using existing objectStorage
2. **IV2: Classification update** - After override, re-fetching assessment results shows updated tier for document
3. **IV3: Audit logging** - Override events logged in audit trail accessible via existing admin audit log view

---

### Story 1.20: Methodology Explanation Page

As a **frontend developer**,
I want **to create an educational methodology explanation page**,
so that **users understand the evidence tier system, weighted scoring, and regulatory alignment**.

#### Acceptance Criteria

1. **Component: MethodologyExplanation.tsx** - Standalone page
   - Route: `/methodology` (public, accessible without login)
   - Also accessible via "How is this calculated?" button in assessment results
2. **Section: Introduction**
   - Heading: "Understanding Your Risk Score"
   - 2-3 paragraphs explaining the enhanced methodology's purpose
   - Key differentiators: evidence-weighted, regulatory-aligned, transparent
3. **Section: Evidence Tier System**
   - Visual diagram showing 3 tiers with examples:
     - Tier 2 (×1.0): System logs, API responses, database exports
     - Tier 1 (×0.8): Policy documents, procedures, approved workflows
     - Tier 0 (×0.6): Self-declared statements, emails, informal docs
   - "Why this matters" explanation: distinguishes proof vs promises
4. **Section: Two-Level Weighted Scoring**
   - Visual diagram showing:
     - Question weights within sections (foundational questions highlighted)
     - Section weights in overall score (size proportional to weight)
   - Example calculation with sample data:
     - Section: Sanctions Compliance (18% weight)
     - Q1 (20% weight): Score 3.0 × 0.8 (Tier 1) = 2.4 → Contribution: 0.48
     - ... (show 3-4 questions)
     - Section score: 3.04/5 → Overall contribution: 3.04 × 18% = 0.547
   - Interactive calculator: user can input sample scores and see calculation
5. **Section: Regulatory Framework Alignment**
   - References to FFIEC BSA/AML, FATF 40 Recommendations
   - Explanation of how section weights derived from enforcement priorities
   - "This methodology aligns with regulatory expectations" statement
6. **Section: FAQ**
   - Q: "Why don't my old assessments have risk scores?"
     - A: Risk scoring was implemented on [date]. Assessments completed before this date don't have scores. Re-run your assessment to receive a risk score.
   - Q: "How can I improve my score?"
     - A: Upload Tier 2 evidence (system-generated data), address high-priority gaps first
   - Q: "Can I customize the weights?"
     - A: Admin users can adjust weights, but defaults are framework-aligned (not recommended for most users)
   - 5-7 common questions with clear answers
7. **Section: Worked Example**
   - Full end-to-end example with fictional company
   - Shows: documents uploaded → tiers assigned → questions scored → sections weighted → overall score calculated
   - Step-by-step breakdown with visual aids
8. Footer: "Questions? Contact support" with link
9. Responsive design: readable on all devices
10. Printable: clean print stylesheet for PDF export

#### Integration Verification

1. **IV1: Public access** - Unauthenticated users can view methodology page
2. **IV2: Contextual linking** - Clicking "How is this calculated?" from assessment results navigates to methodology page with #anchor to relevant section
3. **IV3: Content accuracy** - Methodology explanation matches actual scoring algorithm implementation

---

### Story 1.21: Enhanced PDF Report Template

As a **backend developer**,
I want **to update the PDF report template to include evidence tier breakdown, weighted scoring visualization, and strategy matrix**,
so that **users receive comprehensive reports suitable for auditor presentation**.

#### Acceptance Criteria

1. Extend `report-generator.service.ts` to generate enhanced reports
2. New report sections (added to existing template):
   **Section: Methodology Overview (New, page 2)**
   - Brief explanation of evidence-weighted, regulatory-aligned scoring
   - Reference to FFIEC/FATF frameworks
   - Statement: "This assessment uses a defensible methodology suitable for regulatory presentation"

   **Section: Evidence Quality Summary (New, page 3)**
   - Evidence tier distribution table:
     - Tier 2 (System-Generated): X documents (Y%)
     - Tier 1 (Policy Documents): X documents (Y%)
     - Tier 0 (Self-Declared): X documents (Y%)
   - Donut chart visualization (embedded PNG)
   - Document list by tier (truncated, top 5 per tier with classifications)

   **Section: Overall Risk Score (Enhanced, page 4)**
   - Large risk score display with band (Critical/High/Medium/Low)
   - Risk band definition and implications
   - Comparison to industry benchmarks (if available in future)

   **Section: Section-by-Section Breakdown (Enhanced, page 5-10)**
   - Each section on separate page or half-page block
   - Section score, weight, contribution to overall
   - Bar chart showing question scores within section
   - Top 3 lowest-scoring questions highlighted

   **Section: Gap Analysis (Enhanced, page 11-15)**
   - Gap summary table: Gap Title, Severity, Priority, Effort, Cost Estimate
   - Sorted by priority descending
   - Color-coded severity indicators
   - Remediation recommendations per gap

   **Section: Strategy Matrix Timeline (New, page 16-17)**
   - Three-column visual showing timeline buckets
   - Gaps organized by timeframe with effort/cost aggregations
   - Recommended vendors per bucket (top 2-3)
   - Visual roadmap gantt-chart style

   **Section: Vendor Recommendations (Enhanced, page 18-20)**
   - Top 10 vendor matches with scores
   - Match reasoning per vendor
   - Gap coverage matrix
   - Vendor comparison table (top 3 vendors side-by-side)

   **Section: Appendices (New, page 21+)**
   - Appendix A: Regulatory Framework References
   - Appendix B: Question Weights and Rationale
   - Appendix C: Evidence Tier Classification Details

3. Report styling:
   - Professional letterhead with Heliolus logo
   - Page numbers and date in footer
   - Table of contents with page links
   - Color coding consistent with UI (red/orange/yellow/green for risk bands)
4. PDF metadata:
   - Title: "Enhanced Risk Assessment Report - [Organization Name]"
   - Author: "Heliolus Platform"
   - Creation date: [Assessment completion date]
5. Report generation performance: <10 seconds for 20+ page report
6. Report stored in Replit object storage with existing report.service.ts pattern
7. Report accessible via existing GET /api/reports/:id endpoint (full report with scoring if assessment.scoringMethodology = "complete")

#### Integration Verification

1. **IV1: Pre-implementation report compatibility** - Generating report for pre-implementation assessment includes note that risk scoring was not available
2. **IV2: Object storage** - Enhanced reports stored in Replit object storage using existing objectStorage wrapper
3. **IV3: Report download** - "Download Report" button in frontend downloads enhanced PDF correctly

---

### Story 1.22: Feature Flag Implementation and Rollout Strategy

As a **backend developer**,
I want **to implement feature flags controlling enhanced assessment features and configure gradual rollout**,
so that **we can safely deploy to production and enable features progressively for testing**.

#### Acceptance Criteria

1. **Environment Variable Feature Flag:**
   - Add `ENHANCED_SCORING_ENABLED` env var (values: "true" | "false" | "percentage:X")
   - Default: "false" (enhanced features disabled)
   - "percentage:X" mode: enable for X% of users (hashed by userId for consistency)
2. **Database-Level Override:**
   - Add `featureFlags` JSON field to Organization model (nullable)
   - Example: `{ "enhancedScoring": true }` overrides env var for specific organization
   - Admin can enable/disable per organization via admin panel
3. **Feature Flag Service:**
   - New utility file `backend/src/lib/feature-flags.ts`
   - Method `isEnhancedScoringEnabled(userId: string, organizationId?: string): boolean`
   - Logic:
     1. Check organization.featureFlags if organizationId provided (highest priority)
     2. Check env var ENHANCED_SCORING_ENABLED
     3. If "percentage:X": hash userId, return true if hash % 100 < X
     4. Default: false
4. **Assessment Creation Flag:**
   - When creating assessment, set `scoringMethodology: "complete" | "unavailable"` based on feature flag (if flag enabled: "complete", if disabled: "unavailable")
   - Store methodology on Assessment model (new field: `scoringMethodology: String`)
   - Methodology determines which scoring path to use throughout assessment lifecycle
5. **API Conditional Logic:**
   - Assessment completion: if methodology="complete", run evidence classification and weighted scoring
   - Assessment results endpoint: return scoring fields if methodology="complete"
   - Priorities endpoint: only available if methodology="complete" (return 400 if unavailable)
   - Vendor matches v2 endpoint: only available if methodology="complete"
6. **Frontend Feature Detection:**
   - Check assessment.scoringMethodology field
   - Conditionally render enhanced UI components
   - Show "not available" message if methodology="unavailable"
7. **Rollout Configuration File:**
   - Create `backend/config/rollout-schedule.json`:
     ```json
     {
       "phase1_internal": { "percentage": 0, "organizations": ["org_internal_test"] },
       "phase2_beta": { "percentage": 0, "organizations": ["org_beta_1", "org_beta_2", ...] },
       "phase3_gradual": { "percentage": 10 },
       "phase4_majority": { "percentage": 50 },
       "phase5_full": { "percentage": 100 }
     }
     ```
8. **Monitoring Dashboard:**
   - Admin page showing:
     - Current rollout phase
     - % of assessments with scoring implementation complete
     - Error rates for scoring implementation
     - User feedback scores per methodology
   - Metrics from application logs and database queries
9. **Rollback Procedure:**
   - Script to set ENHANCED_SCORING_ENABLED=false instantly (emergency rollback)
   - Database migration to mark all in-progress assessments with feature flag disabled as scoringMethodology="unavailable"
   - Communication template for affected users

#### Integration Verification

1. **IV1: Feature flag disabled** - With ENHANCED_SCORING_ENABLED=false, all new assessments marked as scoringMethodology="unavailable"
2. **IV2: Feature flag enabled** - With ENHANCED_SCORING_ENABLED=true, all new assessments marked as scoringMethodology="complete" and scoring functions execute
3. **IV3: Percentage rollout** - With ENHANCED_SCORING_ENABLED=percentage:50, approximately 50% of new assessments receive scoring (verify with 100 test users)
4. **IV4: Organization override** - Set organization.featureFlags.enhancedScoring=true, verify that organization's assessments receive scoring regardless of global flag
5. **IV5: Mixed scoring availability** - User with both pre-implementation and scored assessments can view both result types correctly

---

### Story 1.23: Integration Testing - End-to-End Enhanced Assessment Flow

As a **QA engineer**,
I want **to create comprehensive integration tests for the full enhanced assessment workflow**,
so that **we verify all components work together correctly from assessment creation to vendor matching**.

#### Acceptance Criteria

1. **Test Suite: Enhanced Assessment E2E** (`backend/tests/integration/enhanced-assessment-e2e.spec.ts`)
2. **Test Case 1: Assessment Creation with Enhanced Methodology**
   - Create user, organization, assessment template with weights
   - Create assessment with feature flag enabled
   - Verify: assessment.scoringMethodology = "complete"
3. **Test Case 2: Document Upload and Evidence Classification**
   - Upload 3 documents (system log, policy PDF, email text)
   - Trigger classification
   - Verify: documents assigned correct tiers (Tier 2, Tier 1, Tier 0)
   - Verify: classification reasons stored
   - Verify: confidence scores present
4. **Test Case 3: Assessment Execution with Weighted Scoring**
   - Generate answers for assessment questions (simulate AI responses)
   - Set rawQualityScore values on answers
   - Complete assessment
   - Verify: weighted scoring service calculates finalScore with tier multipliers
   - Verify: section scores calculated correctly
   - Verify: overall score calculated correctly (0-100 scale)
   - Verify: risk band assigned (Critical/High/Medium/Low)
5. **Test Case 4: Gap Identification and Prioritization**
   - Verify: questions with finalScore <3.0 flagged as gaps
   - Verify: gaps assigned severity, priority, effort, costRange
   - Verify: priority ranking correct (high priority for foundational questions in high-weight sections)
6. **Test Case 5: Priorities Questionnaire Submission**
   - Submit priorities via POST /assessments/:id/priorities
   - Verify: AssessmentPriorities record created
   - Verify: data validation (rankedPriorities subset of selectedUseCases)
   - Retrieve priorities via GET /assessments/:id/priorities
   - Verify: data matches submission
7. **Test Case 6: Enhanced Vendor Matching**
   - Seed vendor database with 10 test vendors (varied profiles)
   - Request vendor matches via GET /assessments/:id/vendor-matches-v2
   - Verify: vendors scored with base + boost
   - Verify: match reasons generated
   - Verify: vendors sorted by totalScore descending
   - Verify: only vendors with score ≥80 returned
8. **Test Case 7: Strategy Matrix Generation**
   - Request strategy matrix via GET /assessments/:id/strategy-matrix
   - Verify: gaps organized into 3 timeline buckets (immediate/near-term/strategic)
   - Verify: bucket aggregations correct (gap count, effort distribution, cost range)
   - Verify: vendor recommendations per bucket (vendors covering multiple gaps)
9. **Test Case 8: Enhanced Results Retrieval**
   - Request results via GET /assessments/:id/results
   - Verify: scoringMethodology = "enhanced"
   - Verify: evidenceTierDistribution present
   - Verify: weightedSectionScores array populated
   - Verify: scoringBreakdown includes question-level detail
10. **Test Case 9: Enhanced PDF Report Generation**
    - Generate report for enhanced assessment
    - Verify: report includes evidence tier section, strategy matrix, weighted scoring visualization
    - Verify: report stored in Replit object storage
    - Verify: report downloadable
11. **Test Case 10: Backward Compatibility - Pre-Implementation Assessment**
    - Create assessment with feature flag disabled (scoring unavailable)
    - Complete assessment
    - Verify: no scoring calculations executed
    - Verify: priorities endpoint returns 400 (not available without scoring)
    - Verify: results endpoint returns scoringMethodology = "unavailable"
    - Verify: "Risk Score Not Available" message displays correctly
12. All tests use real database (test database, reset between tests)
13. Tests use test OpenAI API key (or mocked responses to avoid costs)
14. Tests run in CI pipeline (GitHub Actions)
15. Total test suite execution time <5 minutes

#### Integration Verification

1. **IV1: Database transactions** - All test cases properly clean up data (no test pollution)
2. **IV2: API authentication** - Tests use valid JWT tokens for protected endpoints
3. **IV3: Feature flag control** - Tests toggle feature flags via environment variable or test utilities

---

### Story 1.24: Performance Optimization and Caching Strategy

As a **backend developer**,
I want **to implement aggressive caching and query optimization for enhanced assessment features**,
so that **the system maintains sub-3-second response times despite increased computational complexity**.

#### Acceptance Criteria

1. **Redis Caching for Evidence Classification:**
   - Cache key pattern: `evidence_classification:<document_id>`
   - TTL: 30 days
   - Cache stores: `{ tier, confidence, reason, classifiedAt }`
   - Before classifying document, check cache
   - After classification, store in cache
   - Cache invalidation: when document deleted or admin overrides tier
2. **Redis Caching for Vendor Matches:**
   - Cache key pattern: `vendor_matches:v2:<priorities_hash>`
   - Priorities hash: SHA-256 of AssessmentPriorities data (consistent hashing for same priorities)
   - TTL: 24 hours
   - Cache stores: full vendor match results array with scores and reasoning
   - Cache invalidation: when vendor database updated (manual admin trigger)
3. **Redis Caching for Strategy Matrix:**
   - Cache key pattern: `strategy_matrix:<assessment_id>`
   - TTL: 7 days
   - Cache stores: full matrix with gaps organized by bucket
   - Cache invalidation: when assessment updated or gaps modified
4. **Memoization for Weighted Score Calculations:**
   - Use in-memory memoization for repeated score calculations during same request
   - Cache question scores, section scores during overall score calculation
   - Reset memoization cache per request (don't leak across requests)
5. **Database Query Optimization:**
   - Add database indexes:
     - `assessments (scoringMethodology)` - filter by methodology
     - `documents (evidenceTier, tierConfidenceScore)` - admin review query
     - `gaps (assessmentId, priority)` - strategy matrix bucketing
     - `vendorMatches (assessmentId, totalScore)` - sorted vendor retrieval
   - Use Prisma `select` to limit fields returned (don't fetch unnecessary JSON blobs)
   - Use Prisma `include` efficiently (batch load related records, avoid N+1 queries)
6. **Async Background Processing:**
   - Evidence classification runs in background job (don't block assessment completion)
   - Use job queue (Bull with Redis backend)
   - Frontend polls for classification completion
   - Job retry logic: 3 retries with exponential backoff
7. **Response Pagination:**
   - Vendor matches: paginate if >50 vendors (return first 50, provide "load more")
   - Gap list: paginate if >100 gaps
   - Admin evidence review: paginate 20 documents per page
8. **Performance Monitoring:**
   - Add custom metrics for:
     - `evidence_classification_cache_hit_rate` (gauge)
     - `vendor_matching_cache_hit_rate` (gauge)
     - `weighted_score_calculation_duration_ms` (histogram)
     - `strategy_matrix_generation_duration_ms` (histogram)
   - Alert if cache hit rate <70% (indicates cache not working)
   - Alert if p95 latency >5 seconds for any endpoint
9. **Load Testing:**
   - Use k6 or Artillery for load testing
   - Simulate 100 concurrent users completing assessments
   - Verify: p95 latency <3 seconds for results endpoint
   - Verify: no memory leaks during sustained load
10. **Database Connection Pooling:**
    - Configure Prisma connection pool: max 20 connections
    - Monitor connection pool exhaustion
    - Add connection timeout (30 seconds)

#### Integration Verification

1. **IV1: Cache hits reduce latency** - Measure vendor matching latency on first call vs cached call, verify >50% improvement
2. **IV2: Cache invalidation works** - Update vendor profile, verify vendor matches cache cleared, new matches reflect update
3. **IV3: Background jobs don't block** - Complete assessment, verify immediate response (status 200), classification completes asynchronously
4. **IV4: Database indexes improve queries** - Compare query execution plans before/after indexes, verify index usage
5. **IV5: Load test passes** - Run load test with 100 concurrent users, verify all requests succeed, p95 latency <3 seconds

---

### Story 1.25: Documentation and Training Materials

As a **technical writer / product owner**,
I want **to create comprehensive documentation and training materials for enhanced assessment features**,
so that **users, admins, and support staff understand the new methodology and can use features effectively**.

#### Acceptance Criteria

1. **User Guide: Enhanced Risk Assessment** (`docs/user-guide-enhanced-assessment.md`)
   - Overview of enhanced methodology (evidence tiers, weighted scoring, regulatory alignment)
   - Step-by-step walkthrough: Create assessment → Upload documents → Review classifications → Complete assessment → Review results
   - Screenshots of each major UI component
   - Best practices: "How to get the best risk score" (upload Tier 2 evidence, address foundational gaps)
   - FAQ section (10+ common questions)
2. **User Guide: Priorities Questionnaire** (`docs/user-guide-priorities-questionnaire.md`)
   - Purpose: Personalized vendor matching
   - Step-by-step walkthrough of 6-step questionnaire
   - Tips for each step (e.g., "How to determine your top 3 priorities")
   - How priorities affect vendor recommendations
3. **User Guide: Strategy Matrix** (`docs/user-guide-strategy-matrix.md`)
   - Understanding timeline buckets (immediate/near-term/strategic)
   - How to use the roadmap for budgeting and planning
   - Exporting and sharing strategy matrix
4. **Admin Guide: Weight Management** (`docs/admin-guide-weight-management.md`)
   - When and why to adjust weights
   - Regulatory framework alignment principles
   - Step-by-step: Review current weights → Make adjustments → Provide rationale → Save changes
   - Preview impact feature explanation
   - Best practices: "Don't adjust weights without regulatory justification"
5. **Admin Guide: Evidence Classification Review** (`docs/admin-guide-evidence-classification-review.md`)
   - Understanding confidence scores
   - When to override AI classifications
   - Step-by-step: Review low-confidence documents → Preview document → Override if needed → Provide justification
   - Classification criteria reference (Tier 0/1/2 definitions with examples)
6. **Developer Documentation: API Reference** (`docs/api-reference-enhanced-assessment.md`)
   - All new endpoints documented:
     - POST/GET/PUT /assessments/:id/priorities
     - GET /assessments/:id/vendor-matches-v2
     - GET /assessments/:id/strategy-matrix
     - POST /documents/:id/reclassify
     - GET /admin/evidence-classification/review
     - PUT /admin/templates/:id/weights
   - Request/response schemas with examples
   - Authentication requirements
   - Rate limiting details
   - Error codes and handling
7. **Developer Documentation: Architecture Overview** (`docs/architecture-enhanced-assessment.md`)
   - High-level architecture diagram showing new services and data flow
   - Service descriptions:
     - evidence-classification.service.ts
     - weighted-scoring.service.ts
     - vendor-matching.service.ts
     - priorities.service.ts
     - strategy-matrix.service.ts
   - Database schema changes explained
   - Caching strategy
   - Feature flag implementation
8. **Support Guide: Troubleshooting** (`docs/support-guide-enhanced-assessment.md`)
   - Common issues and resolutions:
     - "User can't see enhanced features" → Check feature flag, check subscription tier
     - "Evidence classification stuck" → Check background job queue, retry classification
     - "Vendor matches show no results" → Check priorities submitted, check vendor database
     - "Old assessments don't have scores" → Explain scoring was implemented on specific date, recommend re-running assessment
   - How to access logs for debugging
   - Escalation procedures
9. **Video Tutorial: Enhanced Assessment Walkthrough** (5-7 minutes)
   - Screen recording with voiceover
   - Demonstrates: Upload documents → See classifications → Complete assessment → Review enhanced results → Submit priorities → View vendor matches and strategy matrix
   - Highlights key features and benefits
   - Published on help center and YouTube
10. **Release Notes: Enhanced Risk Assessment Launch** (`docs/release-notes-enhanced-assessment.md`)
    - Feature overview
    - What's new for users
    - What's new for admins
    - Migration guide: "What happens to my existing assessments?"
    - Known limitations (English only, desktop-optimized, etc.)
    - Feedback and support contact

#### Integration Verification

1. **IV1: Documentation accuracy** - Technical reviewer verifies all API examples work, all screenshots current
2. **IV2: Help center integration** - Documentation published to help center and accessible via in-app help links
3. **IV3: Support team training** - Support team completes training based on documentation, confirms they can troubleshoot common issues

---

## Completion Criteria

This epic is considered complete when:

1. ✅ All 25 stories completed and accepted
2. ✅ Integration tests passing with >90% coverage of critical paths
3. ✅ Performance benchmarks met: assessment results <3s, vendor matching <2s, classification <5s
4. ✅ Beta testing completed with 20 users, average satisfaction >4.0/5.0
5. ✅ Evidence tier classification achieves >85% accuracy on validation dataset
6. ✅ Feature flag enabled for gradual rollout (phase 3: 10% of users)
7. ✅ Documentation published to help center
8. ✅ Support team trained on new features
9. ✅ Zero critical bugs in production
10. ✅ Monitoring dashboards operational with alerts configured

**Estimated Timeline:** 12-14 weeks (3-4 months)
**Team:** 2 full-stack developers, 1 AI/ML engineer, 1 QA engineer, 1 compliance SME (part-time), Product Owner, UX Designer (consultation)

---

*End of PRD*
