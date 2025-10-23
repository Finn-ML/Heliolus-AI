# Project Brief: Enhanced Risk Assessment Logic

## Executive Summary

Heliolus Platform requires an enhanced risk assessment engine that implements a sophisticated, evidence-weighted scoring methodology. The enhancement will transform the current assessment system from basic AI-powered analysis into a defensible, regulatory-aligned compliance scoring system that distinguishes between policy documentation and proof of execution. This upgrade will strengthen our core value proposition by providing compliance officers with transparent, auditable risk assessments grounded in FFIEC and FATF frameworks, while seamlessly integrating with our existing vendor marketplace for targeted remediation recommendations.

**Key Enhancement:** Implement a 3-tier evidence classification system with weighted scoring that rewards system-generated proof (logs, API responses, database fields) over policy documents and self-declarations, producing defensible risk scores that reflect actual regulatory risk rather than mere question counts.

## Problem Statement

The current Heliolus assessment engine, while functional, lacks the sophisticated scoring methodology required to provide truly defensible compliance assessments. Current pain points include:

**Lack of Evidence Hierarchy:** All uploaded documents are treated equally, whether they're audit logs proving execution or informal emails describing intent. This fails to distinguish between "what you say you do" versus "proof you actually do it" - a critical distinction for regulatory defense.

**Unweighted Scoring Approach:** Current implementation treats all questions and sections equally. A company could score perfectly on low-risk supplementary controls (training documentation) while failing critical foundational requirements (sanctions screening execution), yet appear "medium risk" overall. This creates false confidence and misrepresents actual regulatory exposure.

**Vendor Matching Limitations:** The existing vendor matching algorithm doesn't integrate user priorities and preferences with objective gap analysis, leading to suboptimal recommendations that may not align with implementation urgency, budget constraints, or strategic goals.

**Regulatory Defensibility Gap:** Compliance officers need to justify their risk assessments to auditors and regulators. The current approach lacks the transparent, framework-aligned methodology required for regulatory scrutiny.

**Impact:** Without this enhancement, Heliolus cannot credibly serve enterprise compliance teams who require audit-grade assessments. We risk losing market credibility to competitors with more sophisticated methodologies, and users may make poor remediation decisions based on insufficiently nuanced risk scoring.

## Proposed Solution

Implement a comprehensive, evidence-weighted risk assessment engine with seven integrated components:

**1. Three-Tier Evidence Classification System**
AI automatically classifies uploaded documents based on content characteristics:
- **Tier 2 (×1.0 multiplier):** System-generated data including database fields, transaction IDs, timestamps, API responses, log files, metrics dashboards - proof of actual execution
- **Tier 1 (×0.8 multiplier):** Official policy documents with formal structure, version control, approval workflows, letterhead, regulatory citations - describes intent
- **Tier 0 (×0.6 multiplier):** Self-declared statements, informal documents, emails, memos lacking official structure - lowest credibility

**2. Two-Level Weighted Scoring Architecture**
- **Level 1 - Question Weighting:** Within each section, critical foundational controls carry higher weight (e.g., "Do you screen against OFAC?" at 20% vs "Staff training" at 5%)
- **Level 2 - Section Weighting:** Sections weighted by regulatory enforcement priorities and average penalty amounts (e.g., Sanctions Screening 18%, Transaction Monitoring 18%, Training 6%)

**3. Enhanced AI Question Analysis**
AI assigns quality scores (0-5) based on completeness of evidence, then applies evidence tier multiplier for final question score. Transparent calculation at every step.

**4. Intelligent Gap Identification**
Questions scoring <3.0/5 flagged as gaps with:
- Severity classification (Critical/High/Medium/Low)
- Priority ranking (1-10 scale)
- Effort estimate (Small/Medium/Large)
- Cost estimate (budget ranges)

**5. Personal Priorities Questionnaire**
Six-step structured questionnaire capturing:
- Organizational context (size, revenue, compliance team, jurisdictions)
- Goals & timeline (primary objective, implementation urgency)
- Use case prioritization (rank top 3 from identified gaps)
- Solution requirements (budget, deployment, must-have features)
- Vendor preferences (maturity, geography, support model)
- Decision factor ranking (speed vs innovation vs track record vs integration)

