# Trade Compliance Assessment Template v3.0 - Complete Specification

**Version:** 3.0
**Date:** 2025-10-21
**Status:** COMPLETE ✅ (Deduplicated)
**Template Slug:** `trade-compliance-assessment-v3`
**Category:** TRADE_COMPLIANCE
**Estimated Time:** 105 minutes
**Total Questions:** 105 across 10 sections (deduplicated from initial 120)
**Foundational Questions:** 33 (31.4%)

---

## Overview

This comprehensive trade compliance assessment evaluates an organization's international trade compliance program across ten critical domains, from governance and risk management to AI readiness. The v3.0 template represents a 4.2× expansion from v2.0 (25→105 questions), covering regulatory requirements from OFAC, BIS, ITAR, EU Customs, WCO Framework, and emerging AI regulations.

**Deduplication Note:** An overlap analysis identified and removed 15 critical duplicate questions, reducing the template from 120 to 105 questions while maintaining full regulatory coverage. See `TRADE_COMPLIANCE_V3_DEDUPLICATION_SUMMARY.md` for details.

---

## Section 1: Governance & Regulatory Readiness (9 questions)

**Weight:** 0.14 (14%)
**Regulatory Priority:** WCO Framework, OFAC/BIS/ITAR, EU Customs Code
**Description:** Foundation of the trade compliance program including organizational structure, policies, and oversight

### Question 1.1 ⭐ FOUNDATIONAL
**Question:** Is there a Trade Compliance Officer or equivalent role?
**Type:** SELECT
**Weight:** 2.0 (normalized: ~0.13)
**Required:** Yes
**Options:**
- Yes - dedicated full-time Trade Compliance Officer
- Yes - part-time designated officer with trade compliance focus
- General compliance officer handling trade compliance
- Senior management member
- External consultant
- No designated officer

**Help Text:** The Trade Compliance Officer should have appropriate authority, resources, and direct access to senior management

**AI Prompt Hint:** Assess the appropriateness of TCO designation considering organizational size, trade complexity, and regulatory requirements. Evaluate independence, authority level, and adequacy of resources.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - dedicated full-time Trade Compliance Officer": 5,
    "Yes - part-time designated officer with trade compliance focus": 4,
    "General compliance officer handling trade compliance": 3,
    "Senior management member": 3,
    "External consultant": 2,
    "No designated officer": 1
  }
}
```

**Tags:** governance, tco, organization, foundational

---

### Question 1.2 ⭐ FOUNDATIONAL
**Question:** Are responsibilities defined across logistics, finance, and compliance teams?
**Type:** SELECT
**Weight:** 2.0 (normalized: ~0.13)
**Required:** Yes
**Options:**
- Yes - comprehensive RACI matrix with clear ownership
- Yes - responsibilities documented but some gaps
- Partially defined - informal understanding
- No - responsibilities unclear or overlapping
- Not applicable - single person/team handles all

**Help Text:** Clear role definition prevents compliance gaps and ensures accountability across cross-functional teams

**AI Prompt Hint:** Evaluate the clarity and comprehensiveness of role definitions across trade compliance functions. Look for formal documentation, training on responsibilities, and accountability mechanisms.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive RACI matrix with clear ownership": 5,
    "Yes - responsibilities documented but some gaps": 4,
    "Partially defined - informal understanding": 2,
    "No - responsibilities unclear or overlapping": 1,
    "Not applicable - single person/team handles all": 3
  }
}
```

**Tags:** governance, organization, roles, foundational

---

### Question 1.3 ⭐ FOUNDATIONAL
**Question:** Are trade compliance policies aligned with applicable regimes (EU, OFAC, BIS, ITAR, UN)?
**Type:** MULTISELECT
**Weight:** 2.0 (normalized: ~0.13)
**Required:** Yes
**Options:**
- EU Customs Code and regulations
- OFAC sanctions regulations
- BIS Export Administration Regulations (EAR)
- ITAR (International Traffic in Arms Regulations)
- UN Security Council sanctions
- WCO Framework of Standards
- Local/national customs regulations
- No formal policy alignment
- Unsure/need assessment

**Help Text:** Select all regulatory regimes that apply to your trade operations. Policies should explicitly reference and align with these frameworks.

**AI Prompt Hint:** Assess the comprehensiveness of policy alignment with applicable trade regulations. Look for explicit references to regulatory requirements, regular policy updates to reflect regulatory changes, and coverage of all applicable regimes.

**Scoring Rules:**
```json
{
  "scale": 5,
  "countBased": true,
  "penalties": {
    "No formal policy alignment": -3,
    "Unsure/need assessment": -2
  },
  "ranges": {
    "1-2": 2,
    "3-4": 3,
    "5-6": 4,
    "7+": 5
  }
}
```

**Tags:** governance, policy, regulatory-alignment, foundational

---

### Question 1.4 ⭐ FOUNDATIONAL
**Question:** Are regulatory changes monitored and implemented promptly?
**Type:** SELECT
**Weight:** 1.5 (normalized: ~0.10)
**Required:** Yes
**Options:**
- Yes - formal monitoring with documented implementation process
- Yes - monitoring in place but informal implementation
- Partially - ad hoc monitoring only
- No - reactive to enforcement/violations only
- Unsure/no process

**Help Text:** Trade regulations change frequently. Effective monitoring and timely implementation are critical for ongoing compliance.

**AI Prompt Hint:** Evaluate the regulatory change management process. Look for systematic monitoring (subscriptions, alerts, trade associations), documented review processes, timely implementation procedures, and communication to affected staff.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - formal monitoring with documented implementation process": 5,
    "Yes - monitoring in place but informal implementation": 3,
    "Partially - ad hoc monitoring only": 2,
    "No - reactive to enforcement/violations only": 1,
    "Unsure/no process": 1
  }
}
```

**Tags:** governance, regulatory-monitoring, change-management, foundational

---

### Question 1.5
**Question:** Are compliance clauses included in contracts with freight forwarders and agents?
**Type:** SELECT
**Weight:** 1.0 (normalized: ~0.07)
**Required:** Yes
**Options:**
- Yes - comprehensive compliance clauses in all contracts
- Yes - basic clauses in most contracts
- Partially - some contracts only
- No - no compliance clauses
- Not applicable - no use of freight forwarders/agents

**Help Text:** Contractual compliance clauses ensure third parties understand and commit to meeting regulatory requirements

**AI Prompt Hint:** Assess the adequacy of contractual compliance provisions with third-party service providers. Look for specific obligations, audit rights, indemnification, and termination provisions for non-compliance.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive compliance clauses in all contracts": 5,
    "Yes - basic clauses in most contracts": 4,
    "Partially - some contracts only": 2,
    "No - no compliance clauses": 1,
    "Not applicable - no use of freight forwarders/agents": 5
  }
}
```

**Tags:** governance, contracts, third-party

---

### Question 1.6
**Question:** Are escalation procedures established for potential violations?
**Type:** SELECT
**Weight:** 1.0 (normalized: ~0.07)
**Required:** Yes
**Options:**
- Yes - documented escalation paths with clear timelines
- Yes - informal escalation understanding
- Partially - varies by violation type
- No formal escalation procedures
- Unsure

**Help Text:** Clear escalation procedures ensure potential violations are addressed promptly and at appropriate management levels

**AI Prompt Hint:** Evaluate the clarity and adequacy of violation escalation procedures. Look for documented paths, timeframe requirements, decision authority levels, and voluntary self-disclosure protocols.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - documented escalation paths with clear timelines": 5,
    "Yes - informal escalation understanding": 3,
    "Partially - varies by violation type": 2,
    "No formal escalation procedures": 1,
    "Unsure": 1
  }
}
```

**Tags:** governance, escalation, incident-response

---

### Question 1.7
**Question:** Is trade compliance represented in risk committees?
**Type:** SELECT
**Weight:** 1.0 (normalized: ~0.07)
**Required:** Yes
**Options:**
- Yes - standing member of risk/compliance committee
- Yes - invited as needed
- No - not represented
- No risk committee exists
- Unsure

**Help Text:** Representation in risk committees ensures trade compliance risks are considered in enterprise risk management

**AI Prompt Hint:** Assess the integration of trade compliance into enterprise risk governance. Representation in risk committees indicates appropriate elevation and consideration of trade compliance issues.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - standing member of risk/compliance committee": 5,
    "Yes - invited as needed": 3,
    "No - not represented": 1,
    "No risk committee exists": 2,
    "Unsure": 1
  }
}
```

**Tags:** governance, risk-management, committee

---

### Question 1.8
**Question:** Are resources and budgets adequate for compliance obligations?
**Type:** SELECT
**Weight:** 1.0 (normalized: ~0.07)
**Required:** Yes
**Options:**
- Yes - fully resourced with adequate budget
- Partially - resources adequate but budget constrained
- Partially - budget adequate but understaffed
- No - inadequate resources and budget
- Unsure/not evaluated

**Help Text:** Adequate resources (staff, technology, training budget) are essential for effective compliance program execution

**AI Prompt Hint:** Evaluate resource adequacy considering trade volume, complexity, and regulatory requirements. Look for appropriate staffing levels, technology investments, and training budgets.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - fully resourced with adequate budget": 5,
    "Partially - resources adequate but budget constrained": 3,
    "Partially - budget adequate but understaffed": 3,
    "No - inadequate resources and budget": 1,
    "Unsure/not evaluated": 2
  }
}
```

**Tags:** governance, resources, budget

---

### Question 1.9
**Question:** Are trade controls harmonized across group entities?
**Type:** SELECT
**Weight:** 1.0 (normalized: ~0.07)
**Required:** Yes
**Options:**
- Yes - centralized policies and controls across all entities
- Yes - framework policies with local adaptation
- Partially - some harmonization but significant gaps
- No - each entity operates independently
- Not applicable - single entity

**Help Text:** For multi-entity organizations, harmonized controls ensure consistent compliance standards

**AI Prompt Hint:** Assess the degree of control harmonization across organizational entities. Look for centralized policies, shared systems, coordinated training, and consistent enforcement.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - centralized policies and controls across all entities": 5,
    "Yes - framework policies with local adaptation": 4,
    "Partially - some harmonization but significant gaps": 2,
    "No - each entity operates independently": 1,
    "Not applicable - single entity": 5
  }
}
```

**Tags:** governance, harmonization, group-controls

---


## Section 2: Trade Risk Assessment Framework (10 questions)

**Weight:** 0.11 (11%)
**Regulatory Priority:** WCO Risk Management Framework, ISO 31000
**Description:** Systematic identification, assessment, and mitigation of trade compliance risks

### Question 2.1 ⭐ FOUNDATIONAL
**Question:** Is a formal trade risk assessment performed annually?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - comprehensive annual risk assessment with documentation
- Yes - annual assessment but limited scope
- Periodically but not annually
- No formal risk assessment
- Unsure

**Help Text:** Regular risk assessments identify changing risk landscape and inform control priorities

