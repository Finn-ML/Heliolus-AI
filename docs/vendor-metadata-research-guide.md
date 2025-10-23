# Vendor Metadata Research Guide

## Quick Start

This guide explains how to use the LLM research prompt to gather vendor metadata for Story 1.27.1 implementation.

---

## What You'll Need

1. **LLM Access:** ChatGPT Plus, Claude Pro, or API access (OpenAI/Anthropic)
2. **Vendor List:** Names and websites of compliance vendors to research
3. **Time:** 10-15 minutes per vendor (with LLM assistance)

---

## Step-by-Step Instructions

### Step 1: Get the Research Prompt

The complete research prompt is in: `/VENDOR_METADATA_RESEARCH_PROMPT.md`

This prompt contains:
- Detailed instructions for 10 metadata fields
- Output format specification (YAML)
- Quality guidelines and validation checklist
- Example output for reference

### Step 2: Prepare Your Vendor List

Create a spreadsheet with vendors to research:

| Vendor Name | Website | Priority | Status |
|-------------|---------|----------|--------|
| ComplyAdvantage | https://complyadvantage.com | High | Pending |
| Chainalysis | https://chainalysis.com | High | Pending |
| Elliptic | https://elliptic.co | Medium | Pending |

**Priority Levels:**
- **High:** Top 20 vendors by market share, featured in strategy matrix
- **Medium:** Vendors with 5+ client matches in system
- **Low:** Long-tail vendors, niche solutions

### Step 3: Run Research for Each Vendor

**For each vendor:**

1. Open your LLM interface (ChatGPT, Claude, etc.)
2. Copy the entire research prompt from `VENDOR_METADATA_RESEARCH_PROMPT.md`
3. Replace these placeholders:
   - `[INSERT VENDOR NAME]` → e.g., "ComplyAdvantage"
   - `[INSERT VENDOR URL]` → e.g., "https://complyadvantage.com"
4. Paste into LLM and submit
5. Review the YAML output

**Example:**
```
I need you to research a compliance/financial crime prevention vendor and extract specific metadata fields.

**Vendor Name:** ComplyAdvantage
**Vendor Website:** https://complyadvantage.com

[... rest of prompt ...]
```

### Step 4: Validate the Output

Check the LLM's response for:

✅ **Completeness:** All 10 fields present
✅ **Format:** Valid YAML structure
✅ **Enums:** Only uses specified category values (e.g., "CLOUD" not "Cloud-based")
✅ **Confidence:** Review fields with confidence <0.6
✅ **Sources:** At least 2-3 URLs listed

**Example of good output:**
```yaml
vendor_metadata:
  vendor_name: "ComplyAdvantage"
  deployment_options: "CLOUD"
  maturity_level: "GROWTH"
  # ... all fields present
  confidence_scores:
    deployment_options: 0.95  # High confidence
```

**Red flags:**
- Custom category values not in the prompt (e.g., "Medium-sized" instead of "MIDMARKET")
- Missing fields or "N/A" values
- Confidence scores all 1.0 (unrealistic - some data always uncertain)
- No data sources listed

### Step 5: Save and Track Results

**Option A: Spreadsheet (Recommended for <20 vendors)**

1. Copy output to a Google Sheet/Excel
2. Convert YAML to columns:
   - Column A: Vendor Name
   - Column B: Deployment Options
   - Column C: Maturity Level
   - ... etc.
3. Track status: "Researched", "Validated", "Imported"

**Option B: YAML Files (Recommended for 20+ vendors)**

1. Save each vendor's output as: `vendor-metadata-{vendorname}.yaml`
2. Store in: `/data/vendor-research/`
3. Use script to aggregate all YAML → CSV

**Option C: Direct Database Import (Advanced)**

1. Use API to automate research (see "Automation" section below)
2. Parse YAML output programmatically
3. Insert directly into database via Prisma

### Step 6: Manual Review & Correction

**For each vendor, review:**

1. **Integrations list:** Remove generic items like "REST API", standardize names
2. **Implementation timeline:** Sanity check (Min < Max, realistic for product type)
3. **Pricing range:** Cross-reference with case studies or industry reports
4. **Target segments:** Should align with client logos shown on website