**6. Advanced Vendor Matching Algorithm**
Points-based system (0-140 points) combining:
- Base scoring (100 points): Risk area coverage, company size fit, geographic coverage, price appropriateness
- Priority boosts (+40 points): Top priority coverage, must-have features, deployment match, speed to deploy
- Transparent match reasoning displayed to users

**7. Strategy Matrix Timeline**
Organize gaps into phased remediation plan:
- 0-6 months (Immediate): Critical gaps (Priority 8-10)
- 6-18 months (Near-term): High/medium gaps (Priority 4-7)
- 18+ months (Strategic): Lower-priority gaps (Priority 1-3)

Each bucket shows aggregated effort, cost range, and recommended vendors addressing multiple gaps.

**Why This Solution:** This approach transforms Heliolus from a helpful assessment tool into a defensible compliance platform that compliance officers can confidently present to auditors, while maintaining our competitive advantage in vendor marketplace integration.

## Target Users

### Primary User Segment: Mid-Market to Enterprise Compliance Officers

**Profile:**
- **Title:** Chief Compliance Officer, Head of Compliance, Compliance Manager
- **Company Size:** 200-5000 employees in financial services, fintech, payment processors, crypto exchanges
- **Compliance Team Size:** 3-25 dedicated compliance staff
- **Geography:** US (FinCEN), UK (FCA), EU (multiple regulators), Singapore (MAS), Australia (AUSTRAC)

**Current Behaviors:**
- Conducting annual/biannual risk assessments using spreadsheets, consultants, or basic survey tools
- Struggling to justify assessment scores to auditors and regulators
- Managing vendor selection through manual RFP processes
- Seeking solutions to demonstrate "reasonable" compliance controls

**Specific Needs:**
- Defensible methodology aligned with recognized frameworks (FFIEC, FATF)
- Evidence-based scoring that differentiates documentation from execution
- Transparent calculations they can explain to auditors
- Efficient vendor discovery tied to specific identified gaps
- Time savings on assessment administration and vendor research

**Goals:**
- Pass regulatory examinations without findings
- Optimize compliance budget allocation
- Demonstrate continuous improvement in compliance posture
- Reduce time spent on assessment administration from weeks to days

### Secondary User Segment: Compliance Consultants & Advisors

**Profile:**
- Consultants serving multiple financial services clients
- Need repeatable, credible assessment methodology
- Value white-label or co-branded capabilities
- Require portfolio view across multiple client assessments

**Needs:**
- Consistent methodology across all clients
- Customizable assessment templates for different regulatory regimes
- Efficiency gains to serve more clients with same resources

## Goals & Success Metrics

### Business Objectives

- **Increase Premium Conversion Rate:** 35% of freemium users upgrade to Premium (€599/month) within 90 days of completing enhanced assessment (baseline: 18% with current system)
- **Expand Enterprise Market:** Sign 15 enterprise contracts (€2K-5K/month custom pricing) within 12 months of launch (baseline: 0 enterprise clients currently)
- **Reduce Churn:** Maintain <5% monthly churn for Premium subscribers using enhanced assessment features (baseline: 12% churn)
- **Increase Assessment Completion Rate:** 80% of started assessments completed (baseline: 62% completion)

### User Success Metrics

- **Time to Complete Assessment:** <4 hours total user time from document upload to final report (baseline: 8-12 hours)
- **User Confidence Score:** >4.2/5.0 average rating on "I would confidently present this assessment to an auditor" (new metric)
- **Vendor Match Relevance:** >4.0/5.0 average rating on "Recommended vendors are relevant to my needs" (baseline: 3.2/5.0)
- **Evidence Upload Rate:** >70% of users upload at least one Tier 2 document (system-generated evidence) during assessment
- **Repeat Usage:** 60% of users conduct second assessment within 12 months (annual refresh cycle)

### Key Performance Indicators (KPIs)