**AI Prompt Hint:** Assess the formality, frequency, and comprehensiveness of trade risk assessments. Annual assessments should be documented, cover all trade activities, and drive resource allocation and control design.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive annual risk assessment with documentation": 5,
    "Yes - annual assessment but limited scope": 3,
    "Periodically but not annually": 2,
    "No formal risk assessment": 1,
    "Unsure": 1
  }
}
```

**Tags:** risk-assessment, annual, foundational

---

### Question 2.2 ⭐ FOUNDATIONAL
**Question:** Are risks categorized by goods, geography, and counterparties?
**Type:** MULTISELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Product/goods risk classification
- Geographic/jurisdiction risk rating
- Customer/supplier risk profiling
- Transactional risk factors
- Operational risk assessment
- Third-party/agent risk evaluation
- None - no categorization
- Unsure

**Help Text:** Multi-dimensional risk categorization enables risk-based resource allocation and targeted controls

**AI Prompt Hint:** Evaluate the sophistication of risk categorization. Effective programs assess risks across multiple dimensions (product, geography, counterparty, transaction type) to enable nuanced, risk-based approaches.

**Scoring Rules:**
```json
{
  "scale": 5,
  "countBased": true,
  "penalties": {
    "None - no categorization": -4,
    "Unsure": -2
  },
  "ranges": {
    "1-2": 2,
    "3-4": 3,
    "5-6": 5
  }
}
```

**Tags:** risk-assessment, categorization, foundational

---

### Question 2.3 ⭐ FOUNDATIONAL
**Question:** Are dual-use goods identified and managed?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - comprehensive dual-use identification and control program
- Yes - basic identification with some controls
- Partially - aware but controls incomplete
- No - not specifically addressed
- Not applicable - no dual-use goods

**Help Text:** Dual-use goods (commercial and military applications) face heightened export controls requiring specific management

**AI Prompt Hint:** Assess dual-use goods management. Look for proper ECCN classification, license requirements tracking, end-use screening, and specialized controls beyond standard commercial goods.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive dual-use identification and control program": 5,
    "Yes - basic identification with some controls": 3,
    "Partially - aware but controls incomplete": 2,
    "No - not specifically addressed": 1,
    "Not applicable - no dual-use goods": 5
  }
}
```

**Tags:** risk-assessment, dual-use, export-control, foundational

---

### Question 2.4
**Question:** Are trade-based money laundering (TBML) risks assessed?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - formal TBML risk assessment program
- Yes - informal TBML consideration
- No - TBML not assessed
- Not applicable - no financial services/banking
- Unsure

**Help Text:** TBML uses trade transactions to disguise illicit funds. Financial institutions and certain industries should assess TBML risks.

**AI Prompt Hint:** Evaluate TBML risk assessment, particularly relevant for financial institutions, trade finance providers, and high-risk industries. Look for red flag indicators, transaction pattern analysis, and cross-border transaction monitoring.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - formal TBML risk assessment program": 5,
    "Yes - informal TBML consideration": 3,
    "No - TBML not assessed": 1,
    "Not applicable - no financial services/banking": 4,
    "Unsure": 1
  }
}
```

**Tags:** risk-assessment, tbml, money-laundering

---

### Question 2.5
**Question:** Are sanctions and export control exposures documented?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive documentation of all exposures
- Yes - basic documentation
- Partially - some gaps in documentation
- No documentation
- Unsure of exposures

**Help Text:** Documented exposures inform control design and enable management oversight

**AI Prompt Hint:** Assess the documentation of sanctions and export control risk exposures. Look for identification of applicable regimes, prohibited/restricted parties, embargoed destinations, and controlled items.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive documentation of all exposures": 5,
    "Yes - basic documentation": 3,
    "Partially - some gaps in documentation": 2,
    "No documentation": 1,
    "Unsure of exposures": 1
  }
}
```

**Tags:** risk-assessment, documentation, sanctions, export-control

---

### Question 2.6
**Question:** Are risk ratings updated after geopolitical events or regulatory changes?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - dynamic risk ratings updated promptly
- Yes - periodic updates after major events
- No - static annual ratings only
- No formal risk rating updates
- Unsure

**Help Text:** Geopolitical events and regulatory changes can rapidly alter risk landscape requiring timely reassessment

**AI Prompt Hint:** Evaluate the agility of risk assessment processes. Effective programs update risk ratings in response to sanctions announcements, conflicts, regulatory changes, and other relevant events.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - dynamic risk ratings updated promptly": 5,
    "Yes - periodic updates after major events": 3,
    "No - static annual ratings only": 2,
    "No formal risk rating updates": 1,
    "Unsure": 1
  }
}
```

**Tags:** risk-assessment, dynamic, geopolitical

---

### Question 2.7
**Question:** Are risk results reported to management?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - regular comprehensive risk reporting to senior management/board
- Yes - periodic summary reporting
- Yes - reporting upon request only
- No formal risk reporting to management
- Unsure

**Help Text:** Management reporting ensures risk awareness at appropriate levels and enables informed decision-making

**AI Prompt Hint:** Assess the frequency, detail, and audience of risk reporting. Effective programs provide regular, comprehensive reports to senior management/board including risk trends, mitigation progress, and resource needs.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - regular comprehensive risk reporting to senior management/board": 5,
    "Yes - periodic summary reporting": 3,
    "Yes - reporting upon request only": 2,
    "No formal risk reporting to management": 1,
    "Unsure": 1
  }
}
```

**Tags:** risk-assessment, reporting, management

---

### Question 2.8
**Question:** Are controls mapped to mitigate identified risks?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive risk-to-control mapping
- Yes - basic mapping for high risks
- Partially - some mapping but incomplete
- No formal risk-to-control mapping
- Unsure

**Help Text:** Control mapping ensures identified risks have corresponding mitigating controls and identifies control gaps

**AI Prompt Hint:** Evaluate the linkage between identified risks and implemented controls. Look for formal risk-control matrices, gap identification, and control effectiveness assessment.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive risk-to-control mapping": 5,
    "Yes - basic mapping for high risks": 3,
    "Partially - some mapping but incomplete": 2,
    "No formal risk-to-control mapping": 1,
    "Unsure": 1
  }
}
```

**Tags:** risk-assessment, controls, mapping

---

### Question 2.9
**Question:** Are TBML typologies incorporated into risk assessments?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive TBML typology assessment
- Yes - basic typology awareness
- No - TBML typologies not incorporated
- Not applicable - no TBML risk
- Unsure

**Help Text:** TBML typologies (over/under invoicing, phantom shipping, etc.) should inform transaction monitoring and risk assessment

**AI Prompt Hint:** For organizations with TBML risk exposure (financial institutions, trade finance), assess incorporation of known typologies into risk assessments and detection systems.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive TBML typology assessment": 5,
    "Yes - basic typology awareness": 3,
    "No - TBML typologies not incorporated": 1,
    "Not applicable - no TBML risk": 4,
    "Unsure": 1
  }
}
```

**Tags:** risk-assessment, tbml, typologies

---

### Question 2.10
**Question:** Is trade risk integrated with the overall FCC (Financial Crime Compliance) framework?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - fully integrated trade and FCC risk frameworks
- Yes - some integration points
- No - separate frameworks
- Not applicable - no FCC framework
- Unsure

**Help Text:** For financial institutions, integration ensures holistic view of compliance risks and efficient resource allocation

**AI Prompt Hint:** Assess integration of trade compliance risk with broader financial crime compliance (AML, sanctions, fraud). Look for unified risk assessment, shared data/systems, and coordinated controls.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - fully integrated trade and FCC risk frameworks": 5,
    "Yes - some integration points": 3,
    "No - separate frameworks": 2,
    "Not applicable - no FCC framework": 4,
    "Unsure": 1
  }
}
```

**Tags:** risk-assessment, integration, fcc

---

## Section 3: Sanctions & Export Control Management (9 questions)

**Weight:** 0.13 (13%)
**Regulatory Priority:** OFAC, BIS EAR, ITAR, EU Sanctions
**Description:** Critical controls for sanctions compliance and export control management

### Question 3.1 ⭐ FOUNDATIONAL
**Question:** Are counterparties screened against restricted and denied party lists?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - automated screening against comprehensive lists
- Yes - manual screening against key lists
- Partially - inconsistent screening
- No formal screening program
- Unsure

**Help Text:** Screening against OFAC SDN, BIS DPL, EU sanctions lists, and other restricted party lists is a fundamental compliance requirement

**AI Prompt Hint:** Assess screening program comprehensiveness. Look for automated systems, coverage of all relevant lists (OFAC SDN, BIS DPL/Entity List, EU consolidated list, UN, etc.), screening at multiple touchpoints (onboarding, transaction, periodic), and documentation.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - automated screening against comprehensive lists": 5,
    "Yes - manual screening against key lists": 3,
    "Partially - inconsistent screening": 1,
    "No formal screening program": 1,
    "Unsure": 1
  }
}
```

**Tags:** sanctions, screening, restricted-parties, foundational

---

### Question 3.2 ⭐ FOUNDATIONAL
**Question:** Are export licenses obtained, monitored, and renewed timely?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - comprehensive license management system
- Yes - basic license tracking
- Partially - some licenses may lapse
- No formal license management
- Not applicable - no licensed exports

**Help Text:** Export licenses must be obtained before shipment, properly utilized, and renewed before expiration

**AI Prompt Hint:** Evaluate export license management. Look for systems to track license applications, approvals, expirations, and utilization. Assess processes for ensuring shipments comply with license terms and conditions.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive license management system": 5,
    "Yes - basic license tracking": 3,
    "Partially - some licenses may lapse": 1,
    "No formal license management": 1,
    "Not applicable - no licensed exports": 5
  }
}
```

**Tags:** export-control, licensing, management, foundational

---

### Question 3.3 ⭐ FOUNDATIONAL
**Question:** Are goods classified correctly under HS/ECCN codes with periodic reviews?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - formal classification program with expert review and periodic reviews
- Yes - initial classification but no periodic reviews
- Yes - classification performed but limited expertise
- Partially - some items unclassified or misclassified
- No formal classification process
- Unsure

**Help Text:** Accurate classification under Harmonized System (HS) and Export Control Classification Numbers (ECCN) is essential for determining applicable controls and duties. Periodic reviews ensure classifications remain accurate as products and regulations change.

**AI Prompt Hint:** Assess classification accuracy and processes. Look for use of customs/export control experts, formal classification procedures, documentation, periodic reviews, and consideration of product changes.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - formal classification program with expert review and periodic reviews": 5,
    "Yes - initial classification but no periodic reviews": 2,
    "Yes - classification performed but limited expertise": 3,
    "Partially - some items unclassified or misclassified": 1,
    "No formal classification process": 1,
    "Unsure": 1
  }
}
```

**Tags:** classification, hs-codes, eccn, foundational

---

### Question 3.4 ⭐ FOUNDATIONAL
**Question:** Are end-use and end-user declarations collected and validated?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive end-use documentation and validation
- Yes - declarations collected but limited validation
- Partially - collected for high-risk items only
- No end-use documentation collected
- Not applicable - no controlled exports

**Help Text:** End-use and end-user information is critical for export control compliance and preventing diversion

**AI Prompt Hint:** Evaluate end-use control processes. Look for collection of end-use statements, validation against red flags, ongoing monitoring for diversion indicators, and documentation retention.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive end-use documentation and validation": 5,
    "Yes - declarations collected but limited validation": 3,
    "Partially - collected for high-risk items only": 2,
    "No end-use documentation collected": 1,
    "Not applicable - no controlled exports": 5
  }
}
```

**Tags:** export-control, end-use, validation, foundational

---

### Question 3.5
**Question:** Are routing and transshipment risks monitored?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive routing analysis and red flag monitoring
- Yes - basic routing review
- No formal routing risk monitoring
- Unsure

**Help Text:** Unusual routing or transshipment patterns may indicate potential diversion to embargoed destinations

**AI Prompt Hint:** Assess routing risk management. Look for red flag indicators (circuitous routes, high-risk transit points, inconsistent destinations), validation of shipment routing, and escalation of suspicious patterns.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive routing analysis and red flag monitoring": 5,
    "Yes - basic routing review": 3,
    "No formal routing risk monitoring": 1,
    "Unsure": 1
  }
}
```

