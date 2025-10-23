# ChatGPT Prompt: Generate Mock Compliance Documentation for Testing

## Prompt to Copy & Paste into ChatGPT

```
I need you to generate comprehensive mock compliance documentation for testing a Financial Crime Compliance assessment system. Please create realistic documentation that covers all aspects of a mid-sized fintech company's AML/CFT compliance program.

## COMPANY PROFILE

Create a fictional company with these characteristics:

**Company Details:**
- Name: [Generate a realistic fintech company name]
- Industry: Digital payments / Neobank
- Size: 250 employees
- Annual Revenue: $50-100M
- Geography: UK-based, operations in EU and US
- Customer Base: 500,000 retail customers, 2,000 business customers
- Compliance Team: 8 people (1 MLRO, 2 KYC analysts, 2 transaction monitoring analysts, 1 sanctions specialist, 1 trainer, 1 audit manager)
- Risk Profile: Medium-High (cross-border payments, cryptocurrency on-ramp)

**Compliance Maturity Level: Medium**
- Some automated systems in place
- Mix of manual and automated processes
- Recent regulatory findings requiring remediation
- Upgrading legacy systems
- Training programs established but need improvement
- Some gaps in emerging risk areas (AI, crypto)

---

## DOCUMENTATION TO GENERATE

Please create separate documents (as if they were uploaded files) covering each of the following 12 sections. Make them realistic with specific details, procedures, dates, and metrics. Each document should be 500-1000 words.

### DOCUMENT 1: Geographic Risk Assessment Policy
**Topics to cover:**
- List of jurisdictions where company operates (UK, France, Germany, Spain, Netherlands, US - NY/CA)
- Country risk assessment methodology
- Risk ratings for each jurisdiction (using FATF categories)
- High-risk jurisdictions the company deals with (if any)
- Enhanced due diligence procedures for high-risk countries
- Quarterly review process
- Restricted/prohibited jurisdictions list

**Include realistic weaknesses:**
- Country risk assessments last updated 14 months ago (should be annual)
- No automated alerts when jurisdiction risk ratings change
- Manual spreadsheet tracking

---

### DOCUMENT 2: Governance & Compliance Framework
**Topics to cover:**
- Organizational structure (show MLRO reporting to CEO)
- Three Lines of Defense model
- Board oversight and reporting frequency
- AML/CFT policies and procedures manual (list key policies)
- Regulatory change management process
- Compliance Committee meeting cadence
- Annual risk assessment process
- Budget allocation for compliance ($2M annually)
- Staff turnover issues

**Include realistic weaknesses:**
- Board receives compliance updates quarterly (best practice is monthly)
- Regulatory change management is reactive, not proactive
- Policy updates lag behind regulatory changes
- Limited investment in compliance technology

---

### DOCUMENT 3: Enterprise-Wide Risk Assessment (EWRA)
**Topics to cover:**
- Annual EWRA methodology (inherent risk + controls = residual risk)
- Risk categories assessed (customer, product, geographic, channel)
- Risk scoring matrix (1-5 scale for likelihood and impact)
- Key inherent risks identified:
  - Cross-border payments (HIGH)
  - Cryptocurrency transactions (HIGH)
  - PEP exposure (MEDIUM)
  - Sanctions risk (MEDIUM-HIGH)
- Control effectiveness assessment
- Residual risk ratings
- Risk appetite statement
- Emerging risks section (mention AI/ML, CBDCs, DeFi but limited analysis)

**Include realistic weaknesses:**
- EWRA completed once per year (should be continuous)
- Limited scenario analysis
- Emerging risks (AI, crypto) not fully integrated
- No stress testing performed

---

### DOCUMENT 4: Customer Due Diligence Procedures Manual
**Topics to cover:**
- Customer onboarding standards (CDD, EDD, SDD)
- Identity verification process (IDV provider: Onfido)
- Document requirements by customer type
- Beneficial ownership verification (25% threshold)
- UBO data collection process and database
- PEP screening procedures
- Risk-based customer segmentation (Low/Medium/High)
- Periodic review schedule:
  - High risk: Every 6 months
  - Medium risk: Annually
  - Low risk: Every 2 years
- Source of wealth/funds collection for high-risk customers
- Customer acceptance criteria
- Rejected applications metrics (5% rejection rate)

**Include realistic weaknesses:**
- UBO verification sometimes relies on customer self-certification
- UBO refresh cycle not always met (backlog of 200 reviews overdue)
- Manual CDD process for 30% of applications
- Limited ongoing monitoring of low-risk customers
- PEP screening only at onboarding (not continuous)

---

### DOCUMENT 5: Adverse Media Screening Policy
**Topics to cover:**
- Adverse media screening provider (Dow Jones Risk & Compliance)
- Screening triggers: Onboarding, annual refresh, event-driven
- Categories of adverse media monitored (fraud, corruption, sanctions violations, money laundering, terrorist financing)
- Alert review process and timeframes (3 business days)
- Escalation procedures for confirmed hits
- False positive management
- Screening for beneficial owners and directors
- Monthly adverse media screening stats (avg. 150 alerts/month, 5% true positive rate)

**Include realistic weaknesses:**
- Adverse media screening only performed at onboarding and annually (not continuous)
- No real-time screening for negative news
- Manual review process is time-consuming
- Backlog of adverse media alerts (50 pending reviews)
- Limited screening of indirect beneficial owners

---

### DOCUMENT 6: Sanctions Screening Program
**Topics to cover:**
- Sanctions lists monitored: OFAC SDN, EU Sanctions, UN Sanctions, UK HMT, FINMA
- Screening technology: ComplyAdvantage (automated real-time screening)
- Screening frequency: Real-time at onboarding, payment processing, and daily batch screening
- Fuzzy matching threshold: 85%
- PEP screening integrated (World-Check One)
- Alert volumes: 500 alerts/month, 2% true positive rate
- Alert investigation SLA: 4 hours for payment blocks, 24 hours for batch
- Sanctions violation response procedures
- Staff training on sanctions (annual)
- List update process (automated daily)
- Retrospective screening when lists update (within 24 hours)

**Include realistic weaknesses:**
- High false positive rate (98%) causing alert fatigue
- Fuzzy matching threshold may miss creative spellings
- Limited screening of indirect relationships
- Manual processes for some payment channels
- PEP screening limited to customer and beneficial owners (not family members/close associates)

---

### DOCUMENT 7: Transaction Monitoring & SAR Filing
**Topics to cover:**
- Transaction monitoring system: SAS AML (rules-based with behavioral analytics)
- Monitoring scenarios (list 15-20 scenarios):
  - Rapid movement of funds
  - Structuring (just below reporting thresholds)
  - High-risk country transactions
  - Unusual cross-border activity
  - Round dollar amounts
  - Velocity of transactions
  - Cash deposits (for business customers)
- Scenario tuning frequency: Quarterly
- Alert volumes: 800 alerts/month
- Investigation timeframe: 90% within 5 business days
- Alert-to-SAR ratio: 4% (32 SARs filed per month on average)
- SAR filing process and timeframes (within 15 days of detection)
- Quality review of SARs before filing
- Suspicious Activity Committee meetings (weekly)
- Regulatory reporting stats (last year: 380 SARs filed)

**Include realistic weaknesses:**
- Rules haven't been tuned in 6 months (should be quarterly)
- High alert volume causing analyst burnout
- Limited use of behavioral analytics (mostly rules-based)
- No machine learning models deployed
- Investigation backlog: 120 alerts pending
- Some scenarios lack appropriate thresholds for customer risk tiers

---

### DOCUMENT 8: Fraud Prevention & Identity Verification
**Topics to cover:**
- Identity verification provider: Onfido (document verification, biometric checks)
- Fraud detection tools: Sift Science (device fingerprinting, behavioral analysis)
- Fraud types monitored:
  - Account takeover
  - Identity theft
  - Payment fraud
  - First-party fraud
  - Synthetic identity fraud
- Integration between AML and fraud systems (limited)
- Fraud alert volumes: 1,200 alerts/month, 15% confirmed fraud rate
- Chargeback rates: 0.8% (industry avg 0.5-1%)
- Account recovery process for compromised accounts
- Customer authentication methods: 2FA, biometrics
- Fraud reporting to Action Fraud (UK)

**Include realistic weaknesses:**
- Limited integration between fraud and AML systems
- Fraud and AML teams operate in silos
- No unified customer risk view
- Identity verification reliance on single provider
- Limited synthetic identity fraud detection capabilities
- Manual review for 40% of fraud alerts

---

### DOCUMENT 9: Technology & Data Infrastructure
**Topics to cover:**
- Core banking system: Thought Machine Vault
- AML transaction monitoring: SAS AML
- KYC platform: Encompass (Tier 1)
- Sanctions screening: ComplyAdvantage
- Case management: Actimize
- Data warehouse: Snowflake
- Data quality metrics: 95% completeness, 92% accuracy
- System integration architecture (API-based)
- Data retention policy: 7 years for customer data, 5 years for transaction data
- Business continuity: RPO 4 hours, RTO 24 hours
- Disaster recovery tested annually
- Cloud infrastructure: AWS (UK and EU regions)
- GDPR compliance measures
- Encryption: Data at rest (AES-256), data in transit (TLS 1.3)
- Access controls: Role-based, MFA enabled

**Include realistic weaknesses:**
- Legacy systems still in use for some processes
- Limited API integration between some systems (manual data transfers)
- Data quality issues with older records
- Data silos across fraud, AML, and KYC systems
- No unified data analytics platform
- Limited real-time data processing capabilities
- Technology refresh needed for transaction monitoring system (5 years old)

---

### DOCUMENT 10: Training & Culture Program
**Topics to cover:**
- AML/CFT training program structure:
  - Onboarding training (2 days)
  - Annual refresher (4 hours online)
  - Role-based training (KYC, TM, Sanctions)
  - Regulatory update training (ad-hoc)
- Training completion rates: 94% (target: 98%)
- Training content: AML regulations, typologies, red flags, reporting
- Training provider: Mix of internal and external (ACAMS materials)
- Effectiveness testing: Post-training quizzes (80% pass rate required)
- Whistleblowing policy and hotline
- Speak-up culture initiatives
- Tone from the top: CEO and Board communications on compliance
- Compliance champion program (25 volunteers)
- Disciplinary actions for compliance breaches (3 in past year)

**Include realistic weaknesses:**
- Training completion lagging (6% not current)
- Generic training content (not tailored to risk profile)
- Limited training on emerging typologies (crypto, AI)
- No specialized training for senior management
- Effectiveness testing not robust (multiple choice only)
- Culture surveys show some staff view compliance as "box-ticking"

---

### DOCUMENT 11: Monitoring, Audit & Quality Assurance
**Topics to cover:**
- Compliance monitoring program:
  - Monthly CDD file reviews (25 files/month)
  - Quarterly alert investigation quality reviews (50 cases/quarter)
  - SAR quality reviews (100% pre-filing)
  - Transaction monitoring scenario effectiveness testing (quarterly)
- Key performance indicators (KPIs):
  - Alert investigation timeliness: 88% within SLA
  - CDD file quality: 91% compliant
  - Training completion: 94%
  - SAR filing timeliness: 96% within regulatory deadline
- Internal audit function: Last AML audit 18 months ago (3 Medium findings, 1 High finding)
- High finding: Transaction monitoring rule tuning not performed consistently
- Findings remediation tracking: 2 findings still open beyond due date
- External audit: Big 4 firm, annual financial audit includes some AML testing
- Regulatory exams: Last FCA exam 2 years ago (2 Medium findings)
- Independent testing requirements (not fully met)
- Continuous improvement program: Quarterly compliance committee reviews

**Include realistic weaknesses:**
- Internal audit of AML overdue (should be annual)
- Open audit findings beyond remediation deadlines
- Limited independent testing resources
- Effectiveness testing not comprehensive
- No formal continuous improvement framework
- Limited use of data analytics for monitoring

---

### DOCUMENT 12: AI & Machine Learning Governance
**Topics to cover:**
- AI/ML use cases currently deployed:
  - Fraud detection (Sift Science - third-party)
  - Limited behavioral analytics in transaction monitoring
- AI governance framework: In development (draft policy exists)
- Model risk management: Basic framework, needs enhancement
- AI systems inventory: 2 systems catalogued
- Model validation process: Annual validation by external firm for fraud models
- Bias testing: Performed once during initial deployment
- Explainability requirements: Limited (black box models accepted for fraud)
- EU AI Act readiness: Assessment in progress, systems likely "High Risk" category
- AI vendor due diligence: Standard vendor assessment (not AI-specific)
- Data quality for AI: Standard data governance applies
- Human oversight: Fraud alerts require analyst review; transaction monitoring alerts require analyst review
- AI-related staff training: None specific to AI
- Plans to expand AI use: Considering ML for transaction monitoring enhancement

**Include realistic weaknesses:**
- No comprehensive AI governance framework in place
- Limited understanding of EU AI Act requirements
- No AI-specific risk assessment performed
- Model validation not comprehensive (only fraud models)
- No ongoing bias monitoring
- Limited explainability of AI decisions
- No AI ethics committee or review board
- Staff lack AI/ML expertise
- Vendor AI systems used as "black boxes" without deep understanding
- No formal model inventory or lifecycle management

---

## EXPECTED OUTPUTS

After generating all 12 documents above, please provide:

### 1. EXPECTED RISK SCORE ASSESSMENT

Analyze the company profile and documentation to provide an expected overall risk score (0-100 scale, where 100 = excellent compliance, 0 = critical deficiencies).

**Expected Score Range: 62-68/100 (Medium Risk)**

Provide section-by-section scores:
- Section 1 (Geographic Risk): 60-65 (outdated assessments, manual processes)
- Section 2 (Governance): 70-75 (good structure, but some gaps in oversight)
- Section 3 (Risk Assessment): 65-70 (annual EWRA, emerging risks not integrated)
- Section 4 (CDD): 65-70 (good processes, but UBO verification gaps, backlogs)
- Section 5 (Adverse Media): 55-60 (only periodic screening, backlogs)
- Section 6 (Sanctions): 75-80 (strong program, high false positives manageable)
- Section 7 (Transaction Monitoring): 60-65 (good system, tuning gaps, high alerts)
- Section 8 (Fraud): 70-75 (good tools, limited AML integration)
- Section 9 (Technology): 65-70 (good infrastructure, data silos, legacy systems)
- Section 10 (Training): 60-65 (program exists, completion gaps, generic content)
- Section 11 (Monitoring): 55-60 (audit overdue, open findings, limited testing)
- Section 12 (AI Readiness): 40-50 (limited governance, EU AI Act not ready)

### 2. EXPECTED COMPLIANCE GAPS (15-20 gaps)

List the top gaps that should be identified, categorized by:
- **CRITICAL (Severity: HIGH, Priority: HIGH)**
  1. Internal AML audit overdue (last audit 18 months ago, should be annual)
  2. Audit findings remediation overdue (2 findings past due date)
  3. Country risk assessment not updated annually (14 months since last update)
  4. Transaction monitoring rules not tuned quarterly (6 months since last tuning)
  5. UBO periodic review backlog (200 overdue reviews)

- **HIGH (Severity: HIGH, Priority: MEDIUM or Severity: MEDIUM, Priority: HIGH)**
  6. Adverse media screening only at onboarding and annual refresh (should be continuous)
  7. PEP screening only at onboarding (should be continuous)
  8. Limited AI governance framework (EU AI Act compliance gap)
  9. Data silos between fraud, AML, and KYC systems
  10. No machine learning in transaction monitoring (still rules-based)
  11. Training completion rate below target (94% vs 98% target)
  12. Alert investigation backlog (120 transaction monitoring alerts, 50 adverse media alerts)

- **MEDIUM (Severity: MEDIUM, Priority: MEDIUM)**
  13. Board compliance reporting only quarterly (best practice: monthly)
  14. Generic training content not tailored to company risk profile
  15. Limited screening of indirect beneficial owners and PEP associates
  16. Manual CDD processes for 30% of applications
  17. No specialized AI/ML training for staff
  18. Fraud and AML teams operate in silos
  19. Emerging risks (crypto, DeFi, AI) not fully integrated into EWRA
  20. High transaction monitoring false positive rate causing analyst fatigue

### 3. EXPECTED RISKS (8-12 risks)

Categorize risks by:
- **Risk Category** (Regulatory, Operational, Reputational, Financial)
- **Likelihood** (Low/Medium/High)
- **Impact** (Low/Medium/High)
- **Risk Level** (Low/Medium/High/Critical based on likelihood × impact)

Examples:
1. **Regulatory Sanctions Risk** - Category: Regulatory, Likelihood: Medium, Impact: High, Risk Level: High
   - Description: Potential for regulatory sanctions due to overdue internal audit and open remediation findings
   - Mitigation: Complete internal audit within 60 days, close all overdue remediation findings within 90 days

2. **Transaction Monitoring Ineffectiveness** - Category: Operational, Likelihood: Medium, Impact: High, Risk Level: High
   - Description: High alert volumes and lack of quarterly tuning may result in missed suspicious activity
   - Mitigation: Implement quarterly tuning process, consider ML enhancement, hire 2 additional analysts

3. **EU AI Act Non-Compliance** - Category: Regulatory, Likelihood: High, Impact: Medium, Risk Level: High
   - Description: Limited AI governance framework poses compliance risk when EU AI Act becomes effective
   - Mitigation: Develop comprehensive AI governance framework, conduct AI system categorization, implement bias testing

4. **Sanctions Screening Failure** - Category: Regulatory, Likelihood: Low, Impact: Critical, Risk Level: High
   - Description: High false positive rate (98%) may lead to alert fatigue and missed true sanctions hits
   - Mitigation: Optimize fuzzy matching thresholds, improve screening rules, implement ongoing analyst training

5. **Customer Due Diligence Gaps** - Category: Regulatory, Likelihood: Medium, Impact: Medium, Risk Level: Medium
   - Description: UBO verification backlogs and reliance on self-certification may allow illicit actors to onboard
   - Mitigation: Clear backlog, implement automated UBO verification, enhance verification procedures

6. **Reputational Damage from Compliance Failure** - Category: Reputational, Likelihood: Medium, Impact: High, Risk Level: High
   - Description: Compliance gaps if exploited could lead to media coverage and customer trust erosion
   - Mitigation: Address all HIGH priority gaps within 6 months

7. **Financial Loss from Fraud** - Category: Financial, Likelihood: Medium, Impact: Medium, Risk Level: Medium
   - Description: Limited fraud-AML integration may allow fraudulent transactions to proceed
   - Mitigation: Integrate fraud and AML platforms, create unified risk view

8. **Data Quality and Integration Risk** - Category: Operational, Likelihood: High, Impact: Medium, Risk Level: High
   - Description: Data silos and quality issues (95% completeness, 92% accuracy) may impair decision-making
   - Mitigation: Implement unified data platform, improve data quality to 99%+ standards

9. **Staff Turnover and Training Risk** - Category: Operational, Likelihood: Medium, Impact: Medium, Risk Level: Medium
   - Description: Training completion gaps and generic content may leave staff unprepared for emerging risks
   - Mitigation: Enhance training program, implement role-specific training, improve completion tracking

10. **Technology Obsolescence** - Category: Operational, Likelihood: Medium, Impact: Medium, Risk Level: Medium
    - Description: 5-year-old transaction monitoring system may lack modern capabilities
    - Mitigation: Evaluate system replacement or major upgrade, budget $500K-$1M for enhancement

---

## OUTPUT FORMAT

Please provide:

1. **12 separate document sections** (clearly labeled DOCUMENT 1, DOCUMENT 2, etc.) with realistic compliance documentation
2. **Expected overall risk score** with section-by-section breakdown
3. **Top 15-20 compliance gaps** with severity and priority
4. **8-12 risks** with category, likelihood, impact, and mitigation

Make all content realistic, specific, and detailed enough to thoroughly test an AI-powered compliance assessment system.
```