- **Assessment Quality KPI:** Average risk score differential between self-declared answers (Tier 0) and documented evidence (Tier 1-2) = >15 points on 100-point scale (indicates system is successfully differentiating evidence quality)
- **Vendor Engagement KPI:** 45% of completed assessments result in vendor contact request (baseline: 28%)
- **Revenue per Assessment KPI:** €450 average revenue per completed assessment (Premium subscription allocation + vendor referral fees)
- **Methodology Transparency KPI:** <2% of users request scoring methodology explanation/clarification via support (indicates clear, self-explanatory system)
- **Framework Alignment KPI:** 100% of assessment templates validated against corresponding regulatory frameworks (FFIEC, FATF, etc.) by external compliance expert

## MVP Scope

### Core Features (Must Have)

- **Evidence Tier Classification Engine:** AI-powered document classifier that analyzes uploaded documents and automatically assigns Tier 0/1/2 classification based on content characteristics (formal structure, version control indicators, system-generated data markers). User can see tier assignment with explanation but cannot override (prevents gaming). Must achieve >85% classification accuracy based on test dataset.

- **Two-Level Weighted Scoring System:** Implement question weights and section weights in AssessmentTemplate schema. Scoring algorithm that applies evidence multipliers (×1.0, ×0.8, ×0.6) and calculates weighted section scores and overall risk score (0-100 scale). Complete transparency: show all calculations in UI with expandable detail views.

- **Enhanced Gap Identification Logic:** Automatically flag questions scoring <3.0/5 as gaps. AI-powered assignment of severity (Critical/High/Medium/Low), priority (1-10), effort (S/M/L), and cost ranges based on question importance, section context, and organizational risk profile. Gap dashboard showing all identified gaps with filtering and sorting.

- **Personal Priorities Questionnaire:** Six-step questionnaire presented after assessment completion and before vendor matching. Captures organizational context, goals, timeline, use case prioritization, solution requirements, vendor preferences, and decision factor ranking. Stored in database for vendor matching algorithm consumption.

- **Advanced Vendor Matching Algorithm:** Points-based vendor scoring (0-140 points) combining base criteria (40% risk area coverage, 20% size fit, 20% geography, 20% price) and priority boosts (top priority coverage, must-have features, deployment match, speed). Display match scores and detailed match reasoning to users. Support side-by-side vendor comparison with highlighted differentiators.

- **Strategy Matrix Timeline View:** Organize all identified gaps into three timeline buckets (0-6 months, 6-18 months, 18+ months) based on priority scores. Display aggregated metrics per bucket: gap count, total effort, cost range, recommended vendors. Visual roadmap interface showing phased remediation plan.

- **Enhanced Assessment Results Dashboard:** Comprehensive results view showing overall risk score (0-100 with band: Critical/High/Medium/Low), section-by-section breakdown with drill-down to question-level scores, evidence tier distribution chart, gap summary with severity distribution, and vendor recommendations with match scores.

- **Updated PDF Report Generation:** Enhanced report template including methodology explanation, evidence tier breakdown, two-level weighting visualization, detailed gap analysis with strategy matrix timeline, vendor match reasoning, and regulatory framework alignment statement.

### Out of Scope for MVP

- Multi-language support for assessments (English only for MVP)
- Custom template creation by users (admin-curated templates only)
- Integration with third-party compliance systems (API available but no pre-built connectors)
- Mobile app for assessment completion (responsive web only)
- Collaborative assessment features (multiple users working on same assessment)
- Historical trend analysis across multiple assessment cycles
- Benchmark scoring against industry peers
- Automated vendor RFP generation
- Machine learning model retraining interface (models updated via backend process)
- White-label/co-branding for consultants (post-MVP feature)

### MVP Success Criteria

MVP is considered successful when:
1. 20 Beta users complete end-to-end enhanced assessment with average satisfaction >4.0/5.0
2. Evidence tier classification achieves >85% accuracy on validation dataset (200 diverse documents)
3. At least 3 users provide written testimonial stating they would use assessment results in regulatory context
4. Vendor match relevance score >3.8/5.0 average across beta cohort
5. System successfully processes assessment with 50 questions, 10 sections, 20 uploaded documents without performance degradation (<3 second page load times)
6. Zero critical bugs in scoring algorithm (accurate calculations with edge cases like missing data, all Tier 0 responses, perfect scores)