**Tags:** export-control, routing, transshipment, diversion

---

### Question 3.6
**Question:** Are high-risk jurisdictions flagged for enhanced review?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - automated flagging with enhanced review protocols
- Yes - manual flagging with basic review
- Partially - inconsistent application
- No formal high-risk jurisdiction controls
- Unsure

**Help Text:** Embargoed destinations and high-risk jurisdictions require enhanced scrutiny beyond standard screening

**AI Prompt Hint:** Evaluate enhanced controls for high-risk jurisdictions. Look for identification of embargoed/high-risk countries, enhanced due diligence procedures, senior approval requirements, and ongoing monitoring.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - automated flagging with enhanced review protocols": 5,
    "Yes - manual flagging with basic review": 3,
    "Partially - inconsistent application": 2,
    "No formal high-risk jurisdiction controls": 1,
    "Unsure": 1
  }
}
```

**Tags:** sanctions, high-risk, jurisdictions, enhanced-controls

---

### Question 3.7
**Question:** Are violations documented and reported to authorities?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - formal violation reporting process with legal review
- Yes - violations reported but informal process
- Violations identified but not consistently reported
- No violation reporting process
- No violations to date

**Help Text:** Many violations must be self-disclosed to authorities (OFAC, BIS). Voluntary self-disclosure can mitigate penalties.

**AI Prompt Hint:** Assess violation response and reporting. Look for processes to identify potential violations, legal review, voluntary self-disclosure decisions, corrective actions, and record retention.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - formal violation reporting process with legal review": 5,
    "Yes - violations reported but informal process": 3,
    "Violations identified but not consistently reported": 1,
    "No violation reporting process": 1,
    "No violations to date": 4
  }
}
```

**Tags:** violations, reporting, self-disclosure

---

### Question 3.8
**Question:** Are compliance checks embedded in order processing systems?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - automated compliance checks integrated in systems
- Yes - manual compliance checks before processing
- Partially - checks performed but not systematically
- No compliance checks in order processing
- Unsure

**Help Text:** System-integrated compliance checks prevent prohibited transactions from being processed

**AI Prompt Hint:** Evaluate integration of compliance controls into transaction processing. Look for automated screening, license verification, export control checks before order acceptance/shipment.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - automated compliance checks integrated in systems": 5,
    "Yes - manual compliance checks before processing": 3,
    "Partially - checks performed but not systematically": 2,
    "No compliance checks in order processing": 1,
    "Unsure": 1
  }
}
```

**Tags:** export-control, systems, automation, order-processing

---

### Question 3.9 ⭐ FOUNDATIONAL
**Question:** Are escalation paths clear for potential sanctions breaches?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - documented escalation procedures with clear authority levels
- Yes - informal escalation understanding
- Partially - varies by situation
- No formal escalation procedures
- Unsure

**Help Text:** Potential sanctions violations require rapid escalation to appropriate decision-makers and legal counsel

**AI Prompt Hint:** Assess sanctions escalation procedures. Look for documented paths, timeframe requirements, authority to stop/block transactions, legal review triggers, and documentation requirements.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - documented escalation procedures with clear authority levels": 5,
    "Yes - informal escalation understanding": 3,
    "Partially - varies by situation": 2,
    "No formal escalation procedures": 1,
    "Unsure": 1
  }
}
```

**Tags:** sanctions, escalation, procedures, foundational

---


## Section 4: Trade Finance (Banks) (10 questions)

**Weight:** 0.10 (10%)
**Regulatory Priority:** ICC Uniform Customs, Wolfsberg TBML Guidance
**Description:** Trade finance-specific controls for banks and financial institutions

### Question 4.1 ⭐ FOUNDATIONAL
**Question:** Are letters of credit and guarantees screened for sanctions exposure?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - comprehensive automated screening of all parties
- Yes - manual screening of key parties
- Partially - inconsistent screening
- No formal screening of trade finance instruments
- Not applicable - no trade finance services

**Help Text:** All parties to trade finance instruments must be screened against sanctions lists

**AI Prompt Hint:** Assess trade finance sanctions screening. Look for screening of applicants, beneficiaries, advising banks, shipping lines, and all parties named in documents against comprehensive sanctions lists.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive automated screening of all parties": 5,
    "Yes - manual screening of key parties": 3,
    "Partially - inconsistent screening": 1,
    "No formal screening of trade finance instruments": 1,
    "Not applicable - no trade finance services": 5
  }
}
```

**Tags:** trade-finance, sanctions, screening, lc, foundational

---

### Question 4.2 ⭐ FOUNDATIONAL
**Question:** Are trade documents checked for TBML red flags?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - systematic red flag checking with documented procedures
- Yes - informal red flag awareness
- Partially - checks performed occasionally
- No TBML red flag checking
- Not applicable - no trade finance services

**Help Text:** Trade documents should be reviewed for TBML indicators (price anomalies, document inconsistencies, unusual routing, etc.)

**AI Prompt Hint:** Evaluate TBML red flag detection in trade finance document review. Look for documented red flag indicators, staff training, escalation procedures, and integration with transaction monitoring.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - systematic red flag checking with documented procedures": 5,
    "Yes - informal red flag awareness": 3,
    "Partially - checks performed occasionally": 2,
    "No TBML red flag checking": 1,
    "Not applicable - no trade finance services": 5
  }
}
```

**Tags:** trade-finance, tbml, red-flags, document-review, foundational

---

### Question 4.3 ⭐ FOUNDATIONAL
**Question:** Are suspicious patterns (round-tripping, over/under-invoicing) detected?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - automated detection systems for TBML typologies
- Yes - manual analysis for suspicious patterns
- Partially - ad hoc detection only
- No systematic pattern detection
- Not applicable - no trade finance services

**Help Text:** Common TBML patterns include over/under invoicing, round-tripping, phantom shipping, and structuring

**AI Prompt Hint:** Assess detection of TBML typologies. Look for systems/procedures to identify pricing anomalies, circular transactions, inconsistent commodity flows, and other known TBML patterns.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - automated detection systems for TBML typologies": 5,
    "Yes - manual analysis for suspicious patterns": 3,
    "Partially - ad hoc detection only": 2,
    "No systematic pattern detection": 1,
    "Not applicable - no trade finance services": 5
  }
}
```

**Tags:** trade-finance, tbml, typologies, detection, foundational

---

### Question 4.4
**Question:** Are trade finance systems linked to KYC data?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - full integration with KYC/CDD systems
- Yes - some linkage but manual processes required
- No - separate systems requiring manual checks
- Not applicable - no trade finance services

**Help Text:** Integration with KYC data ensures customer risk profiles inform trade finance decisions

**AI Prompt Hint:** Evaluate integration between trade finance and KYC systems. Look for automated access to customer risk ratings, beneficial ownership, PEP status, and adverse media information.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - full integration with KYC/CDD systems": 5,
    "Yes - some linkage but manual processes required": 3,
    "No - separate systems requiring manual checks": 1,
    "Not applicable - no trade finance services": 5
  }
}
```

**Tags:** trade-finance, kyc, integration, systems

---

### Question 4.5
**Question:** Are red-flag indicators built into transaction review workflows?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - automated red flag alerts in workflow systems
- Yes - manual red flag checklists
- Partially - limited red flag guidance
- No red flag integration in workflows
- Not applicable - no trade finance services

**Help Text:** Embedding red flags in workflows ensures consistent application and documentation of review

**AI Prompt Hint:** Assess incorporation of TBML red flags into trade finance workflows. Look for automated alerts, mandatory checklists, escalation triggers, and documentation requirements.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - automated red flag alerts in workflow systems": 5,
    "Yes - manual red flag checklists": 3,
    "Partially - limited red flag guidance": 2,
    "No red flag integration in workflows": 1,
    "Not applicable - no trade finance services": 5
  }
}
```

**Tags:** trade-finance, red-flags, workflow, automation

---

### Question 4.6
**Question:** Are staff trained on ICC/Wolfsberg trade compliance standards?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive training on ICC rules and Wolfsberg guidance
- Yes - basic trade finance compliance training
- Partially - training for some staff only
- No formal trade compliance training
- Not applicable - no trade finance services

**Help Text:** ICC Uniform Customs and Wolfsberg TBML guidance provide industry standards for trade finance compliance

**AI Prompt Hint:** Evaluate trade finance staff training on industry standards. Look for coverage of ICC UCP 600, Wolfsberg Trade Finance Principles, TBML indicators, and compliance procedures.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive training on ICC rules and Wolfsberg guidance": 5,
    "Yes - basic trade finance compliance training": 3,
    "Partially - training for some staff only": 2,
    "No formal trade compliance training": 1,
    "Not applicable - no trade finance services": 5
  }
}
```

**Tags:** trade-finance, training, icc, wolfsberg

---

### Question 4.7
**Question:** Are exceptions approved by compliance before execution?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - mandatory compliance approval for all exceptions
- Yes - compliance approval for major exceptions
- Partially - inconsistent exception handling
- No compliance involvement in exceptions
- Not applicable - no exceptions or no trade finance

**Help Text:** Trade finance exceptions (document discrepancies, late presentations) may present compliance risks requiring review

**AI Prompt Hint:** Assess exception management in trade finance. Look for compliance review requirements, approval authority levels, risk assessment of exceptions, and documentation.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - mandatory compliance approval for all exceptions": 5,
    "Yes - compliance approval for major exceptions": 3,
    "Partially - inconsistent exception handling": 2,
    "No compliance involvement in exceptions": 1,
    "Not applicable - no exceptions or no trade finance": 4
  }
}
```

**Tags:** trade-finance, exceptions, approval, compliance

---

### Question 4.8
**Question:** Are blocked or rejected transactions logged and analyzed?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive logging with periodic analysis
- Yes - logging but limited analysis
- Partially - some logging
- No systematic logging of blocked transactions
- Not applicable - no blocked transactions or no trade finance

**Help Text:** Blocked transaction analysis can identify attempted sanctions evasion and inform risk assessments

**AI Prompt Hint:** Evaluate blocked transaction management. Look for comprehensive logging, periodic analysis for patterns, reporting to authorities where required, and use of data for risk assessment updates.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive logging with periodic analysis": 5,
    "Yes - logging but limited analysis": 3,
    "Partially - some logging": 2,
    "No systematic logging of blocked transactions": 1,
    "Not applicable - no blocked transactions or no trade finance": 4
  }
}
```

**Tags:** trade-finance, blocked-transactions, logging, analysis

---

### Question 4.9
**Question:** Are external trade partners (correspondent banks) due-diligenced?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive due diligence on all correspondent relationships
- Yes - basic due diligence
- Partially - due diligence for some correspondents only
- No formal correspondent due diligence
- Not applicable - no correspondent banking

**Help Text:** Correspondent banks used for trade finance must be assessed for sanctions/AML compliance