---

## HOW TO USE THIS PROMPT

1. **Copy the entire prompt above** (from "I need you to generate..." to the end)
2. **Paste into ChatGPT** (GPT-4 recommended for best quality)
3. **ChatGPT will generate**:
   - 12 detailed compliance documents (500-1000 words each)
   - Company profile
   - Expected risk scores by section
   - List of 15-20 compliance gaps
   - List of 8-12 risks with mitigations

4. **Use the output to test**:
   - Document upload and parsing functionality
   - AI analysis of uploaded documents
   - Gap identification algorithms
   - Risk scoring accuracy
   - Vendor matching against identified gaps
   - Report generation with realistic data

---

## TESTING WORKFLOW

### Step 1: Generate Mock Data
- Run the ChatGPT prompt
- Save each document as a separate text/PDF file

### Step 2: Create Test Assessment
- Log into Heliolus Platform
- Select "Financial Crime Compliance v3.0" template
- Upload the 12 generated documents

### Step 3: Verify AI Analysis
- Check if AI correctly parses each document
- Verify AI identifies the gaps listed in expected outputs
- Compare AI-generated risk scores to expected scores
- Validate that risks are properly categorized

### Step 4: Test Vendor Matching
- Check if vendor matches are appropriate for identified gaps
- Verify match scores align with gap severity/priority