## Post-MVP Vision

### Phase 2 Features (Months 4-9)

**Continuous Monitoring Integration:** Instead of point-in-time assessments, allow users to connect data sources (SIEM, case management systems, transaction monitoring platforms) for continuous scoring updates. Alerts when risk score degrades below threshold.

**Benchmark Scoring:** Anonymous aggregated data showing how user's risk score compares to industry peers (by company size, geography, regulatory regime). Identify areas where user is significantly below industry average.

**Collaborative Assessments:** Multi-user workflow where different team members can complete different sections, with approval workflows and audit trail. Particularly valuable for enterprise clients with distributed compliance teams.

**Custom Template Builder:** Allow enterprise clients and consultants to create custom assessment templates with their own question sets, weighting preferences, and framework alignments. Admin approval required before use.

**Vendor Integration Marketplace:** Pre-built API connectors for top vendors (sanctions screening APIs, transaction monitoring platforms, case management systems) enabling one-click evidence import from vendor systems to automatically populate Tier 2 evidence.

### Long-Term Vision (12-24 Months)

**AI Compliance Copilot:** Conversational AI assistant that helps users understand gaps ("Explain why sanctions screening is my top priority"), draft remediation plans ("What steps should I take to improve KYC score from 62 to 80?"), and simulate "what-if" scenarios ("If I implement this vendor's solution, how would my score change?").

**Regulatory Change Intelligence:** Automated monitoring of regulatory updates (new FATF recommendations, FFIEC guidance updates, jurisdiction-specific rule changes) with AI-powered impact analysis on existing assessments and suggested template updates.

**Assessment Automation Platform:** Evolve from assisted assessment to largely automated assessment where system continuously ingests evidence from connected sources, automatically updates scores, and alerts users only when action is required.

### Expansion Opportunities

**Geographic Expansion:** Templates for additional regulatory regimes (APAC markets, Middle East, Latin America) with localized vendor marketplaces and regional compliance expertise.

**Vertical Expansion:** Adapt methodology for adjacent regulated industries: healthcare (HIPAA), insurance (state regulations), cybersecurity (NIST, ISO 27001), privacy (GDPR, CCPA).

**Consultant Platform:** White-label SaaS offering for compliance consultancies to serve their client portfolios with co-branded assessments, portfolio dashboards, and client management features.

**Vendor Intelligence Platform:** Flip the marketplace - offer vendors analytics on how they rank across multiple user assessments, competitive positioning insights, and lead generation capabilities (with user consent).

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Web application (responsive design, desktop-optimized for assessment completion)
- **Browser Support:** Chrome/Edge (latest 2 versions), Firefox (latest 2 versions), Safari 15+
- **Performance Requirements:**
  - Assessment results page load <3 seconds with 50 questions, 20 documents
  - Evidence tier classification <5 seconds per document (up to 10MB)
  - Vendor matching algorithm execution <2 seconds for 100+ vendors
  - PDF report generation <10 seconds for comprehensive 20+ page report
  - Concurrent user support: 200 simultaneous active assessments

### Technology Preferences

**Frontend Enhancements:**
- Continue with existing Vite + React 18 + TypeScript stack
- Leverage Recharts for enhanced data visualizations (scoring breakdowns, evidence distribution, timeline roadmap)
- Framer Motion for smooth transitions in multi-step questionnaire
- React Hook Form + Zod validation for priorities questionnaire forms
- TanStack Query for assessment calculation caching and optimistic updates

**Backend Enhancements:**
- Extend existing Fastify 4 + TypeScript backend
- New dedicated services:
  - `evidence-classification.service.ts` - Document tier classification logic
  - `weighted-scoring.service.ts` - Two-level weighted scoring calculations
  - `vendor-matching.service.ts` - Enhanced matching algorithm
  - `priorities.service.ts` - Questionnaire data management
  - `strategy-matrix.service.ts` - Timeline-based gap organization
- Enhance existing `ai-analysis.service.ts` with evidence tier classification prompts
- Extend `assessment.service.ts` with new scoring methodology