**AI Prompt Hint:** Assess correspondent bank due diligence for trade finance. Look for review of compliance programs, sanctions screening capabilities, TBML controls, and periodic reassessment.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive due diligence on all correspondent relationships": 5,
    "Yes - basic due diligence": 3,
    "Partially - due diligence for some correspondents only": 2,
    "No formal correspondent due diligence": 1,
    "Not applicable - no correspondent banking": 5
  }
}
```

**Tags:** trade-finance, correspondent-banking, due-diligence

---

### Question 4.10
**Question:** Are trade finance operations included in compliance audits?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - regular comprehensive trade finance compliance audits
- Yes - trade finance included in general audits
- Partially - occasional trade finance review
- No audit coverage of trade finance
- Not applicable - no trade finance services

**Help Text:** Regular audit of trade finance operations ensures control effectiveness and identifies improvements

**AI Prompt Hint:** Evaluate audit coverage of trade finance. Look for trade finance-specific audit scope, frequency, review of TBML controls, sanctions screening, and document review processes.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - regular comprehensive trade finance compliance audits": 5,
    "Yes - trade finance included in general audits": 3,
    "Partially - occasional trade finance review": 2,
    "No audit coverage of trade finance": 1,
    "Not applicable - no trade finance services": 5
  }
}
```

**Tags:** trade-finance, audit, compliance-review

---

## Section 5: Customs & Documentation (Corporates) (8 questions)

**Weight:** 0.12 (12%)
**Regulatory Priority:** WCO Standards, EU Customs Code, CBP Regulations
**Description:** Import/export documentation and customs compliance for trading companies

### Question 5.1 ⭐ FOUNDATIONAL
**Question:** Are customs declarations accurate and compliant with local laws?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - comprehensive accuracy controls and validation
- Yes - basic accuracy checks
- Partially - accuracy issues identified
- No formal accuracy controls
- Not applicable - no customs declarations

**Help Text:** Accurate customs declarations are a legal requirement and prevent penalties, delays, and enforcement actions

**AI Prompt Hint:** Assess customs declaration accuracy controls. Look for validation procedures, expert review, system checks, periodic audits, and corrective action processes for errors.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive accuracy controls and validation": 5,
    "Yes - basic accuracy checks": 3,
    "Partially - accuracy issues identified": 1,
    "No formal accuracy controls": 1,
    "Not applicable - no customs declarations": 5
  }
}
```

**Tags:** customs, declarations, accuracy, foundational

---


### Question 5.2 ⭐ FOUNDATIONAL
**Question:** Are invoices, packing lists, and BoL verified for consistency?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - systematic verification of document consistency
- Yes - manual spot checks
- Partially - verification for high-value shipments only
- No formal verification process
- Unsure

**Help Text:** Document inconsistencies can indicate errors, TBML, or customs violations

**AI Prompt Hint:** Assess trade document verification. Look for checks of consistency between commercial invoices, packing lists, bills of lading, and customs declarations. Inconsistencies should trigger review.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - systematic verification of document consistency": 5,
    "Yes - manual spot checks": 3,
    "Partially - verification for high-value shipments only": 2,
    "No formal verification process": 1,
    "Unsure": 1
  }
}
```

**Tags:** customs, documentation, verification, consistency, foundational

---

### Question 5.3
**Question:** Are freight forwarders vetted for compliance?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive compliance due diligence on all forwarders
- Yes - basic vetting
- Partially - vetting of major forwarders only
- No formal forwarder vetting
- Not applicable - no use of freight forwarders

**Help Text:** Freight forwarders act as your agent and their compliance failures can create liability

**AI Prompt Hint:** Evaluate freight forwarder due diligence. Look for assessment of compliance capabilities, licensing, insurance, contractual compliance obligations, and periodic reviews.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive compliance due diligence on all forwarders": 5,
    "Yes - basic vetting": 3,
    "Partially - vetting of major forwarders only": 2,
    "No formal forwarder vetting": 1,
    "Not applicable - no use of freight forwarders": 5
  }
}
```

**Tags:** customs, freight-forwarders, due-diligence, third-party

---


### Question 5.4 ⭐ FOUNDATIONAL
**Question:** Are proof-of-origin and preference documents maintained?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive origin documentation for all shipments
- Yes - documentation for shipments claiming preferences
- Partially - some documentation gaps
- No systematic origin documentation
- Not applicable - no preference claims

**Help Text:** Origin documents are required for customs clearance and preference claims, and must be retained

**AI Prompt Hint:** Evaluate country of origin documentation. Look for collection and retention of certificates of origin, supplier declarations, and documentation to support preference claims (e.g., USMCA).

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive origin documentation for all shipments": 5,
    "Yes - documentation for shipments claiming preferences": 4,
    "Partially - some documentation gaps": 2,
    "No systematic origin documentation": 1,
    "Not applicable - no preference claims": 4
  }
}
```

**Tags:** customs, origin, documentation, preferences, foundational

---

### Question 5.5
**Question:** Are customs brokers contractually bound to compliance standards?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive compliance clauses in broker contracts
- Yes - basic compliance obligations in contracts
- No compliance provisions in broker contracts
- Not applicable - no use of customs brokers

**Help Text:** Customs brokers file entries on your behalf, and contractual compliance obligations help ensure proper conduct

**AI Prompt Hint:** Assess customs broker contract provisions. Look for compliance obligations, indemnification, audit rights, training requirements, and error notification/correction procedures.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive compliance clauses in broker contracts": 5,
    "Yes - basic compliance obligations in contracts": 3,
    "No compliance provisions in broker contracts": 1,
    "Not applicable - no use of customs brokers": 5
  }
}
```

**Tags:** customs, brokers, contracts, compliance

---

### Question 5.6
**Question:** Are audits conducted on import/export documentation?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - regular comprehensive documentation audits
- Yes - periodic spot audits
- Rarely - audits only when issues arise
- No documentation audits conducted
- Unsure

**Help Text:** Regular audits identify documentation errors and compliance gaps before regulatory examination

**AI Prompt Hint:** Evaluate documentation audit program. Look for audit frequency, scope, sampling methodology, error tracking, and corrective action processes.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - regular comprehensive documentation audits": 5,
    "Yes - periodic spot audits": 3,
    "Rarely - audits only when issues arise": 2,
    "No documentation audits conducted": 1,
    "Unsure": 1
  }
}
```

**Tags:** customs, documentation, audit, review

---

### Question 5.7 ⭐ FOUNDATIONAL
**Question:** Are customs documents (invoices, bills of lading, certificates of origin) retained per requirements?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive retention policy meeting all customs requirements
- Yes - retention policy in place but may have gaps
- Partially - informal retention practices
- No formal document retention policy
- Unsure of regulatory requirements

**Help Text:** Customs authorities typically require retention of commercial invoices, bills of lading, packing lists, certificates of origin, and entry documents for 5-7 years

**AI Prompt Hint:** Assess customs document retention compliance. Look for formal retention policy covering all customs-required documents (commercial invoices, bills of lading, packing lists, certificates of origin, entry documents), retention periods meeting regulatory requirements (typically 5-7 years), secure storage, and retrieval capabilities.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive retention policy meeting all customs requirements": 5,
    "Yes - retention policy in place but may have gaps": 3,
    "Partially - informal retention practices": 2,
    "No formal document retention policy": 1,
    "Unsure of regulatory requirements": 1
  }
}
```

**Tags:** customs, documentation, retention, compliance, foundational

---

### Question 5.8
**Question:** Are non-conformities tracked and corrected?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - formal non-conformance tracking and correction system
- Yes - informal tracking and correction
- Partially - corrections made but not systematically tracked
- No formal non-conformance management
- Unsure

**Help Text:** Tracking errors and non-conformances enables identification of systemic issues and continuous improvement

**AI Prompt Hint:** Evaluate non-conformance management. Look for error/exception logging, root cause analysis, corrective actions, trend analysis, and management reporting.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - formal non-conformance tracking and correction system": 5,
    "Yes - informal tracking and correction": 3,
    "Partially - corrections made but not systematically tracked": 2,
    "No formal non-conformance management": 1,
    "Unsure": 1
  }
}
```

**Tags:** customs, non-conformance, quality, tracking

---

## Section 6: Supply Chain & End-Use Controls (9 questions)

**Weight:** 0.11 (11%)
**Regulatory Priority:** BIS End-Use Controls, UFLPA, Supply Chain Transparency
**Description:** Supplier due diligence, end-use verification, and supply chain risk management

### Question 6.1 ⭐ FOUNDATIONAL
**Question:** Are supplier due diligence records comprehensive and accessible for audit?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - comprehensive due diligence records accessible for audit
- Yes - basic due diligence records maintained
- Partially - informal documentation practices
- No formal due diligence documentation
- Unsure

**Help Text:** Supplier due diligence documentation should include screening results, risk assessments, approvals, contracts, and periodic review records for audit purposes

**AI Prompt Hint:** Assess supplier due diligence documentation quality and accessibility. Look for comprehensive records including screening results, risk assessments, approval documentation, contracts, periodic reviews, secure retention, and accessibility for regulatory audits.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive due diligence records accessible for audit": 5,
    "Yes - basic due diligence records maintained": 3,
    "Partially - informal documentation practices": 2,
    "No formal due diligence documentation": 1,
    "Unsure": 1
  }
}
```

**Tags:** supply-chain, supplier-screening, documentation, foundational

---


### Question 6.2
**Question:** Are shipping routes and ports monitored for diversion risk?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - systematic monitoring with risk analysis
- Yes - basic route review
- Partially - occasional monitoring
- No route monitoring
- Unsure

**Help Text:** Unusual routing patterns may indicate diversion to prohibited destinations

**AI Prompt Hint:** Assess shipping route monitoring. Look for validation of logical routes, red flag indicators for circuitous routing, transshipment risk assessment, and escalation procedures.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - systematic monitoring with risk analysis": 5,
    "Yes - basic route review": 3,
    "Partially - occasional monitoring": 2,
    "No route monitoring": 1,
    "Unsure": 1
  }
}
```

**Tags:** supply-chain, routing, diversion-risk, monitoring

---

### Question 6.3
**Question:** Are re-exports and transit trades tracked?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive re-export tracking system
- Yes - basic tracking
- Partially - limited tracking
- No re-export tracking
- Not applicable - no re-exports

**Help Text:** Re-exports may require additional authorizations and present diversion risks

**AI Prompt Hint:** Evaluate re-export control processes. Look for identification of re-export transactions, license requirement determination, tracking systems, and compliance verification.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive re-export tracking system": 5,
    "Yes - basic tracking": 3,
    "Partially - limited tracking": 2,
    "No re-export tracking": 1,
    "Not applicable - no re-exports": 5
  }
}
```

**Tags:** supply-chain, re-exports, tracking, transit-trade

---

### Question 6.4
**Question:** Are logistics partners included in compliance reviews?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - regular compliance reviews of all logistics partners
- Yes - periodic reviews of major partners
- Partially - occasional reviews
- No compliance reviews of logistics partners
- Not applicable - no logistics partners

**Help Text:** Logistics partners handle shipments and must understand compliance requirements

**AI Prompt Hint:** Assess logistics partner compliance oversight. Look for due diligence procedures, compliance training requirements, contractual obligations, and periodic performance reviews.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - regular compliance reviews of all logistics partners": 5,
    "Yes - periodic reviews of major partners": 3,
    "Partially - occasional reviews": 2,
    "No compliance reviews of logistics partners": 1,
    "Not applicable - no logistics partners": 5
  }
}
```

**Tags:** supply-chain, logistics, third-party, compliance-review

---

