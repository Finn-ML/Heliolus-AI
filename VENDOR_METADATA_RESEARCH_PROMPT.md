# Vendor Metadata Research Prompt for LLM Analysis

## Overview

This prompt is designed to gather comprehensive vendor metadata for compliance and financial crime prevention solution providers. Use this prompt with an LLM (GPT-4, Claude, etc.) to systematically research vendor capabilities across 7 key dimensions.

---

## Research Prompt Template

```
I need you to research a compliance/financial crime prevention vendor and extract specific metadata fields.

**Vendor Name:** [INSERT VENDOR NAME]
**Vendor Website:** [INSERT VENDOR URL]

Please analyze the vendor's website, product documentation, case studies, and any publicly available information to provide the following data points:

---

### 1. DEPLOYMENT OPTIONS
Identify all deployment models this vendor supports. Respond with a comma-separated list using ONLY these values:
- CLOUD (SaaS, cloud-hosted)
- ON_PREMISE (self-hosted, on-premises installation)
- HYBRID (combination of cloud and on-premise)
- MANAGED_SERVICE (vendor manages infrastructure for customer)

**Output Format:** `Deployment Options: CLOUD, HYBRID`

**Research Sources:**
- Product pages mentioning "deployment", "hosting", "infrastructure"
- Technical documentation about installation options
- Case studies showing different deployment scenarios

---

### 2. VENDOR MATURITY LEVEL
Classify this vendor's maturity stage based on company age, client portfolio, and market presence. Choose ONE:
- ENTERPRISE: Established vendor (typically 10+ years in business, Fortune 500/FTSE 100 clients, global presence, proven track record)
- GROWTH: Mid-stage vendor (typically 3-10 years, growing client base, regional/multi-regional presence, expanding product line)
- STARTUP: Early-stage vendor (typically <3 years, innovative technology, smaller client base, venture-backed, emerging market)

**Output Format:** `Maturity Level: ENTERPRISE`

**Research Sources:**
- About/Company page (founding date, history)
- Client logos and case studies (size and profile of clients)
- News/Press releases (funding rounds, milestones)
- Leadership team profiles (experience and pedigree)

**Decision Criteria:**
- ENTERPRISE: 10+ years, Fortune 500 clients, $100M+ revenue, global offices
- GROWTH: 3-10 years, mid-market clients, $10M-$100M revenue, multiple offices
- STARTUP: <3 years, early adopters, <$10M revenue, venture-backed

---

### 3. SUPPORT MODELS
Identify all customer support tiers this vendor offers. Respond with a comma-separated list using these values:
- SELF_SERVICE (knowledge base, documentation, community forums only)
- STANDARD (email support, ticketing system, business hours coverage)
- PREMIUM (24/7 support, dedicated account manager, phone/chat support, SLA guarantees)

**Output Format:** `Support Models: STANDARD, PREMIUM`

**Research Sources:**
- Pricing/Plans page (support levels per tier)
- Support/Contact page (available channels)
- Documentation on SLAs and response times
- Customer success or account management offerings

---

### 4. INTEGRATIONS (Structured List)
List all third-party systems, platforms, and tools this vendor integrates with. Focus on:
- Core business systems (ERP: SAP, Oracle, Workday)
- CRM platforms (Salesforce, Microsoft Dynamics)
- Identity providers (Okta, Azure AD, Auth0)
- Data platforms (Snowflake, Databricks, AWS S3)
- Workflow tools (ServiceNow, Jira)
- Compliance platforms (OneTrust, TrustArc)
- Payment processors (Stripe, PayPal, Adyen)
- Communication tools (Slack, Microsoft Teams)

**Output Format:** `Integrations: Salesforce, ServiceNow, Workday, Okta, Snowflake, AWS S3`

**Research Sources:**
- Integrations/Partners page
- Product documentation (APIs, connectors, webhooks)
- Marketplace listings (Salesforce AppExchange, Microsoft AppSource)
- Case studies mentioning integrated systems

**Quality Guidelines:**
- Use official/canonical names (e.g., "Salesforce" not "SFDC")
- Separate each integration with a comma
- Include 5-20 integrations (focus on most common/important)
- Exclude generic protocols (REST API, SAML) unless no specific integrations listed

---

### 5. IMPLEMENTATION TIMELINE (Min/Max Days)
Estimate the typical implementation timeline range based on vendor documentation and case studies.

**Output Format:**
```
Min Implementation (Days): 30
Max Implementation (Days): 180
```

**Research Sources:**
- Implementation/Onboarding pages
- Case studies with timeline details
- Sales materials mentioning "time to value"
- Demo videos or product tours showing setup complexity

**Estimation Guidelines:**
- **Min Days:** Fastest possible implementation (simple use case, small organization, SaaS deployment)
  - SaaS products: 7-30 days
  - On-premise products: 30-60 days
  - Enterprise platforms: 60-90 days

- **Max Days:** Typical full implementation (complex use case, enterprise organization, customization)
  - SaaS products: 30-90 days
  - On-premise products: 90-180 days
  - Enterprise platforms: 180-365 days

**If no data found:** Use industry benchmarks based on product category:
- KYC/AML: 60-120 days
- Transaction Monitoring: 90-180 days
- Sanctions Screening: 30-90 days
- Risk Assessment: 60-150 days

---

### 6. PRIMARY PRODUCT CATEGORY
Identify the vendor's primary compliance solution category. Choose ONE from:
- KYC_AML (Know Your Customer, Anti-Money Laundering)
- TRANSACTION_MONITORING (Real-time transaction surveillance)
- SANCTIONS_SCREENING (Watchlist screening, PEP checks)
- TRADE_SURVEILLANCE (Market abuse detection, trade monitoring)
- RISK_ASSESSMENT (Enterprise risk management, compliance risk)
- COMPLIANCE_TRAINING (Employee training, compliance education)
- REGULATORY_REPORTING (Automated reporting, regulatory filings)
- DATA_GOVERNANCE (Data quality, privacy compliance, data lineage)

**Output Format:** `Primary Category: TRANSACTION_MONITORING`

**Research Sources:**
- Product/Solutions page (main offering)
- Homepage headline/tagline
- Company description in About page

---

### 7. TARGET COMPANY SIZES (Segments)
Identify which company size segments this vendor primarily targets. Respond with a comma-separated list:
- STARTUP (1-50 employees)
- SMB (51-500 employees)
- MIDMARKET (501-5,000 employees)
- ENTERPRISE (5,000+ employees)

**Output Format:** `Target Segments: MIDMARKET, ENTERPRISE`

**Research Sources:**
- Client logos and case studies (size of featured clients)
- Pricing page (entry-level pricing indicates target market)
- Sales materials mentioning "ideal customer profile"
- Product complexity (simple = SMB, complex = Enterprise)

**Decision Criteria:**
- STARTUP: Free tier, <$1K/month pricing, self-service onboarding
- SMB: $1K-$10K/month, limited customization, fast setup
- MIDMARKET: $10K-$50K/month, moderate customization, dedicated support
- ENTERPRISE: $50K+/month, extensive customization, enterprise SLAs

---

### 8. GEOGRAPHIC COVERAGE
Identify which jurisdictions/regions this vendor has regulatory expertise and operational presence in. Respond with a comma-separated list:
- US (United States - FinCEN, OFAC, Federal Reserve)
- EU (European Union - EBA, ESMA, EU AML Directives)
- UK (United Kingdom - FCA, PRA)
- APAC (Asia-Pacific - MAS, HKMA, AUSTRAC)
- MENA (Middle East & North Africa)
- LATAM (Latin America)
- GLOBAL (Worldwide coverage, multi-jurisdictional)

**Output Format:** `Geographic Coverage: US, EU, UK, GLOBAL`

**Research Sources:**
- Regulatory compliance page (supported regulations)
- Office locations page (regional presence)
- Case studies by geography
- Product documentation (jurisdiction-specific features)

**Decision Criteria:**
- Include GLOBAL if vendor explicitly states worldwide coverage or supports 10+ countries
- Include specific regions if vendor has offices or clients in that region
- Check for jurisdiction-specific features (e.g., "FCA reporting module" → UK)

---

### 9. PRICING RANGE (Estimated Annual Cost)
Estimate the typical annual cost range for a mid-market company (500-1000 employees). Choose ONE:
- UNDER_50K: Under €50,000/year
- RANGE_50K_100K: €50,000 - €100,000/year
- RANGE_100K_250K: €100,000 - €250,000/year
- RANGE_250K_500K: €250,000 - €500,000/year
- OVER_500K: Over €500,000/year

**Output Format:** `Pricing Range: RANGE_100K_250K`

**Research Sources:**
- Pricing page (if available)
- Case studies mentioning investment/budget
- Industry reports with vendor pricing benchmarks
- Sales materials with indicative pricing

**If pricing not disclosed:** Estimate based on:
- Product complexity (simple = lower, complex = higher)
- Target market (SMB = lower, Enterprise = higher)
- Deployment model (SaaS = lower, On-premise = higher)

---

### 10. KEY FEATURES (Product Capabilities)
List 5-10 key features or capabilities that differentiate this vendor. Focus on:
- Technical capabilities (AI/ML, real-time processing, automation)
- Compliance features (risk scoring, case management, reporting)
- User experience (dashboards, alerts, workflows)
- Integration capabilities (APIs, connectors, data import/export)

**Output Format:**
```
Key Features:
- AI-powered risk scoring
- Real-time transaction monitoring
- Automated case management
- Customizable compliance dashboards
- RESTful API for integrations
- Role-based access control
- Audit trail and reporting
```

**Research Sources:**
- Features/Capabilities page
- Product demo videos
- Technical documentation
- Datasheets and product briefs

---

### OUTPUT FORMAT

Please provide your findings in this structured format:

```yaml
vendor_metadata:
  vendor_name: "[Vendor Name]"
  website: "[Vendor URL]"

  deployment_options: "CLOUD, HYBRID"
  maturity_level: "ENTERPRISE"
  support_models: "STANDARD, PREMIUM"
  integrations: "Salesforce, ServiceNow, Workday, Okta, Snowflake, AWS S3, Microsoft Teams"

  min_implementation_days: 60
  max_implementation_days: 180

  primary_category: "TRANSACTION_MONITORING"
  target_segments: "MIDMARKET, ENTERPRISE"
  geographic_coverage: "US, EU, UK, GLOBAL"
  pricing_range: "RANGE_100K_250K"

  key_features:
    - "AI-powered risk scoring"
    - "Real-time transaction monitoring"
    - "Automated case management"
    - "Customizable compliance dashboards"
    - "RESTful API for integrations"
    - "Role-based access control"
    - "Audit trail and reporting"

  confidence_scores:
    deployment_options: 0.9  # 0.0-1.0 (how confident are you in this data?)
    maturity_level: 0.95
    support_models: 0.85
    integrations: 0.9
    implementation_timeline: 0.7
    pricing_range: 0.6

  data_sources:
    - "https://vendor.com/products"
    - "https://vendor.com/case-studies"
    - "https://vendor.com/pricing"

  notes: "Optional notes about data quality, assumptions, or areas of uncertainty"