**Database Schema Updates (Prisma):**
```prisma
// Evidence tier classification
enum EvidenceTier {
  TIER_0  // Self-declared (×0.6)
  TIER_1  // Policy documents (×0.8)
  TIER_2  // System-generated (×1.0)
}

// Add to Document model
model Document {
  evidenceTier         EvidenceTier?
  tierClassificationReason  String?  // AI explanation
  tierConfidenceScore  Float?       // 0-1 confidence
}

// Add to Question model (template level)
model Question {
  weight              Float?       // Question weight within section (0-1)
  isFoundational      Boolean      // Critical vs supplementary
}

// Add to Section model (template level)
model Section {
  weight              Float        // Section weight in overall score (0-1)
  regulatoryPriority  String?      // FFIEC, FATF reference
}

// Add to Answer model
model Answer {
  rawQualityScore     Float?       // AI score 0-5 before multiplier
  evidenceTier        EvidenceTier? // Tier of best evidence used
  tierMultiplier      Float?       // 0.6, 0.8, or 1.0
  finalScore          Float?       // rawQualityScore × tierMultiplier
}

// Add to Gap model
model Gap {
  effort              EffortRange  // S/M/L
  costRange           CostRange    // Budget estimate enum
}

// New model for priorities questionnaire
model AssessmentPriorities {
  id                  String       @id @default(cuid())
  assessmentId        String       @unique
  assessment          Assessment   @relation(...)

  // Step 1: Org context
  companySize         CompanySize
  annualRevenue       AnnualRevenue
  complianceTeamSize  ComplianceTeamSize
  jurisdictions       String[]     // Array of regulatory jurisdictions
  existingSystems     String[]     // Integration needs

  // Step 2: Goals
  primaryGoal         String
  implementationUrgency String     // Immediate/Planned/Strategic/Long-term

  // Step 3: Use case prioritization
  selectedUseCases    String[]     // Checkboxes
  rankedPriorities    String[]     // Top 3 in order

  // Step 4: Solution requirements
  budgetRange         String
  deploymentPreference String
  mustHaveFeatures    String[]
  criticalIntegrations String[]

  // Step 5: Vendor preferences
  vendorMaturity      String
  geographicRequirements String
  supportModel        String

  // Step 6: Decision factors
  decisionFactorRanking String[]   // Ordered array

  createdAt           DateTime     @default(now())
}

// Enhanced VendorMatch scoring
model VendorMatch {
  baseScore           Float        // 0-100 base points
  priorityBoost       Float        // 0-40 boost points
  totalScore          Float        // baseScore + priorityBoost
  matchReasons        Json         // Detailed breakdown for display
}
```

**AI/ML Integration:**
- OpenAI GPT-4 for evidence tier classification (analyze document structure, content type, formality indicators)
- Custom prompts for identifying system-generated data markers, formal document indicators
- Confidence scoring on tier classification (flag documents <0.7 confidence for manual review in admin)

**Caching Strategy:**
- Redis cache for vendor matching results (keyed by assessment priorities hash, 24hr TTL)
- Memoize weighted score calculations during assessment review
- Cache PDF report generation for 7 days (regenerate on assessment updates)

### Architecture Considerations

**Repository Structure:**
- Continue monorepo structure (`backend/`, `frontend/`)
- Add new directories:
  - `backend/src/scoring/` - Weighted scoring logic, calculation utilities
  - `backend/src/classification/` - Evidence tier classification algorithms
  - `backend/src/matching/` - Vendor matching algorithm components

**Service Architecture:**
- Maintain service-oriented architecture with new specialized services
- Evidence classification service with pluggable classification strategies (future: custom models, rule-based classification)
- Vendor matching service with configurable scoring weights (admin adjustable via config)
- Strategy matrix service that transforms gaps into timeline-based roadmap

**Integration Requirements:**
- Existing Stripe integration unaffected
- Existing S3 document storage - extend with evidence tier metadata
- Existing AI analysis service - enhance with new classification prompts
- Existing vendor database - enhance with new filterable attributes (deployment type, target company size, implementation timeline, feature tags)