### Step 5: Generate Report
- Create assessment report
- Verify all sections, gaps, and risks are properly formatted
- Check that recommendations are relevant

---

## VARIATIONS FOR ADDITIONAL TEST CASES

You can modify the prompt to create different test scenarios:

### High Maturity Company (Expected Score: 85-92)
Change: "Compliance Maturity Level: High"
- All automated systems
- Continuous monitoring
- Advanced ML/AI implementations
- Proactive compliance culture
- Recent successful regulatory exams

### Low Maturity Company (Expected Score: 35-45)
Change: "Compliance Maturity Level: Low"
- Mostly manual processes
- No transaction monitoring system
- Reactive compliance approach
- Limited staffing
- Recent regulatory enforcement actions

### Different Industry
Change: "Industry: Cryptocurrency Exchange" or "Industry: Traditional Bank"
- Adjust risk profile accordingly
- Modify relevant sections (e.g., more crypto focus, less card fraud)

### Different Geography
Change: "Geography: US-based, multi-state"
- Focus on FinCEN, OFAC, state regulations
- Adjust sanctions screening to prioritize OFAC
- Include BSA/AML requirements

---

## BENEFITS OF THIS APPROACH

✅ **Realistic Test Data**: Documents mirror actual compliance documentation
✅ **Comprehensive Coverage**: All 12 v3.0 sections covered
✅ **Known Expected Outcomes**: Can validate AI accuracy against expected gaps/scores
✅ **Repeatable**: Generate multiple companies with different profiles
✅ **End-to-End Testing**: Tests entire assessment workflow from upload to report

---

**Last Updated:** 2025-10-20
**Template Version:** v3.0
**Use Case:** System testing and AI validation