```

---

### RESEARCH QUALITY CHECKLIST

Before submitting your findings, verify:
- [ ] Visited vendor's official website (not third-party reviews)
- [ ] Checked at least 3 pages: Products, About, Pricing/Contact
- [ ] Used ONLY the specified enum values (no custom categories)
- [ ] Provided confidence scores (0.0-1.0) for each data point
- [ ] Listed specific data sources (URLs) used
- [ ] Noted any assumptions or gaps in available data
- [ ] Formatted integrations as comma-separated canonical names
- [ ] Estimated timelines are realistic for the product type
- [ ] Target segments align with pricing and client logos shown

---

### EDGE CASES & SPECIAL INSTRUCTIONS

**If vendor has multiple products:**
- Focus on their flagship/primary compliance product
- Note in "notes" field if vendor has multiple product lines

**If vendor is a platform/marketplace:**
- Classify based on their core offering (not partner solutions)
- Note in "notes" field if vendor is a platform aggregator

**If data is not available:**
- Mark confidence score as <0.5
- Note in "notes" field: "Data not publicly available"
- Provide best estimate based on product category benchmarks

**If vendor is acquired/merged:**
- Use parent company's data if product still exists
- Note acquisition in "notes" field with date

**If website is not in English:**
- Use translation tools
- Note language limitation in "notes" field

---

### EXAMPLE OUTPUT

```yaml
vendor_metadata:
  vendor_name: "ComplyAdvantage"
  website: "https://complyadvantage.com"

  deployment_options: "CLOUD"
  maturity_level: "GROWTH"
  support_models: "STANDARD, PREMIUM"
  integrations: "Salesforce, ServiceNow, Microsoft Dynamics, Workday, Sumsub, Onfido, Stripe, PayPal"

  min_implementation_days: 30
  max_implementation_days: 90

  primary_category: "SANCTIONS_SCREENING"
  target_segments: "SMB, MIDMARKET, ENTERPRISE"
  geographic_coverage: "US, EU, UK, APAC, GLOBAL"
  pricing_range: "RANGE_50K_100K"

  key_features:
    - "AI-powered risk intelligence"
    - "Real-time sanctions and PEP screening"
    - "Dynamic risk scoring"
    - "Ongoing monitoring and alerts"
    - "RESTful API and webhooks"
    - "Case management workflow"
    - "Regulatory reporting templates"
    - "Adverse media screening"

  confidence_scores:
    deployment_options: 1.0
    maturity_level: 0.95
    support_models: 0.9
    integrations: 0.95
    implementation_timeline: 0.8
    pricing_range: 0.7

  data_sources:
    - "https://complyadvantage.com/solutions/"
    - "https://complyadvantage.com/about/"
    - "https://complyadvantage.com/customers/"
    - "https://complyadvantage.com/integrations/"

  notes: "Pricing not publicly disclosed - estimate based on competitor analysis and customer testimonials mentioning 'cost-effective for mid-market'. Founded 2014 (11 years) with 200+ employees per LinkedIn."