**Security & Compliance:**
- Evidence tier classification decisions logged in audit trail (prevent manipulation)
- Question/section weights stored in templates (immutable without admin approval)
- User priorities data encrypted at rest (PII: budget, company size)
- GDPR compliance: priorities data exportable, deletable on user request
- Rate limiting on AI classification calls (prevent abuse)

### Data Requirements

**Assessment Template Enhancement:**
- All existing templates must be enhanced with question weights and section weights
- Initial weights derived from FFIEC BSA/AML framework, FATF 40 Recommendations
- Documented rationale for each weight assignment
- Admin interface to review/adjust weights (with audit trail)

**Vendor Database Enhancement:**
- Add 200+ structured attributes per vendor:
  - Target company sizes (small/mid-market/enterprise)
  - Geographic coverage (jurisdictions served)
  - Deployment options (cloud/on-premise/hybrid)
  - Implementation timeline (typical days to deployment)
  - Must-have feature tags (50+ standardized features)
  - Pricing transparency (range bands)
  - Compliance area coverage (map to assessment sections)

**Evidence Classification Training Data:**
- Curate 500+ sample documents across Tier 0/1/2 for validation
- Labeled dataset for classification accuracy measurement
- Edge case collection (hybrid documents, ambiguous structure)

## Constraints & Assumptions

### Constraints

**Budget:** Development budget €80K-120K (3-4 months full-stack development + AI engineering + QA)

**Timeline:**
- MVP development: 12-14 weeks
- Beta testing: 4 weeks
- Production launch: 16-18 weeks from kickoff
- Constraint: Must launch before Q3 2025 to capture annual assessment cycle

**Resources:**
- 2 senior full-stack developers (backend-focused, frontend-focused)
- 1 AI/ML engineer (evidence classification, prompt engineering)
- 1 compliance subject matter expert (weights validation, framework alignment)
- 1 QA engineer (algorithm testing, edge case validation)
- Product Owner (10-15 hrs/week)
- UX Designer (consultation basis for questionnaire and results visualization)

**Technical:**
- Must maintain backward compatibility with existing assessments (migration strategy for historical data)
- Cannot modify existing Prisma schema in breaking ways (require migrations)
- OpenAI API rate limits and cost constraints (estimate: €0.15 per document classification)
- Performance requirement: Sub-3-second scoring calculations limits algorithm complexity

### Key Assumptions

- Assessment templates will have 6-12 sections with 5-15 questions per section (standard compliance assessment scope)
- Users will upload 5-25 documents per assessment on average (evidence availability)
- Vendor database will contain 100-200 vendors at launch, growing to 500+ within 12 months
- 80% of users will complete priorities questionnaire if presented immediately after assessment (engagement assumption)
- Tier 2 evidence (system-generated) will be available for <40% of questions on average (realistic expectation: most users have policies but limited audit logs/API responses)
- Evidence tier classification AI will achieve >85% accuracy, reducing need for manual override
- Question/section weights can be standardized across users in same regulatory regime (no per-user weight customization needed for MVP)
- Vendor match scores >100/140 will feel "highly relevant" to users (threshold validation needed in beta)
- Users understand evidence tier concepts with minimal explanation (clear labeling: "Policy documents", "System-generated proof", "Self-declared")
- Existing vendor marketplace has sufficient vendor data quality to support matching algorithm (may require vendor data cleanup/enhancement project in parallel)

## Risks & Open Questions

### Key Risks

- **Evidence Classification Accuracy Risk:** AI misclassifies document tiers (e.g., labels informal email as Tier 1 policy), leading to inflated scores and false confidence. Users lose trust in system objectivity. **Mitigation:** Implement confidence scoring; flag low-confidence classifications for manual review in admin panel. Build comprehensive validation dataset (500+ documents). Provide user-visible classification explanation ("Classified as Tier 1 because: formal structure, version control, approval signatures detected").

- **Weighting Controversy Risk:** Users disagree with question/section weights, perceive system as "unfair" or "not applicable to my business." Lose credibility as regulatory-aligned methodology. **Mitigation:** Document all weight assignments with regulatory framework references (FFIEC, FATF citations). Publish methodology white paper. Provide admin flexibility to create jurisdiction-specific templates with adjusted weights. Beta test with compliance experts for weight validation.

