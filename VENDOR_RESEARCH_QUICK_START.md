# Vendor Research Quick Start Card

## ⚡ 3-Minute Setup

### What You Need
- [ ] ChatGPT Plus / Claude Pro account
- [ ] List of vendors to research
- [ ] 10-15 minutes per vendor

---

## 🚀 5-Step Process

### Step 1: Copy the Prompt
```bash
Open: /VENDOR_METADATA_RESEARCH_PROMPT.md
Copy: The entire prompt (starts with "I need you to research...")
```

### Step 2: Customize
Replace these two lines:
```
**Vendor Name:** [YOUR VENDOR]
**Vendor Website:** [VENDOR URL]
```

Example:
```
**Vendor Name:** ComplyAdvantage
**Vendor Website:** https://complyadvantage.com
```

### Step 3: Run in LLM
- Paste into ChatGPT or Claude
- Wait 2-3 minutes for research
- Review YAML output

### Step 4: Validate
Check these 3 things:
- ✅ All 10 fields present
- ✅ Confidence scores provided
- ✅ Data sources listed (2-3 URLs)

### Step 5: Save
- Copy YAML output
- Paste into spreadsheet OR
- Save as `vendor-{name}.yaml`

---

## 📋 Top 20 Priority Vendors

Research these first (highest impact):

### KYC/AML (5 vendors)
1. ComplyAdvantage - https://complyadvantage.com
2. Onfido - https://onfido.com
3. Sumsub - https://sumsub.com
4. Trulioo - https://trulioo.com
5. Jumio - https://jumio.com

### Transaction Monitoring (5 vendors)
6. Chainalysis - https://chainalysis.com
7. Elliptic - https://elliptic.co
8. TRM Labs - https://trmlabs.com
9. NICE Actimize - https://niceactimize.com
10. SAS AML - https://sas.com/aml

### Sanctions Screening (4 vendors)
11. Refinitiv World-Check - https://refinitiv.com
12. Dow Jones Risk - https://dowjones.com
13. LexisNexis - https://risk.lexisnexis.com
14. Accuity - https://accuity.com

### Risk Assessment (4 vendors)
15. Moody's Analytics - https://moodysanalytics.com
16. FICO - https://fico.com
17. Quantexa - https://quantexa.com
18. Featurespace - https://featurespace.com

### Regulatory Reporting (2 vendors)
19. FIS Regulatory - https://fisglobal.com
20. Wolters Kluwer - https://wolterskluwer.com

---

## 🎯 Output Format

Your LLM will return YAML like this:

```yaml
vendor_metadata:
  vendor_name: "ComplyAdvantage"
  website: "https://complyadvantage.com"

  deployment_options: "CLOUD"
  maturity_level: "GROWTH"
  support_models: "STANDARD, PREMIUM"
  integrations: "Salesforce, ServiceNow, Workday"

  min_implementation_days: 30
  max_implementation_days: 90

  primary_category: "SANCTIONS_SCREENING"
  target_segments: "SMB, MIDMARKET, ENTERPRISE"
  geographic_coverage: "US, EU, UK, APAC, GLOBAL"
  pricing_range: "RANGE_50K_100K"

  key_features:
    - "AI-powered risk intelligence"
    - "Real-time sanctions screening"
    - "Ongoing monitoring"

  confidence_scores:
    deployment_options: 0.95
    maturity_level: 0.9
    # ... etc
```

---

## ⏱️ Time Estimate

| Task | Time |
|------|------|
| Setup (first time) | 5 min |
| Research per vendor | 10-15 min |
| Validation per vendor | 3-5 min |
| **20 vendors total** | **4-5 hours** |

---

## ✅ Quality Checklist

Before marking vendor as "complete":

- [ ] All 10 fields have values (no blank fields)
- [ ] Enums match exactly (CLOUD not "cloud", ENTERPRISE not "enterprise")
- [ ] Integrations list: 5-20 items (not 50+)
- [ ] Min implementation < Max implementation
- [ ] Confidence scores: >0.6 for critical fields
- [ ] At least 2 data sources listed
- [ ] Notes explain any uncertainties

---

## 🔥 Common Gotchas

1. **LLM uses wrong category values**
   - ❌ "Medium-sized company"
   - ✅ "MIDMARKET"
   - Fix: Check against enum list in prompt

2. **Integration list too generic**
   - ❌ "REST API, SAML, OAuth"
   - ✅ "Salesforce, Workday, ServiceNow"
   - Fix: Remove protocols, keep products

3. **Timeline unrealistic**
   - ❌ Min: 1 day, Max: 3 days (too fast)
   - ✅ Min: 30 days, Max: 90 days
   - Fix: Check against product complexity

4. **All confidence scores = 1.0**
   - ❌ Unrealistic (some data always uncertain)
   - ✅ Range from 0.6-1.0
   - Fix: Ask LLM to be more critical

---

## 💡 Pro Tips

### Batch Processing
Research 5 vendors at once:
- Open 5 browser tabs
- Paste customized prompt in each
- Process results in parallel
- **Saves time:** 1 hour → 30 min for 5 vendors

### Automation
For 50+ vendors, use API:
```javascript
// See full example in vendor-metadata-research-guide.md
for (const vendor of vendors) {
  const data = await researchVendor(vendor.name, vendor.url);
  saveToFile(data);
}
```

### Validation Shortcut
Focus on these high-risk fields:
1. Deployment options (critical for matching)
2. Maturity level (users care about this)
3. Integrations (must be accurate)
4. Pricing range (users sensitive to cost)

---

## 📊 Spreadsheet Template

| Vendor Name | Deployment | Maturity | Support | Integrations | Min Days | Max Days | Category | Segments | Geography | Pricing | Status |
|-------------|------------|----------|---------|--------------|----------|----------|----------|----------|-----------|---------|--------|
| ComplyAdvantage | CLOUD | GROWTH | STANDARD, PREMIUM | Salesforce, ServiceNow | 30 | 90 | SANCTIONS_SCREENING | SMB, MIDMARKET | US, EU, UK, GLOBAL | RANGE_50K_100K | ✅ Done |

---

## 🆘 Need Help?

**Question** | **Answer**
--- | ---
Where's the full prompt? | `/VENDOR_METADATA_RESEARCH_PROMPT.md`
How do I validate output? | See confidence scores + manual spot-check
What if vendor has no pricing? | Estimate based on competitors, note low confidence
Vendor has multiple products? | Focus on flagship product, note in "notes"
Can I use free ChatGPT? | Yes, but GPT-4 (paid) gives better accuracy

---

## 📈 Success Metrics

After you've researched 20 vendors:
- ✅ 20 YAML files saved
- ✅ All fields validated
- ✅ Average confidence >0.75
- ✅ Ready for CSV import

**Next step:** Import to database (see Story 1.27.1 implementation)

---

## 🎯 Goal

**Improve vendor matching precision: 70% → 95%**

By adding structured metadata, users get better vendor recommendations, leading to:
- +15% more users contact top matches
- +20% more users use match filtering
- +20% improvement in user-reported relevance

---

**Ready to start? Open the prompt and research your first vendor!**

📄 Full Prompt: `/VENDOR_METADATA_RESEARCH_PROMPT.md`
📖 Detailed Guide: `/docs/vendor-metadata-research-guide.md`
📋 Implementation Story: `/docs/stories/1.27.1.vendor-metadata-enhancement.md`

---

*Last Updated: October 15, 2025*