```

---

## POST-RESEARCH VALIDATION

After receiving LLM output, validate the data:

1. **Enum Validation:** Confirm all categorical fields use only specified values
2. **Completeness Check:** All required fields have values
3. **Confidence Review:** Flag any fields with confidence <0.6 for manual review
4. **Integration Cleanup:** Standardize integration names (remove duplicates, fix typos)
5. **Timeline Sanity Check:** Min < Max, values realistic for product category
6. **Source Verification:** Spot-check 1-2 data sources to confirm accuracy

---

## BATCH RESEARCH INSTRUCTIONS

To research multiple vendors efficiently:

1. **Create a CSV list of vendors:**
   ```
   Vendor Name,Website URL
   ComplyAdvantage,https://complyadvantage.com
   Chainalysis,https://chainalysis.com
   Elliptic,https://elliptic.co
   ```

2. **Run research prompt for each vendor** (can be done in parallel with multiple LLM instances)

3. **Aggregate results into CSV:**
   ```
   Vendor Name,Deployment Options,Maturity Level,Support Models,Integrations,...
   ```

4. **Import CSV into database** using the updated vendor import script

---

## NOTES FOR HUMAN REVIEWERS

- **Average research time per vendor:** 10-15 minutes (with LLM assistance)
- **Recommended batch size:** 10-20 vendors per session
- **Priority vendors:** Start with top 20 vendors by market share in financial crime prevention
- **Data refresh cadence:** Update vendor metadata quarterly (vendor capabilities evolve)

---

## QUESTIONS OR ISSUES?

If you encounter vendors that don't fit the schema:
- Document the edge case in "notes" field
- Flag for platform admin review
- Consider if new categories/enums are needed

---

**Last Updated:** October 15, 2025
**Version:** 1.0
**Maintained By:** Heliolus Platform Team
```