- **Complexity Overwhelm Risk:** Two-level weighting + evidence tiers + priorities questionnaire creates cognitively overwhelming UX. Users abandon assessment mid-process or distrust "black box" scoring. **Mitigation:** Progressive disclosure - show simple overall score upfront, provide drill-down for detail. Extensive tooltips and help text. Methodology explanation page with worked examples. Beta test UX with target users.

- **Vendor Match Disappointment Risk:** Matching algorithm produces low-relevance vendor recommendations, reducing marketplace engagement and revenue. **Mitigation:** Extensive vendor data cleanup before launch (ensure all vendors have complete profiles). A/B test match score thresholds (only show vendors >80/140?). Gather explicit feedback on each match ("Was this vendor relevant? Yes/No"). Iterate algorithm weights based on feedback data.

- **Performance Degradation Risk:** Complex weighted scoring calculations + AI classification + vendor matching create unacceptable latency, especially for large assessments (100+ questions, 50+ documents). **Mitigation:** Implement aggressive caching strategy (Redis for vendor matches, memoization for score calculations). Async processing for evidence classification (background jobs). Load testing with realistic assessment sizes. Set hard performance budgets (SLOs) and optimize before launch.

### Open Questions

- **How should we handle assessments with zero Tier 2 evidence?** If user only uploads policies/self-declares, their max score is capped at 80/100 (Tier 1 ×0.8) or 60/100 (Tier 0 ×0.6). Is this acceptable or too punishing? Should we provide guidance on how to obtain Tier 2 evidence?

- **Should users be able to override evidence tier classification?** Current design: AI classification is final (prevents gaming). Alternative: Allow override with mandatory justification (logged in audit trail). What's right balance between flexibility and integrity?