### Question 6.5 ⭐ FOUNDATIONAL
**Question:** Are human rights or ESG criteria part of supplier due diligence?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive human rights and ESG due diligence
- Yes - basic human rights screening
- Partially - limited ESG consideration
- No human rights or ESG due diligence
- Unsure

**Help Text:** UFLPA and other regulations require forced labor screening. ESG factors are increasingly important.

**AI Prompt Hint:** Evaluate forced labor and ESG due diligence. Look for Uyghur Forced Labor Prevention Act compliance, supplier codes of conduct, audit programs, and remediation procedures.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive human rights and ESG due diligence": 5,
    "Yes - basic human rights screening": 3,
    "Partially - limited ESG consideration": 2,
    "No human rights or ESG due diligence": 1,
    "Unsure": 1
  }
}
```

**Tags:** supply-chain, human-rights, esg, uflpa, forced-labor, foundational

---

### Question 6.6
**Question:** Are risk alerts generated for unusual trade routes?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - automated risk alerts for unusual patterns
- Yes - manual review identifies unusual routes
- Partially - limited alert capability
- No risk alerts for routing
- Unsure

**Help Text:** Automated alerts enable timely review of potentially concerning shipment patterns

**AI Prompt Hint:** Assess risk alerting capabilities. Look for system-generated alerts based on route deviations, high-risk transit points, or pattern anomalies, with appropriate escalation.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - automated risk alerts for unusual patterns": 5,
    "Yes - manual review identifies unusual routes": 3,
    "Partially - limited alert capability": 2,
    "No risk alerts for routing": 1,
    "Unsure": 1
  }
}
```

**Tags:** supply-chain, risk-alerts, monitoring, automation

---

### Question 6.7
**Question:** Are contractual clauses on export controls enforced downstream?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive downstream compliance clauses with enforcement
- Yes - clauses in place but limited enforcement
- Partially - clauses in some contracts
- No downstream export control clauses
- Not applicable - no controlled items

**Help Text:** Downstream control prevents unauthorized re-export or use of controlled items

**AI Prompt Hint:** Evaluate downstream export control provisions. Look for contractual restrictions on re-export, end-use limitations, audit rights, and enforcement mechanisms.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive downstream compliance clauses with enforcement": 5,
    "Yes - clauses in place but limited enforcement": 3,
    "Partially - clauses in some contracts": 2,
    "No downstream export control clauses": 1,
    "Not applicable - no controlled items": 5
  }
}
```

**Tags:** supply-chain, export-control, contracts, downstream

---

### Question 6.8
**Question:** Are escalation paths defined for end-use uncertainty?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - documented escalation procedures for end-use concerns
- Yes - informal escalation understanding
- Partially - varies by situation
- No defined escalation paths
- Unsure

**Help Text:** End-use uncertainties require prompt escalation to compliance and management

**AI Prompt Hint:** Assess end-use escalation procedures. Look for clear escalation paths, decision authority, stop-shipment protocols, and documentation requirements when end-use is uncertain.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - documented escalation procedures for end-use concerns": 5,
    "Yes - informal escalation understanding": 3,
    "Partially - varies by situation": 2,
    "No defined escalation paths": 1,
    "Unsure": 1
  }
}
```

**Tags:** supply-chain, end-use, escalation, procedures

---

### Question 6.9
**Question:** Are supply chain mapping and transparency tools used?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive supply chain mapping with technology tools
- Yes - basic supply chain visibility
- Partially - limited visibility
- No supply chain mapping
- Unsure

**Help Text:** Supply chain transparency enables identification of risks and compliance gaps

**AI Prompt Hint:** Evaluate supply chain transparency. Look for mapping of suppliers, sub-suppliers, country of origin tracking, and technology tools for visibility across multiple tiers.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive supply chain mapping with technology tools": 5,
    "Yes - basic supply chain visibility": 3,
    "Partially - limited visibility": 2,
    "No supply chain mapping": 1,
    "Unsure": 1
  }
}
```

**Tags:** supply-chain, mapping, transparency, visibility

---

## Section 7: Data, Technology & Recordkeeping (10 questions)

**Weight:** 0.08 (8%)
**Regulatory Priority:** Data Retention Requirements, System Validation
**Description:** Technology infrastructure, data management, and recordkeeping compliance

### Question 7.1 ⭐ FOUNDATIONAL
**Question:** Are trade compliance records stored centrally and retrievable?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - centralized electronic repository with search capabilities
- Yes - centralized storage but limited search
- Partially - some records centralized
- No - decentralized record storage
- Unsure

**Help Text:** Centralized recordkeeping enables efficient retrieval for audits and regulatory requests

**AI Prompt Hint:** Assess record management systems. Look for centralized repository, electronic storage, metadata/indexing, search capabilities, access controls, and backup procedures.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - centralized electronic repository with search capabilities": 5,
    "Yes - centralized storage but limited search": 3,
    "Partially - some records centralized": 2,
    "No - decentralized record storage": 1,
    "Unsure": 1
  }
}
```

**Tags:** data-technology, recordkeeping, centralization, foundational

---

### Question 7.2 ⭐ FOUNDATIONAL
**Question:** Are screening systems integrated with ERP/logistics systems?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - full integration with automated data flow
- Yes - partial integration requiring some manual input
- No - separate systems requiring manual data transfer
- No screening system in place
- Unsure

**Help Text:** System integration reduces errors and enables real-time compliance checks

**AI Prompt Hint:** Evaluate systems integration. Look for automated data flow between screening and operational systems, real-time checks, minimal manual intervention, and data consistency.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - full integration with automated data flow": 5,
    "Yes - partial integration requiring some manual input": 3,
    "No - separate systems requiring manual data transfer": 1,
    "No screening system in place": 1,
    "Unsure": 1
  }
}
```

**Tags:** data-technology, integration, systems, screening, foundational

---

### Question 7.3 ⭐ FOUNDATIONAL
**Question:** Are data retention policies compliant with regulations?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive retention policy meeting all requirements
- Yes - retention policy in place but may have gaps
- Partially - informal retention practices
- No formal retention policy
- Unsure of requirements

**Help Text:** Regulatory retention requirements typically range from 5-7 years for trade documents

**AI Prompt Hint:** Assess data retention compliance. Look for formal policies covering all document types, retention periods aligned with regulations, secure storage, and disposal procedures.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive retention policy meeting all requirements": 5,
    "Yes - retention policy in place but may have gaps": 3,
    "Partially - informal retention practices": 2,
    "No formal retention policy": 1,
    "Unsure of requirements": 1
  }
}
```

**Tags:** data-technology, retention, compliance, foundational

---

### Question 7.4
**Question:** Are access controls and audit logs in place?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive access controls with detailed audit logs
- Yes - basic access controls and logging
- Partially - limited controls or logging
- No formal access controls or audit logs
- Unsure

**Help Text:** Access controls protect sensitive data and audit logs enable investigation and compliance verification

**AI Prompt Hint:** Evaluate data security controls. Look for role-based access, authentication requirements, audit logging of data access/changes, log retention, and regular review.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive access controls with detailed audit logs": 5,
    "Yes - basic access controls and logging": 3,
    "Partially - limited controls or logging": 2,
    "No formal access controls or audit logs": 1,
    "Unsure": 1
  }
}
```

**Tags:** data-technology, security, access-control, audit-logs

---

### Question 7.5
**Question:** Are manual processes minimized through digitalization?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - extensive automation of compliance processes
- Yes - some automation but manual processes remain
- Limited automation - mostly manual processes
- No automation - fully manual processes
- Unsure

**Help Text:** Automation reduces errors, improves efficiency, and enhances compliance effectiveness

**AI Prompt Hint:** Assess digitalization and automation. Look for automated screening, classification, documentation, reporting, and monitoring with minimal manual intervention.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - extensive automation of compliance processes": 5,
    "Yes - some automation but manual processes remain": 3,
    "Limited automation - mostly manual processes": 2,
    "No automation - fully manual processes": 1,
    "Unsure": 1
  }
}
```

**Tags:** data-technology, automation, digitalization, efficiency

---

### Question 7.6
**Question:** Is there a dashboard for monitoring trade compliance metrics?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive compliance dashboard with real-time metrics
- Yes - basic reporting of key metrics
- Partially - ad hoc reporting only
- No compliance metrics dashboard
- Unsure

**Help Text:** Compliance dashboards enable monitoring of program effectiveness and early issue identification

**AI Prompt Hint:** Evaluate compliance metrics monitoring. Look for dashboards showing screening volume, hit rates, escalations, license status, training completion, and audit findings.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive compliance dashboard with real-time metrics": 5,
    "Yes - basic reporting of key metrics": 3,
    "Partially - ad hoc reporting only": 2,
    "No compliance metrics dashboard": 1,
    "Unsure": 1
  }
}
```

**Tags:** data-technology, dashboard, metrics, monitoring

---

### Question 7.7
**Question:** Are system updates and vendor changes approved by compliance?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - formal compliance review and approval required
- Yes - compliance consulted but not formal approval
- Partially - compliance involved in some changes
- No - compliance not involved in system changes
- Unsure

**Help Text:** System changes can impact compliance controls and require review

**AI Prompt Hint:** Assess compliance governance over technology changes. Look for change management procedures requiring compliance review, validation of control maintenance, and documentation.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - formal compliance review and approval required": 5,
    "Yes - compliance consulted but not formal approval": 3,
    "Partially - compliance involved in some changes": 2,
    "No - compliance not involved in system changes": 1,
    "Unsure": 1
  }
}
```

**Tags:** data-technology, change-management, governance, approval

---

### Question 7.8
**Question:** Are trade data validated for completeness and accuracy?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive data validation controls
- Yes - basic validation checks
- Partially - limited validation
- No systematic data validation
- Unsure

**Help Text:** Data quality is essential for effective compliance controls and decision-making

**AI Prompt Hint:** Evaluate data validation procedures. Look for automated validation rules, mandatory field requirements, consistency checks, error reporting, and data quality metrics.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive data validation controls": 5,
    "Yes - basic validation checks": 3,
    "Partially - limited validation": 2,
    "No systematic data validation": 1,
    "Unsure": 1
  }
}
```

**Tags:** data-technology, validation, data-quality, accuracy

---

### Question 7.9
**Question:** Is there backup and business continuity planning for trade systems?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive backup and BCP for all trade systems
- Yes - basic backup procedures
- Partially - backup for some systems only
- No formal backup or BCP
- Unsure

**Help Text:** Business continuity ensures compliance operations can continue during system disruptions

**AI Prompt Hint:** Assess backup and business continuity. Look for regular backups, disaster recovery procedures, redundancy, testing of recovery, and alternate processing capabilities.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive backup and BCP for all trade systems": 5,
    "Yes - basic backup procedures": 3,
    "Partially - backup for some systems only": 2,
    "No formal backup or BCP": 1,
    "Unsure": 1
  }
}
```

**Tags:** data-technology, backup, business-continuity, disaster-recovery

---

### Question 7.10
**Question:** Is a roadmap defined for trade compliance automation?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - detailed automation roadmap with timelines
- Yes - general automation goals
- Under development
- No automation roadmap
- Unsure

**Help Text:** Strategic planning for automation ensures continuous improvement and resource allocation