**Common corrections:**
- "Salesforce CRM" → "Salesforce"
- "MS Teams" → "Microsoft Teams"
- "SAML, OAuth, REST API" → Remove (too generic)
- Maturity level "STARTUP" but founded 2005 → Should be "ENTERPRISE" or "GROWTH"

### Step 7: Import to Database

Once validated, import vendor data:

**Option 1: CSV Import Script**
```bash
# Convert YAML/Excel to CSV
# Format: vendor_name,deployment_options,maturity_level,...

cd backend
npm run import-vendors-csv -- --file /path/to/vendor-metadata.csv
```

**Option 2: Admin UI Manual Entry**
1. Log in to admin dashboard
2. Navigate to Vendor Management
3. Click "Add Vendor" or "Edit Vendor"
4. Fill in new metadata fields from research output

**Option 3: Prisma Script (Bulk Update)**
```bash
cd backend
npm run update-vendor-metadata -- --source /path/to/vendor-research/
```

---

## Automation (For 50+ Vendors)

### Using OpenAI API

```javascript
// Example Node.js script
const OpenAI = require('openai');
const fs = require('fs');
const yaml = require('js-yaml');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function researchVendor(vendorName, vendorUrl) {
  const prompt = fs.readFileSync('VENDOR_METADATA_RESEARCH_PROMPT.md', 'utf8')
    .replace('[INSERT VENDOR NAME]', vendorName)
    .replace('[INSERT VENDOR URL]', vendorUrl);

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3, // Lower temp for consistency
  });

  const yamlOutput = response.choices[0].message.content;
  const metadata = yaml.load(yamlOutput);

  return metadata;
}

// Batch process
const vendors = [
  { name: 'ComplyAdvantage', url: 'https://complyadvantage.com' },
  { name: 'Chainalysis', url: 'https://chainalysis.com' },
  // ... more vendors
];

for (const vendor of vendors) {
  const metadata = await researchVendor(vendor.name, vendor.url);
  fs.writeFileSync(
    `./data/vendor-research/vendor-metadata-${vendor.name}.yaml`,
    yaml.dump(metadata)
  );
  console.log(`✅ Researched: ${vendor.name}`);

  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 sec delay
}
```

### Using Anthropic Claude API

```javascript
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function researchVendor(vendorName, vendorUrl) {
  const prompt = fs.readFileSync('VENDOR_METADATA_RESEARCH_PROMPT.md', 'utf8')
    .replace('[INSERT VENDOR NAME]', vendorName)
    .replace('[INSERT VENDOR URL]', vendorUrl);

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const yamlOutput = message.content[0].text;
  return yaml.load(yamlOutput);
}
```

---

## Recommended Vendor Research Priority

### Phase 1: Top 20 Vendors (Week 1)
Focus on vendors most commonly matched in strategy matrix:

**KYC/AML:**
1. ComplyAdvantage
2. Onfido
3. Sumsub
4. Trulioo
5. Jumio

**Transaction Monitoring:**
6. Chainalysis
7. Elliptic
8. TRM Labs
9. NICE Actimize
10. SAS Anti-Money Laundering

**Sanctions Screening:**
11. Refinitiv World-Check
12. Dow Jones Risk & Compliance
13. LexisNexis RiskNarrative
14. ComplyAdvantage (overlap with KYC)

**Risk Assessment:**
15. Moody's Analytics
16. FICO Falcon Platform
17. Quantexa
18. Featurespace

**Regulatory Reporting:**
19. FIS Regulatory Intelligence
20. Wolters Kluwer OneSumX

### Phase 2: Mid-Tier Vendors (Week 2)
Vendors with 3-5 client matches, growing market presence

### Phase 3: Niche/Emerging Vendors (Week 3)
Startups, regional vendors, specialized solutions

---

## Quality Assurance Checklist

Before marking a vendor as "Complete", verify:

- [ ] All 10 metadata fields populated
- [ ] Deployment options use only specified enums
- [ ] Maturity level aligned with company age and client profile
- [ ] Support models realistic (not all vendors offer PREMIUM)
- [ ] Integrations list has 5-20 items (not exhaustive, focus on major)
- [ ] Implementation timeline: Min < Max, realistic for product type
- [ ] Primary category matches vendor's main offering
- [ ] Target segments aligned with pricing and client logos
- [ ] Geographic coverage matches office locations or regulatory docs
- [ ] Pricing range estimate has >0.5 confidence or manual verification
- [ ] Confidence scores provided for all fields
- [ ] At least 2 data sources listed
- [ ] Notes explain any assumptions or data gaps

---

## Common Issues & Solutions

### Issue: LLM hallucinates data
**Solution:** Check confidence scores. If >0.8, manually verify source URLs. If source doesn't support claim, reduce confidence or remove data point.

### Issue: Vendor has multiple products
**Solution:** Focus on flagship compliance product. Note in "notes" field if vendor is multi-product platform.

### Issue: Integration list too long (30+ items)
**Solution:** Prioritize. Include top 10-15 most common integrations (Salesforce, ServiceNow, major ERPs). Full list can be in vendor profile but not needed for matching.

### Issue: Implementation timeline varies widely
**Solution:** Use ranges. Min = fastest (SaaS, small org, simple use case). Max = typical (enterprise, complex use case, on-premise).

### Issue: Pricing not disclosed
**Solution:** Estimate based on:
- Competitor pricing (similar products)
- Target market (SMB = lower, Enterprise = higher)
- Product complexity (simple screening = lower, full platform = higher)
- Note low confidence (<0.6) and mark for manual review

### Issue: Vendor acquired or merged
**Solution:** Research parent company. Use parent's data if product still exists under new brand. Note acquisition in "notes" field.

---

## Example Workflow (Single Vendor)

**Time estimate: 12 minutes**

1. **Minute 0-1:** Copy prompt, insert vendor name/URL, paste into LLM
2. **Minute 1-5:** LLM researches and generates output
3. **Minute 5-7:** Review YAML output, check completeness
4. **Minute 7-10:** Manually verify 2-3 data points (spot check)
5. **Minute 10-12:** Copy to spreadsheet or save YAML file
6. **Mark vendor as "Researched"**

**For 20 vendors:** ~4-5 hours (with breaks)

---

## Tools & Resources

**LLM Interfaces:**
- ChatGPT Plus: https://chat.openai.com (GPT-4)
- Claude Pro: https://claude.ai (Claude 3.5 Sonnet)
- Google AI Studio: https://aistudio.google.com (Gemini Pro)

**Data Validation:**
- YAML Validator: https://www.yamllint.com
- JSON to CSV Converter: https://www.convertcsv.com/json-to-csv.htm

**Vendor Directories (for finding vendors):**
- G2 Compliance Software: https://www.g2.com/categories/compliance
- Gartner Magic Quadrant for Financial Crime & Fraud Management
- Forrester Wave: AML/KYC Solutions

**Industry Research:**
- Fintech Times - Compliance vendor news
- RegTech Analyst - Vendor reviews and comparisons
- LinkedIn - Vendor company pages (employees, funding, clients)

---

## Next Steps After Research

1. **Import to Database:** Use CSV import script or admin UI
2. **Update Matching Service:** Deploy Story 1.27.1 backend changes
3. **Test Matching:** Run vendor matching on existing assessments
4. **Monitor Metrics:** Track match score improvements (target: 70% avg → 85% avg)
5. **Iterate:** Refine vendor data based on user feedback (vendors contacted, matches dismissed)

---

## Questions?

- Review `/VENDOR_METADATA_RESEARCH_PROMPT.md` for detailed field definitions
- Check Story 1.27.1 for schema details and implementation plan
- Contact platform admin for database access or CSV import issues

---

**Last Updated:** October 15, 2025
**Related Files:**
- `/VENDOR_METADATA_RESEARCH_PROMPT.md` - Full LLM research prompt
- `/docs/stories/1.27.1.vendor-metadata-enhancement.md` - Implementation story
- `/backend/scripts/import-vendors-csv.ts` - CSV import script (to be created)