---

## How to Use This Prompt

### Option 1: Single Vendor Research
1. Copy the entire prompt above (from "I need you to research..." to the end of the output format)
2. Replace `[INSERT VENDOR NAME]` and `[INSERT VENDOR URL]`
3. Paste into ChatGPT, Claude, or your preferred LLM
4. Review the YAML output and validate confidence scores

### Option 2: Batch Research (Recommended)
1. Create a list of vendors in a spreadsheet
2. For each vendor, generate a custom prompt using the template
3. Use API access to automate research (OpenAI API, Anthropic API)
4. Aggregate results into CSV
5. Use CSV import script to bulk-upload vendor metadata

### Option 3: Human-Assisted Research
1. Use the prompt as a checklist for manual research
2. Fill in a Google Sheet/Excel template with the same fields
3. Export to CSV and import to database

---

## Expected Output Quality

- **High confidence (0.8-1.0):** Data explicitly stated on vendor website
- **Medium confidence (0.6-0.8):** Data inferred from product descriptions, case studies
- **Low confidence (<0.6):** Data estimated based on industry benchmarks, requires manual review

---

## Integration with Story 1.27.1

This research prompt aligns with Story 1.27.1's schema enhancements:
- All fields map directly to new Prisma schema fields
- Output format (YAML) can be converted to CSV for import
- Confidence scores help identify which vendors need manual data verification
- Structured format enables automated validation and data quality checks