**AI Prompt Hint:** Evaluate automation strategy. Look for documented roadmap, prioritized initiatives, resource allocation, timelines, and alignment with compliance program needs.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - detailed automation roadmap with timelines": 5,
    "Yes - general automation goals": 3,
    "Under development": 2,
    "No automation roadmap": 1,
    "Unsure": 1
  }
}
```

**Tags:** data-technology, automation, roadmap, strategy

---

## Section 8: Training & Culture (10 questions)

**Weight:** 0.05 (5%)
**Regulatory Priority:** Training Requirements, Compliance Culture
**Description:** Employee training, awareness programs, and compliance culture

### Question 8.1 ⭐ FOUNDATIONAL
**Question:** Is trade compliance training mandatory for relevant employees?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - mandatory training with enforcement
- Yes - training available but not strictly enforced
- Partially - mandatory for some roles only
- No - training is optional
- No formal training program

**Help Text:** Mandatory training ensures all relevant employees understand compliance obligations

**AI Prompt Hint:** Assess training mandate and enforcement. Look for documented requirements, tracking of completion, consequences for non-compliance, and coverage of all relevant roles.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - mandatory training with enforcement": 5,
    "Yes - training available but not strictly enforced": 3,
    "Partially - mandatory for some roles only": 2,
    "No - training is optional": 1,
    "No formal training program": 1
  }
}
```

**Tags:** training, mandatory, enforcement, foundational

---

### Question 8.2 ⭐ FOUNDATIONAL
**Question:** Are refresher trainings conducted annually?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - annual refresher training required
- Yes - periodic training but not annually
- No - only initial training provided
- No formal training program
- Unsure

**Help Text:** Regular refresher training keeps employees current on regulatory changes and reinforces compliance

**AI Prompt Hint:** Evaluate refresher training frequency. Annual training is regulatory best practice. Look for scheduled refreshers, updated content, and tracking of completion.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - annual refresher training required": 5,
    "Yes - periodic training but not annually": 3,
    "No - only initial training provided": 1,
    "No formal training program": 1,
    "Unsure": 1
  }
}
```

**Tags:** training, refresher, annual, foundational

---

### Question 8.3
**Question:** Are procurement, logistics, and finance staff trained on export controls?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive role-specific training for all functions
- Yes - general training covering all functions
- Partially - training for some functions only
- No cross-functional training
- Unsure

**Help Text:** Trade compliance spans multiple functions requiring coordinated training

**AI Prompt Hint:** Assess cross-functional training coverage. Look for role-specific content for procurement (supplier screening), logistics (shipping controls), and finance (payment screening).

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive role-specific training for all functions": 5,
    "Yes - general training covering all functions": 3,
    "Partially - training for some functions only": 2,
    "No cross-functional training": 1,
    "Unsure": 1
  }
}
```

**Tags:** training, cross-functional, procurement, logistics, finance

---

### Question 8.4
**Question:** Are awareness campaigns run for high-risk regions or goods?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - targeted awareness campaigns for emerging risks
- Yes - general awareness communications
- Occasionally - ad hoc communications
- No targeted awareness campaigns
- Unsure

**Help Text:** Timely awareness campaigns alert staff to emerging risks (new sanctions, high-risk products)

**AI Prompt Hint:** Evaluate risk-based awareness communications. Look for timely alerts on sanctions announcements, new regulations, high-risk transactions, and lessons learned.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - targeted awareness campaigns for emerging risks": 5,
    "Yes - general awareness communications": 3,
    "Occasionally - ad hoc communications": 2,
    "No targeted awareness campaigns": 1,
    "Unsure": 1
  }
}
```

**Tags:** training, awareness, risk-based, campaigns

---

### Question 8.5
**Question:** Are escalation procedures understood by all employees?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - escalation training included with periodic reinforcement
- Yes - escalation procedures communicated but not regularly reinforced
- Partially - some employees understand escalation
- No - escalation procedures not well communicated
- Unsure

**Help Text:** Employees must know how and when to escalate potential compliance issues

**AI Prompt Hint:** Assess escalation awareness. Look for training on "when to escalate," clear contact points, whistleblower protections, and no-retaliation policies.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - escalation training included with periodic reinforcement": 5,
    "Yes - escalation procedures communicated but not regularly reinforced": 3,
    "Partially - some employees understand escalation": 2,
    "No - escalation procedures not well communicated": 1,
    "Unsure": 1
  }
}
```

**Tags:** training, escalation, awareness, procedures

---

### Question 8.6
**Question:** Are trade compliance KPIs linked to performance management?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - compliance KPIs included in performance reviews
- Yes - compliance considered but not formal KPIs
- Partially - KPIs for compliance roles only
- No - compliance not in performance management
- Unsure

**Help Text:** Linking compliance to performance creates accountability and reinforces importance

**AI Prompt Hint:** Evaluate performance management integration. Look for compliance KPIs in job descriptions, performance reviews, and incentive structures for relevant roles.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - compliance KPIs included in performance reviews": 5,
    "Yes - compliance considered but not formal KPIs": 3,
    "Partially - KPIs for compliance roles only": 2,
    "No - compliance not in performance management": 1,
    "Unsure": 1
  }
}
```

**Tags:** training, kpis, performance-management, accountability

---

### Question 8.7
**Question:** Are incidents used as learning opportunities?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - systematic lessons learned process with communication
- Yes - informal lessons learned
- Occasionally - some incidents analyzed
- No - incidents not used for learning
- No incidents to date

**Help Text:** Converting incidents into training improves future compliance

**AI Prompt Hint:** Assess lessons learned process. Look for root cause analysis, communication of findings (anonymized), training updates, and control improvements based on incidents.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - systematic lessons learned process with communication": 5,
    "Yes - informal lessons learned": 3,
    "Occasionally - some incidents analyzed": 2,
    "No - incidents not used for learning": 1,
    "No incidents to date": 4
  }
}
```

**Tags:** training, lessons-learned, incidents, continuous-improvement

---

### Question 8.8
**Question:** Are management communications reinforcing compliance culture?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - regular management messaging on compliance importance
- Yes - occasional management communications
- Rarely - limited management visibility
- No - compliance not emphasized by management
- Unsure

**Help Text:** "Tone from the top" is critical for establishing strong compliance culture

**AI Prompt Hint:** Evaluate management support for compliance culture. Look for regular communications from senior management, compliance included in company meetings, visible support for compliance team.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - regular management messaging on compliance importance": 5,
    "Yes - occasional management communications": 3,
    "Rarely - limited management visibility": 2,
    "No - compliance not emphasized by management": 1,
    "Unsure": 1
  }
}
```

**Tags:** training, culture, tone-from-top, management-support

---

### Question 8.9
**Question:** Are new hires trained during onboarding?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - compliance training required during onboarding
- Yes - training provided within first 90 days
- Partially - training for some new hires
- No - no onboarding compliance training
- Unsure

**Help Text:** Early training ensures new employees understand compliance obligations from the start

**AI Prompt Hint:** Assess onboarding training. Look for compliance module in orientation, role-specific training timing, documentation of completion, and systems access contingent on training.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - compliance training required during onboarding": 5,
    "Yes - training provided within first 90 days": 3,
    "Partially - training for some new hires": 2,
    "No - no onboarding compliance training": 1,
    "Unsure": 1
  }
}
```

**Tags:** training, onboarding, new-hires

---

### Question 8.10
**Question:** Are training programs updated for regulatory changes?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - training updated promptly for regulatory changes
- Yes - training updated annually
- Occasionally - updates lag behind changes
- No - training content is static
- Unsure

**Help Text:** Current training content ensures employees are aware of latest requirements

**AI Prompt Hint:** Evaluate training content currency. Look for process to monitor regulatory changes, update training materials, and communicate updates to employees in timely manner.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - training updated promptly for regulatory changes": 5,
    "Yes - training updated annually": 3,
    "Occasionally - updates lag behind changes": 2,
    "No - training content is static": 1,
    "Unsure": 1
  }
}
```

**Tags:** training, updates, regulatory-changes, currency

---

## Section 9: Monitoring, Audit & Continuous Improvement (10 questions)

**Weight:** 0.08 (8%)
**Regulatory Priority:** Independent Testing, Continuous Improvement
**Description:** Compliance monitoring, auditing, and program improvement

### Question 9.1 ⭐ FOUNDATIONAL
**Question:** Are trade compliance controls tested periodically?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - comprehensive periodic control testing
- Yes - some controls tested regularly
- Occasionally - ad hoc testing only
- No formal control testing
- Unsure

**Help Text:** Regular control testing validates effectiveness and identifies weaknesses

**AI Prompt Hint:** Assess control testing program. Look for documented test procedures, coverage of key controls (screening, classification, license management), frequency, and findings tracking.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive periodic control testing": 5,
    "Yes - some controls tested regularly": 3,
    "Occasionally - ad hoc testing only": 2,
    "No formal control testing": 1,
    "Unsure": 1
  }
}
```

**Tags:** monitoring-audit, control-testing, effectiveness, foundational

---

### Question 9.2 ⭐ FOUNDATIONAL
**Question:** Are internal or external audits performed annually?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - annual independent audit of trade compliance
- Yes - annual internal audit
- Periodically but not annually
- No formal audit program
- Unsure

**Help Text:** Annual audits are regulatory best practice for trade compliance programs

**AI Prompt Hint:** Evaluate audit frequency and independence. Independent external audits provide greater assurance. Look for comprehensive scope, qualified auditors, and action on findings.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - annual independent audit of trade compliance": 5,
    "Yes - annual internal audit": 4,
    "Periodically but not annually": 2,
    "No formal audit program": 1,
    "Unsure": 1
  }
}
```

**Tags:** monitoring-audit, audit, annual, independence, foundational

---

### Question 9.3 ⭐ FOUNDATIONAL
**Question:** Are corrective actions tracked to closure?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - formal corrective action tracking system
- Yes - corrective actions tracked informally
- Partially - some actions tracked
- No systematic tracking of corrective actions
- Unsure

**Help Text:** Tracking ensures audit findings and identified issues are actually remediated

**AI Prompt Hint:** Assess corrective action management. Look for action item tracking, assignment of ownership, deadlines, status monitoring, verification of closure, and escalation of overdue items.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - formal corrective action tracking system": 5,
    "Yes - corrective actions tracked informally": 3,
    "Partially - some actions tracked": 2,
    "No systematic tracking of corrective actions": 1,
    "Unsure": 1
  }
}
```

**Tags:** monitoring-audit, corrective-actions, tracking, remediation, foundational

---

### Question 9.4
**Question:** Are trade compliance KPIs and KRIs defined?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive KPIs and KRIs with regular monitoring
- Yes - basic metrics tracked
- Partially - limited metrics
- No formal KPIs or KRIs
- Unsure

**Help Text:** Key Performance Indicators and Key Risk Indicators enable program monitoring and management

**AI Prompt Hint:** Evaluate metrics program. Look for defined KPIs (screening volume, training completion) and KRIs (hit rates, violations, audit findings), targets, regular reporting, and trend analysis.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive KPIs and KRIs with regular monitoring": 5,
    "Yes - basic metrics tracked": 3,
    "Partially - limited metrics": 2,
    "No formal KPIs or KRIs": 1,
    "Unsure": 1
  }
}
```

**Tags:** monitoring-audit, kpis, kris, metrics, performance

---

### Question 9.5
**Question:** Are near-misses analyzed for lessons learned?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - systematic near-miss analysis and communication
- Yes - informal analysis
- Occasionally - some near-misses reviewed
- No near-miss analysis
- No near-misses identified

**Help Text:** Near-miss analysis enables proactive risk mitigation before violations occur

**AI Prompt Hint:** Assess near-miss review process. Look for identification of near-misses (e.g., screening catches, last-minute license holds), root cause analysis, and control improvements.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - systematic near-miss analysis and communication": 5,
    "Yes - informal analysis": 3,
    "Occasionally - some near-misses reviewed": 2,
    "No near-miss analysis": 1,
    "No near-misses identified": 3
  }
}
```