- **How do we handle missing sections in assessment templates?** If template lacks specific sections user prioritized in questionnaire (e.g., user says "Fraud Detection" is top priority but template doesn't have fraud section), how does vendor matching handle this mismatch?

- **What's the right threshold for "gap" identification?** Currently <3.0/5 = gap. Should this vary by question importance? Should critical questions have higher threshold (e.g., <4.0/5 for foundational controls)?

- **How do we prevent vendor gaming of match algorithm?** Vendors might optimize profiles to score high on algorithm (claim broad coverage, list all features). Do we need vendor verification process? Third-party validation of vendor claims?

- **Should we support partial assessment completion with vendor matching?** User completes 3/10 sections - can they still get vendor matches for completed sections? Or require full assessment completion?

- **How transparent should scoring methodology be to freemium users?** Show full calculation details (competitive intelligence risk - consultants could reverse-engineer on free tier)? Or limit methodology transparency to Premium subscribers?

- **What's migration strategy for existing assessments?** Historical assessments lack evidence tiers, question weights. Do we:
  - Re-score existing assessments with new methodology (changes historical scores)?
  - Grandfather old methodology for old assessments, new methodology for new ones (inconsistency)?
  - Encourage users to re-run assessments with new system (effort required)?

### Areas Needing Further Research

- **Regulatory framework validation:** Engage external compliance consultant to validate question/section weights against FFIEC, FATF, and jurisdiction-specific requirements. Ensure weights defensible in audit context.

- **Competitive analysis of scoring methodologies:** How do competitors (Compas, Hummingbird, Drata, Vanta) approach risk scoring? Are there industry-standard weighting approaches we should align with?

- **Vendor data enrichment strategy:** Current vendor database quality assessment. Identify gaps in vendor profiles (missing deployment info, incomplete feature tags). Plan vendor outreach campaign or third-party data sourcing.

- **Evidence tier classification benchmarking:** Research document classification approaches in adjacent domains (legal tech, audit tech). Are there pre-trained models or services we could leverage vs building from scratch?

- **User research on priorities questionnaire:** Test 6-step questionnaire flow with target users. Validate that questions capture sufficient information for matching without creating survey fatigue. Optimize question wording and order.

- **Performance benchmarking:** Load test current system with enhanced algorithm logic. Identify bottlenecks. Establish baseline performance metrics and SLOs for enhanced system.

## Appendices

### A. Research Summary

**Document Source:** "Heliolus Risk Assessment Logic (1).docx" - 10-page methodology specification covering:
1. Evidence classification (3-tier system with multipliers)
2. AI question analysis & scoring (0-5 scale with tier multipliers)
3. Two-level weighting (question weights + section weights)
4. Gap identification logic (<3.0/5 threshold with severity/priority/effort/cost)
5. Personal priorities questionnaire (6 steps, detailed)
6. Vendor matching algorithm (base scoring + priority boosts, 0-140 points)
7. Strategy matrix timeline (0-6, 6-18, 18+ month buckets)

**Framework Alignment Research:**
- FFIEC BSA/AML Examination Manual - provides foundation for AML/CFT section weighting
- FATF 40 Recommendations - international standard for AML compliance controls
- Industry penalty data (OFAC, FinCEN enforcement actions) - informs section weight calibration

**Competitive Landscape:**
- Current market: Compliance assessment tools focus on survey-based self-assessment
- Gap: Lack evidence differentiation and regulatory-aligned weighting
- Opportunity: First-to-market with defensible, evidence-weighted methodology

### B. Stakeholder Input

**Compliance Officer Feedback (Initial Concept Validation):**
- "Need to justify scores to auditors - transparency critical"
- "Tired of vendors that don't fit our budget or technical environment"
- "Want to know what's most important to fix first, not just a list of everything wrong"

**Regulatory Framework Requirements:**
- FFIEC expects risk-based approach with documented methodology
- FATF recommendations emphasize risk assessment as foundation for compliance program
- Auditors look for objective, repeatable assessment processes

### C. References

- FFIEC BSA/AML Examination Manual: https://www.ffiec.gov/bsa_aml_infobase/default.htm
- FATF 40 Recommendations: https://www.fatf-gafi.org/recommendations.html
- Source Document: "Heliolus Risk Assessment Logic (1).docx" (PDF version reviewed)
- Existing Heliolus Platform Architecture: `/home/runner/workspace/CLAUDE.md`
- Prisma Schema: `/home/runner/workspace/backend/prisma/schema.prisma`

## Next Steps

### Immediate Actions

1. **Stakeholder Review & Approval** - Product Owner reviews brief, validates scope and timeline, approves MVP feature set (Target: 3 business days)

2. **Compliance Expert Engagement** - Hire or contract compliance SME to validate question/section weights against regulatory frameworks (Target: 1 week to identify expert, 2 weeks for weight validation)

3. **Technical Feasibility Spike** - Senior developer conducts 2-day spike on evidence classification approach (OpenAI prompt engineering vs custom model, accuracy expectations, cost per classification) (Target: 1 week)

4. **Vendor Data Audit** - Assess current vendor database completeness, identify required data enrichment (deployment type, features, target segments, implementation timeline) (Target: 1 week)

5. **UX Design Kickoff** - Designer creates wireframes for priorities questionnaire flow, enhanced results dashboard, strategy matrix timeline view (Target: 2 weeks)

6. **PRD Development** - Product Owner works with PM to create detailed PRD with user stories, acceptance criteria, and API specifications (Target: 2 weeks)

7. **Sprint Planning** - Break PRD into 2-week sprints, establish development timeline, identify dependencies (Target: 1 week after PRD complete)

### PM Handoff

This Project Brief provides the full context for the Enhanced Risk Assessment Logic implementation for Heliolus Platform. The project transforms our assessment engine from basic AI analysis into a defensible, regulatory-aligned compliance scoring system with sophisticated evidence weighting and intelligent vendor matching.

**Key Implementation Priorities:**
1. Evidence tier classification must be highly accurate (>85%) and transparent to users
2. Question/section weights must be validated by compliance expert and traceable to regulatory frameworks
3. Vendor matching algorithm requires clean, complete vendor data to succeed
4. Performance is critical - complex calculations cannot degrade user experience
5. Beta testing with real compliance officers is essential before broad launch

Please start in PRD Generation Mode, review the brief thoroughly, and work with stakeholders to create the PRD section by section, asking for any necessary clarification or suggesting improvements. Pay special attention to the database schema changes, new service architecture, and the sophisticated scoring algorithm logic that forms the core of this enhancement.