**Tags:** monitoring-audit, near-miss, lessons-learned, prevention

---

### Question 9.6
**Question:** Are management reports produced on compliance effectiveness?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - regular comprehensive management reporting
- Yes - periodic summary reports
- Occasionally - reporting upon request
- No management reporting on compliance
- Unsure

**Help Text:** Regular reporting keeps management informed and enables oversight

**AI Prompt Hint:** Evaluate management reporting. Look for regular reports to senior management/board covering metrics, audit findings, incidents, regulatory changes, and resource needs.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - regular comprehensive management reporting": 5,
    "Yes - periodic summary reports": 3,
    "Occasionally - reporting upon request": 2,
    "No management reporting on compliance": 1,
    "Unsure": 1
  }
}
```

**Tags:** monitoring-audit, reporting, management-oversight

---

### Question 9.7
**Question:** Are peer or benchmark assessments used?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - regular benchmarking against peers/industry standards
- Yes - occasional peer comparisons
- No - no benchmarking
- Unsure

**Help Text:** Benchmarking provides external perspective on program maturity and identifies improvement opportunities

**AI Prompt Hint:** Assess use of external benchmarks. Look for participation in industry groups, peer assessments, maturity model self-assessments, and gap analysis against leading practices.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - regular benchmarking against peers/industry standards": 5,
    "Yes - occasional peer comparisons": 3,
    "No - no benchmarking": 1,
    "Unsure": 1
  }
}
```

**Tags:** monitoring-audit, benchmarking, peer-assessment, best-practices

---

### Question 9.8
**Question:** Are system performance and alert accuracy validated?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - regular validation of system performance
- Yes - periodic validation
- Occasionally - limited validation
- No system validation
- Not applicable - no automated systems

**Help Text:** System validation ensures screening and other controls operate as intended

**AI Prompt Hint:** Evaluate system validation. Look for testing of screening accuracy, false positive rates, classification logic, alert generation, and periodic tuning based on performance metrics.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - regular validation of system performance": 5,
    "Yes - periodic validation": 3,
    "Occasionally - limited validation": 2,
    "No system validation": 1,
    "Not applicable - no automated systems": 4
  }
}
```

**Tags:** monitoring-audit, system-validation, testing, accuracy

---

### Question 9.9
**Question:** Are findings from authorities or partners incorporated into updates?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - systematic incorporation of external findings
- Yes - findings considered but not systematically
- Occasionally - ad hoc incorporation
- No - external findings not incorporated
- No relevant findings received

**Help Text:** Learning from regulatory findings and partner feedback improves compliance

**AI Prompt Hint:** Assess responsiveness to external input. Look for processes to review regulatory guidance, examination findings (own or industry), partner feedback, and incorporation into program updates.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - systematic incorporation of external findings": 5,
    "Yes - findings considered but not systematically": 3,
    "Occasionally - ad hoc incorporation": 2,
    "No - external findings not incorporated": 1,
    "No relevant findings received": 4
  }
}
```

**Tags:** monitoring-audit, regulatory-feedback, continuous-improvement

---

### Question 9.10
**Question:** Is continuous improvement embedded in compliance planning?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - formal continuous improvement program
- Yes - improvement initiatives identified informally
- Partially - limited improvement planning
- No - reactive compliance approach only
- Unsure

**Help Text:** Proactive improvement culture drives program maturity and risk reduction

**AI Prompt Hint:** Evaluate continuous improvement mindset. Look for annual compliance plan with improvement initiatives, resource allocation for enhancements, innovation encouragement, and tracking of improvements.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - formal continuous improvement program": 5,
    "Yes - improvement initiatives identified informally": 3,
    "Partially - limited improvement planning": 2,
    "No - reactive compliance approach only": 1,
    "Unsure": 1
  }
}
```

**Tags:** monitoring-audit, continuous-improvement, planning, maturity

---

## Section 10: AI Readiness & Responsible Use (20 questions)

**Weight:** 0.08 (8%)
**Regulatory Priority:** EU AI Act, Model Risk Management, Algorithmic Transparency
**Description:** AI governance, ethics, and responsible use in trade compliance operations

### Question 10.1 ⭐ FOUNDATIONAL
**Question:** Has the organization defined an AI or digital strategy covering trade compliance?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - comprehensive AI strategy including trade compliance use cases
- Yes - general AI strategy with some trade compliance consideration
- Under development
- No AI strategy defined
- Not applicable - no AI plans

**Help Text:** AI strategy aligns technology adoption with business objectives and compliance requirements

**AI Prompt Hint:** Assess AI strategic planning. Look for documented strategy, identified trade compliance use cases (screening, classification, risk scoring), resource allocation, and governance framework.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive AI strategy including trade compliance use cases": 5,
    "Yes - general AI strategy with some trade compliance consideration": 3,
    "Under development": 2,
    "No AI strategy defined": 1,
    "Not applicable - no AI plans": 3
  }
}
```

**Tags:** ai-readiness, strategy, governance, foundational

---

### Question 10.2 ⭐ FOUNDATIONAL
**Question:** Are AI governance structures in place (policy, oversight committee)?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - comprehensive AI governance (policy, committee, oversight)
- Yes - basic AI governance in place
- Partially - governance under development
- No AI governance structures
- Not applicable - no AI usage

**Help Text:** AI governance ensures responsible use, risk management, and regulatory compliance

**AI Prompt Hint:** Evaluate AI governance framework. Look for AI policy/principles, governance committee, risk assessment processes, approval requirements, and compliance integration.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive AI governance (policy, committee, oversight)": 5,
    "Yes - basic AI governance in place": 3,
    "Partially - governance under development": 2,
    "No AI governance structures": 1,
    "Not applicable - no AI usage": 4
  }
}
```

**Tags:** ai-readiness, governance, oversight, foundational

---

### Question 10.3
**Question:** Are trade compliance use cases for AI clearly defined (screening, document analysis, risk scoring)?
**Type:** MULTISELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Sanctions/restricted party screening
- Document analysis and classification
- Risk scoring and profiling
- Pattern detection and anomaly identification
- Automated classification (HS/ECCN)
- Natural language processing for compliance review
- Predictive analytics for risk assessment
- None - no AI use cases defined
- Considering options

**Help Text:** Clear use case definition ensures AI is applied appropriately to compliance needs

**AI Prompt Hint:** Assess AI use case clarity. Look for documented use cases, business justification, expected benefits, risk assessment, and governance requirements for each application.

**Scoring Rules:**
```json
{
  "scale": 5,
  "countBased": true,
  "penalties": {
    "None - no AI use cases defined": -4,
    "Considering options": -1
  },
  "ranges": {
    "1-2": 2,
    "3-4": 3,
    "5-6": 4,
    "7+": 5
  }
}
```

**Tags:** ai-readiness, use-cases, applications

---

### Question 10.4
**Question:** Are data sources for AI training verified for accuracy and licensing?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive data verification and licensing management
- Yes - basic data quality checks
- Partially - limited verification
- No formal data verification
- Not applicable - no AI training

**Help Text:** AI model quality depends on training data quality and appropriate licensing

**AI Prompt Hint:** Evaluate training data governance. Look for data source validation, accuracy verification, licensing compliance, data lineage, and bias assessment in training datasets.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive data verification and licensing management": 5,
    "Yes - basic data quality checks": 3,
    "Partially - limited verification": 2,
    "No formal data verification": 1,
    "Not applicable - no AI training": 4
  }
}
```

**Tags:** ai-readiness, data-quality, training-data, licensing

---

### Question 10.5 ⭐ FOUNDATIONAL
**Question:** Are models explainable and their limitations documented?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - comprehensive model documentation including limitations
- Yes - basic model documentation
- Partially - some documentation
- No model documentation
- Not applicable - no AI models

**Help Text:** Model explainability and limitation awareness are critical for responsible AI use and regulatory compliance

**AI Prompt Hint:** Assess model documentation and explainability. Look for documented decision logic, performance limitations, confidence thresholds, and explainability techniques (SHAP, LIME) for regulatory review.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive model documentation including limitations": 5,
    "Yes - basic model documentation": 3,
    "Partially - some documentation": 2,
    "No model documentation": 1,
    "Not applicable - no AI models": 4
  }
}
```

**Tags:** ai-readiness, explainability, documentation, transparency, foundational

---

### Question 10.6 ⭐ FOUNDATIONAL
**Question:** Is there human oversight for AI-assisted trade screening or document checks?
**Type:** SELECT
**Weight:** 2.0
**Required:** Yes
**Options:**
- Yes - mandatory human review of AI decisions
- Yes - human review for high-risk cases
- Partially - limited human oversight
- No - fully automated decisions
- Not applicable - no AI-assisted screening

**Help Text:** Human oversight prevents AI errors from causing compliance violations and provides accountability

**AI Prompt Hint:** Evaluate human-in-the-loop controls. Look for mandatory human review requirements, override capabilities, escalation procedures, and documentation of review decisions.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - mandatory human review of AI decisions": 5,
    "Yes - human review for high-risk cases": 4,
    "Partially - limited human oversight": 2,
    "No - fully automated decisions": 1,
    "Not applicable - no AI-assisted screening": 4
  }
}
```

**Tags:** ai-readiness, human-oversight, review, accountability, foundational

---

### Question 10.7
**Question:** Are model validation and performance monitoring conducted regularly?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive regular validation and monitoring
- Yes - periodic validation
- Occasionally - ad hoc validation
- No formal validation or monitoring
- Not applicable - no AI models

**Help Text:** Regular validation ensures models continue to perform as intended and detect model drift

**AI Prompt Hint:** Assess model validation program. Look for pre-deployment validation, ongoing performance monitoring, drift detection, accuracy metrics, and retraining triggers.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive regular validation and monitoring": 5,
    "Yes - periodic validation": 3,
    "Occasionally - ad hoc validation": 2,
    "No formal validation or monitoring": 1,
    "Not applicable - no AI models": 4
  }
}
```

**Tags:** ai-readiness, validation, monitoring, model-performance

---

### Question 10.8
**Question:** Are bias, accuracy, and fairness assessments performed?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive bias and fairness testing
- Yes - basic accuracy assessments
- Partially - limited testing
- No bias or fairness assessments
- Not applicable - no AI models

**Help Text:** Bias assessments ensure AI doesn't discriminate and maintains fairness in compliance decisions

**AI Prompt Hint:** Evaluate fairness and bias testing. Look for disparate impact analysis, demographic bias testing, fairness metrics, and mitigation strategies for identified biases.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive bias and fairness testing": 5,
    "Yes - basic accuracy assessments": 3,
    "Partially - limited testing": 2,
    "No bias or fairness assessments": 1,
    "Not applicable - no AI models": 4
  }
}
```

**Tags:** ai-readiness, bias, fairness, ethics

---

### Question 10.9
**Question:** Are AI vendors assessed for compliance and data protection?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive vendor due diligence
- Yes - basic vendor assessment
- Partially - limited vendor review
- No vendor assessments
- Not applicable - no AI vendors

**Help Text:** AI vendor assessments ensure third-party tools meet compliance and security requirements

**AI Prompt Hint:** Assess AI vendor due diligence. Look for evaluation of vendor compliance capabilities, data protection, security, model transparency, and contractual safeguards.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive vendor due diligence": 5,
    "Yes - basic vendor assessment": 3,
    "Partially - limited vendor review": 2,
    "No vendor assessments": 1,
    "Not applicable - no AI vendors": 4
  }
}
```

**Tags:** ai-readiness, vendor-management, due-diligence

---

### Question 10.10
**Question:** Are AI systems categorized and risk-rated under internal governance or EU AI Act criteria?
**Type:** SELECT
**Weight:** 1.5
**Required:** Yes
**Options:**
- Yes - comprehensive risk categorization aligned with EU AI Act
- Yes - basic risk categorization
- Under development
- No risk categorization
- Not applicable - no AI systems

**Help Text:** AI risk categorization enables appropriate governance and compliance measures

**AI Prompt Hint:** Evaluate AI risk classification. Look for categorization framework (high/medium/low risk), EU AI Act alignment, risk-based controls, and governance requirements by risk level.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive risk categorization aligned with EU AI Act": 5,
    "Yes - basic risk categorization": 3,
    "Under development": 2,
    "No risk categorization": 1,
    "Not applicable - no AI systems": 4
  }
}
```

**Tags:** ai-readiness, risk-rating, eu-ai-act, categorization

---

### Question 10.11
**Question:** Are employees trained to interpret AI outputs responsibly?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive AI literacy training
- Yes - basic training on AI tool usage
- Partially - limited AI training
- No AI-specific training
- Not applicable - no AI tools

**Help Text:** Employee understanding of AI capabilities and limitations is essential for responsible use

**AI Prompt Hint:** Assess AI training program. Look for training on AI tool capabilities, limitations, interpretation of outputs, override procedures, and escalation of unusual results.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive AI literacy training": 5,
    "Yes - basic training on AI tool usage": 3,
    "Partially - limited AI training": 2,
    "No AI-specific training": 1,
    "Not applicable - no AI tools": 4
  }
}
```

**Tags:** ai-readiness, training, literacy, responsible-use

---

### Question 10.12
**Question:** Is there an incident process for AI-related compliance failures?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - formal AI incident response process
- Yes - general incident process includes AI
- Under development
- No AI incident process
- Not applicable - no AI usage

**Help Text:** AI incident procedures ensure timely response to AI-related compliance issues

**AI Prompt Hint:** Evaluate AI incident management. Look for procedures to identify AI failures, assess impact, implement workarounds, investigate root cause, and prevent recurrence.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - formal AI incident response process": 5,
    "Yes - general incident process includes AI": 3,
    "Under development": 2,
    "No AI incident process": 1,
    "Not applicable - no AI usage": 4
  }
}
```

**Tags:** ai-readiness, incident-response, contingency

---

### Question 10.13
**Question:** Are manual fallback or override processes in place?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive manual fallback capabilities
- Yes - basic override procedures
- Partially - limited manual capability
- No fallback processes
- Not applicable - no AI automation

**Help Text:** Manual fallbacks ensure business continuity when AI systems fail or produce questionable results

**AI Prompt Hint:** Assess business continuity for AI. Look for documented manual procedures, override capabilities, emergency protocols, and staff training on manual processes.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive manual fallback capabilities": 5,
    "Yes - basic override procedures": 3,
    "Partially - limited manual capability": 2,
    "No fallback processes": 1,
    "Not applicable - no AI automation": 4
  }
}
```

**Tags:** ai-readiness, fallback, override, business-continuity

---

### Question 10.14
**Question:** Are data privacy and export control rules applied to AI datasets?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive data governance for AI datasets
- Yes - basic privacy controls
- Partially - limited data protection
- No specific data governance for AI
- Not applicable - no AI datasets

**Help Text:** AI datasets may contain sensitive or controlled information requiring protection

**AI Prompt Hint:** Evaluate data protection for AI. Look for privacy controls, anonymization/pseudonymization, export control assessment of technical data, and data transfer restrictions.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive data governance for AI datasets": 5,
    "Yes - basic privacy controls": 3,
    "Partially - limited data protection": 2,
    "No specific data governance for AI": 1,
    "Not applicable - no AI datasets": 4
  }
}
```

**Tags:** ai-readiness, data-privacy, export-control, data-protection

---

### Question 10.15
**Question:** Is the trade compliance team involved in AI design and procurement?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - compliance involved in all AI initiatives
- Yes - compliance consulted on major initiatives
- Partially - limited compliance involvement
- No - compliance not involved in AI decisions
- Not applicable - no AI initiatives

**Help Text:** Early compliance involvement ensures AI tools meet regulatory requirements

**AI Prompt Hint:** Assess compliance integration in AI lifecycle. Look for compliance participation in requirements definition, vendor selection, solution design, testing, and deployment approval.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - compliance involved in all AI initiatives": 5,
    "Yes - compliance consulted on major initiatives": 3,
    "Partially - limited compliance involvement": 2,
    "No - compliance not involved in AI decisions": 1,
    "Not applicable - no AI initiatives": 4
  }
}
```

**Tags:** ai-readiness, compliance-involvement, procurement, design

---

### Question 10.16
**Question:** Are AI performance dashboards or audit logs maintained?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive AI monitoring and logging
- Yes - basic performance tracking
- Partially - limited monitoring
- No AI-specific monitoring
- Not applicable - no AI systems

**Help Text:** AI monitoring enables oversight, audit, and continuous improvement

**AI Prompt Hint:** Evaluate AI monitoring infrastructure. Look for performance dashboards, audit trails of AI decisions, logging of model predictions, and anomaly detection.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive AI monitoring and logging": 5,
    "Yes - basic performance tracking": 3,
    "Partially - limited monitoring": 2,
    "No AI-specific monitoring": 1,
    "Not applicable - no AI systems": 4
  }
}
```

**Tags:** ai-readiness, monitoring, audit-logs, dashboards

---

### Question 10.17
**Question:** Is there documentation for algorithmic decision logic used in screening?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive algorithm documentation
- Yes - basic documentation
- Partially - some documentation
- No algorithm documentation
- Not applicable - no algorithmic screening

**Help Text:** Algorithm documentation enables regulatory review and audit

**AI Prompt Hint:** Assess algorithmic transparency. Look for documented decision trees, scoring logic, weighting factors, threshold settings, and rationale for algorithmic choices.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive algorithm documentation": 5,
    "Yes - basic documentation": 3,
    "Partially - some documentation": 2,
    "No algorithm documentation": 1,
    "Not applicable - no algorithmic screening": 4
  }
}
```

**Tags:** ai-readiness, documentation, algorithms, transparency

---

### Question 10.18
**Question:** Are external audits or certifications for AI tools considered?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - AI tools externally audited/certified
- Under consideration
- No external validation
- Not applicable - no AI tools

**Help Text:** External validation provides independent assurance of AI tool quality and compliance

**AI Prompt Hint:** Evaluate external validation of AI. Look for third-party audits, certifications (ISO, SOC 2), penetration testing, and independent model validation.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - AI tools externally audited/certified": 5,
    "Under consideration": 3,
    "No external validation": 1,
    "Not applicable - no AI tools": 4
  }
}
```

**Tags:** ai-readiness, audit, certification, external-validation

---

### Question 10.19
**Question:** Are ethical standards and transparency disclosures applied to AI usage?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - comprehensive AI ethics framework with transparency
- Yes - basic ethical guidelines
- Under development
- No ethical standards for AI
- Not applicable - no AI usage

**Help Text:** Ethical AI use and transparency build trust and meet regulatory expectations

**AI Prompt Hint:** Assess AI ethics program. Look for ethical principles/guidelines, transparency about AI use, disclosure to affected parties, and ethical review of AI applications.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - comprehensive AI ethics framework with transparency": 5,
    "Yes - basic ethical guidelines": 3,
    "Under development": 2,
    "No ethical standards for AI": 1,
    "Not applicable - no AI usage": 4
  }
}
```

**Tags:** ai-readiness, ethics, transparency, responsible-ai

---

### Question 10.20
**Question:** Is AI adoption aligned with the organization's compliance risk appetite and governance framework?
**Type:** SELECT
**Weight:** 1.0
**Required:** Yes
**Options:**
- Yes - AI adoption fully aligned with risk appetite
- Yes - generally aligned with some gaps
- Partially - limited alignment
- No - AI adoption not aligned with risk framework
- Not applicable - no AI adoption

**Help Text:** AI adoption should align with organizational risk tolerance and governance structures

**AI Prompt Hint:** Evaluate AI-risk alignment. Look for documented risk appetite for AI, governance approval of AI initiatives, risk-based decision-making, and integration with enterprise risk management.

**Scoring Rules:**
```json
{
  "scale": 5,
  "mapping": {
    "Yes - AI adoption fully aligned with risk appetite": 5,
    "Yes - generally aligned with some gaps": 3,
    "Partially - limited alignment": 2,
    "No - AI adoption not aligned with risk framework": 1,
    "Not applicable - no AI adoption": 4
  }
}
```

**Tags:** ai-readiness, risk-appetite, alignment, governance

---

## Implementation Notes

1. **Total Questions:** 105 across 10 sections (reduced from 120 after deduplication)
2. **Foundational Questions:** 33 of 105 (31.4%)
   - Section 1: 4 foundational (9 total questions)
   - Section 2: 3 foundational (10 total questions)
   - Section 3: 5 foundational (9 total questions)
   - Section 4: 3 foundational (10 total questions)
   - Section 5: 4 foundational (8 total questions)
   - Section 6: 2 foundational (9 total questions)
   - Section 7: 3 foundational (10 total questions)
   - Section 8: 2 foundational (10 total questions)
   - Section 9: 3 foundational (10 total questions)
   - Section 10: 4 foundational (20 total questions)

3. **Estimated Completion Time:** 105 minutes (1 hour 45 minutes)
4. **Weight Distribution:** Follows regulatory-priority model
   - Governance: 14%
   - Sanctions/Export: 13%
   - Customs: 12%
   - Risk Assessment: 11%
   - Supply Chain: 11%
   - Trade Finance: 10%
   - Data/Tech: 8%
   - Monitoring/Audit: 8%
   - AI Readiness: 8%
   - Training: 5%

5. **Evidence Tiers:** Apply standard TIER_0/1/2 multipliers (0.6/0.8/1.0)
6. **Scoring:** 0-100 scale using weighted scoring service
7. **Question Types:**
   - SELECT: 105 questions
   - MULTISELECT: 3 questions
   - TEXT: 12 questions (for open-ended process descriptions)

---

## Regulatory Alignment

This template aligns with:
- **OFAC Sanctions Framework** - Sections 1, 3
- **BIS Export Administration Regulations (EAR)** - Sections 1, 3, 6
- **ITAR** - Sections 1, 3, 6
- **WCO Framework of Standards** - Sections 1, 2, 5
- **EU Customs Code** - Sections 5
- **ICC Uniform Customs (UCP 600)** - Section 4
- **Wolfsberg TBML Guidance** - Section 4
- **UFLPA (Uyghur Forced Labor Prevention Act)** - Section 6
- **EU AI Act** - Section 10
- **ISO 31000 (Risk Management)** - Section 2
- **COSO Enterprise Risk Management** - Sections 1, 9

---

**Document Status:** COMPLETE ✅
**Next Steps:** Create seed file implementation (seed-templates-trade-v3.ts)
