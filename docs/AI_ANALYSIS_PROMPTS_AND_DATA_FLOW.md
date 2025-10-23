# AI Analysis Prompts and Data Flow Documentation

**Last Updated:** October 22, 2025
**Version:** 2.0
**Related Services:** `risk-analysis-ai.service.ts`, `assessment.service.ts`

---

## Table of Contents

1. [Overview](#overview)
2. [AI Architecture](#ai-architecture)
3. [Data Flow Diagram](#data-flow-diagram)
4. [Input Data Sources](#input-data-sources)
5. [AI Prompts](#ai-prompts)
6. [Output Structure](#output-structure)
7. [Frontend Integration](#frontend-integration)
8. [Fallback Mechanisms](#fallback-mechanisms)

---

## Overview

The Heliolus platform uses **OpenAI GPT-4o-mini** to generate intelligent, context-aware compliance analysis. All assessment results, strategy matrices, and remediation estimates are **AI-generated** based on the organization's specific context and identified gaps.

### Key Features
- ✅ **Zero hardcoded values** - All estimates are AI-generated
- ✅ **Organization-specific** - Considers size, industry, geography, risk profile
- ✅ **Gap-aware** - Analyzes actual compliance gaps and severity
- ✅ **Cached results** - Generated once, retrieved instantly thereafter
- ✅ **Fallback logic** - Graceful degradation if OpenAI unavailable

---

## AI Architecture

### Models Used
- **Primary Model:** `gpt-4o-mini` (configurable via `OPENAI_MODEL` env var)
- **Response Format:** Structured JSON (`response_format: { type: 'json_object' }`)
- **Max Tokens:** 1000 per request
- **Rate Limiting:** Max 5 concurrent requests

### System Persona
```
"You are a compliance and risk management expert. Provide structured JSON responses."
```

### Temperature Settings
- **Key Findings:** `0.3` (more consistent, analytical)
- **Mitigation Strategies:** `0.4` (balanced creativity + consistency)

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ASSESSMENT COMPLETION                                     │
│    - User completes assessment questionnaire                 │
│    - System identifies gaps & risks from AI-scored answers   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. FETCH ASSESSMENT DATA                                     │
│    Source: assessment.service.ts:2648                        │
│    From Database:                                            │
│    ✓ All gaps (category, title, description, severity)      │
│    ✓ All risks (category, riskLevel, likelihood, impact)    │
│    ✓ Organization (size, industry, geography, revenue, etc.)│
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GROUP BY CATEGORY                                         │
│    Source: assessment.service.ts:2686                        │
│    Example Output:                                           │
│    {                                                         │
│      "KYC_AML": [12 gaps],                                  │
│      "DATA_PROTECTION": [8 gaps],                           │
│      "TRANSACTION_MONITORING": [15 gaps],                   │
│      ...                                                     │
│    }                                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. FOR EACH CATEGORY - PARALLEL AI CALLS                    │
│    Source: assessment.service.ts:2719-2735                   │
│                                                              │
│    ┌──────────────────────────────────────────┐             │
│    │ Call 1: generateKeyFindings()            │             │
│    │ ├─ Input: category + gaps (up to 20)    │             │
│    │ ├─ Model: gpt-4o-mini                   │             │
│    │ ├─ Temp: 0.3                            │             │
│    │ └─ Output: 3-5 synthesized findings     │             │
│    └──────────────────────────────────────────┘             │
│                                                              │
│    ┌──────────────────────────────────────────┐             │
│    │ Call 2: generateMitigationStrategies()   │             │
│    │ ├─ Input: category + gaps + risks +     │             │
│    │ │         organization context           │             │
│    │ ├─ Model: gpt-4o-mini                   │             │
│    │ ├─ Temp: 0.4                            │             │
│    │ └─ Output: 4 strategies with:           │             │
│    │      • strategy, priority, impact       │             │
│    │      • estimatedTimeframe, keyActions   │             │
│    │      • businessOwner 🤖                 │             │
│    │      • estimatedBudget 🤖               │             │
│    │      • riskReductionPercent 🤖          │             │
│    │      • remediationDays 🤖               │             │
│    └──────────────────────────────────────────┘             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. BUILD STRATEGY MATRIX                                     │
│    Source: assessment.service.ts:2750-2769                   │
│    For each category, create matrix row using AI values:    │
│    {                                                         │
│      priority: 1,                                           │
│      riskArea: "KYC/AML",                                   │
│      adjustedRisk: "HIGH",                                  │
│      primaryMitigation: strategy.strategy,                  │
│      timeline: strategy.estimatedTimeframe,      // AI 🤖   │
│      budget: strategy.estimatedBudget,           // AI 🤖   │
│      businessOwner: strategy.businessOwner,      // AI 🤖   │
│      riskReductionPercent: strategy.riskReductionPercent, // AI 🤖 │
│      remediationDays: strategy.remediationDays   // AI 🤖   │
│    }                                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. CALCULATE AGGREGATE METRICS                               │
│    Source: assessment.service.ts:2794-2803                   │
│    totalRiskReduction = sum(all riskReductionPercent)      │
│    avgRemediationDays = avg(all remediationDays)           │
│    totalRemediationDays = sum(all remediationDays)         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. STORE IN DATABASE                                         │
│    Source: assessment.service.ts:2805-2812                   │
│    assessment.aiRiskAnalysis = riskAnalysis                 │
│    assessment.aiStrategyMatrix = strategyMatrixRows         │
│    assessment.aiGeneratedAt = timestamp                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. RETURN TO FRONTEND                                        │
│    Source: assessment.service.ts:2824-2836                   │
│    API Endpoint: GET /v1/assessments/:id/ai-analysis        │
│    Response:                                                 │
│    {                                                         │
│      riskAnalysis: { [category]: { score, findings, ... } },│
│      strategyMatrix: [ { priority, riskArea, ... } ],       │
│      metrics: {                                             │
│        totalRiskReduction: 75,    // Sum of AI values       │
│        avgRemediationDays: 105,   // Average                │
│        totalRemediationDays: 420  // Sum                    │
│      },                                                      │
│      generatedAt: "2025-10-22T07:30:00.000Z"               │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Input Data Sources

### 1. Organization Context
**Source:** `assessment.organization` (Prisma relation)

```typescript
interface OrganizationContext {
  size?: string;              // "MICRO" | "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE"
  industry?: string;          // "Financial Services" | "Healthcare" | etc.
  geography?: string;         // "EUROPE" | "NORTH_AMERICA" | "ASIA_PACIFIC" | etc.
  riskProfile?: string;       // "LOW" | "MODERATE" | "HIGH"
  annualRevenue?: string;     // "UNDER_10M" | "10M_50M" | "50M_100M" | etc.
  complianceTeamSize?: string;// "SOLO" | "SMALL" | "MEDIUM" | "LARGE"
}
```

**Collection Point:** User provides during organization profile setup

### 2. Compliance Gaps
**Source:** `assessment.gaps` (Generated from AI-scored assessment answers)

```typescript
interface Gap {
  id: string;
  category: string;          // "KYC_AML" | "DATA_PROTECTION" | etc.
  title: string;            // "Missing automated KYC screening"
  description: string;      // Detailed explanation
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  priority: "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW";
  recommendation?: string;  // Initial AI recommendation
}
```

**Collection Point:** Generated when assessment is completed

### 3. Identified Risks
**Source:** `assessment.risks` (Generated from gap analysis)

```typescript
interface Risk {
  id: string;
  category: string;
  title: string;
  description: string;
  likelihood: string;       // "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW"
  impact: string;          // "CATASTROPHIC" | "MAJOR" | "MODERATE" | "MINOR"
  riskLevel: string;       // "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  mitigation?: string;
}
```

---

## AI Prompts

### Prompt 1: Key Findings Generation

**Purpose:** Synthesize individual gaps into broader, strategic findings

**Source:** `risk-analysis-ai.service.ts:211-242`

**Input Data Example:**
```
Category: "KYC_AML"

Gaps (up to 20):
- [CRITICAL] Missing automated KYC screening: System lacks real-time identity
  verification and sanctions screening capabilities required by regulation
- [HIGH] Incomplete customer risk assessments: Risk assessment process missing
  key data points for enhanced due diligence
- [MEDIUM] Outdated AML policies: Policies haven't been updated in 18 months,
  missing latest regulatory guidance
...
```

**Full Prompt:**
```
Analyze the following compliance gaps in the "[CATEGORY]" category and synthesize 3-5 key findings.

Gaps:
[GAP_LIST_WITH_DESCRIPTIONS]

Return JSON with this exact structure:
{
  "keyFindings": [
    {
      "finding": "Brief description of the synthesized finding",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "description": "Detailed explanation including impact and regulatory implications"
    }
  ]
}

Focus on:
1. Clustering related gaps into broader findings
2. Highlighting systemic issues rather than individual gaps
3. Prioritizing findings by regulatory risk and business impact
4. Ensuring each finding represents multiple gaps where possible
5. Using clear, actionable language

Generate between 3 and 5 findings that capture the most critical issues.
```

**Example AI Response:**
```json
{
  "keyFindings": [
    {
      "finding": "Critical gaps in automated identity verification infrastructure",
      "severity": "CRITICAL",
      "description": "The absence of real-time KYC screening and sanctions checking exposes the organization to significant regulatory penalties under EU AML directives. This systemic gap affects customer onboarding and ongoing monitoring processes."
    },
    {
      "finding": "Inadequate customer risk assessment framework",
      "severity": "HIGH",
      "description": "Current risk assessment processes lack key data points required for enhanced due diligence, particularly for high-risk customer segments. This increases exposure to financial crime and regulatory scrutiny."
    },
    ...
  ]
}
```

---

### Prompt 2: Mitigation Strategies Generation

**Purpose:** Generate actionable remediation strategies with business context

**Source:** `risk-analysis-ai.service.ts:247-306`

**Input Data Example:**
```
Organization Context:
- Size: MEDIUM (51-200 employees)
- Industry: Financial Services
- Geography: EUROPE
- Risk Profile: MODERATE
- Annual Revenue: 10M_50M
- Compliance Team Size: SMALL (1-5 people)

Gaps to Address (12 total):
- [CRITICAL] Missing automated KYC screening
- [HIGH] Incomplete customer risk assessments
- [MEDIUM] Outdated AML policies
- [MEDIUM] Insufficient transaction monitoring
- [LOW] Limited staff training programs
...

Critical risks identified: 3
High risks identified: 5
```

**Full Prompt:**
```
Generate 4 prioritized mitigation strategies for "[CATEGORY]" compliance gaps.

Organization Context:
- Size: [ORG_SIZE]
- Industry: [INDUSTRY]
- Geography: [GEOGRAPHY]
- Risk Profile: [RISK_PROFILE]
- Annual Revenue: [REVENUE]
- Compliance Team Size: [TEAM_SIZE]

Gaps to Address ([COUNT] total):
[GAP_SUMMARY_LIST]

Critical risks identified: [CRITICAL_COUNT]
High risks identified: [HIGH_COUNT]

Return JSON with exactly 4 strategies covering all priority levels:
{
  "strategies": [
    {
      "strategy": "Specific, actionable strategy description",
      "priority": "immediate|short-term|medium-term|long-term",
      "impact": "high|medium|low",
      "rationale": "Why this strategy is important",
      "estimatedTimeframe": "Realistic timeframe (e.g., '1-2 weeks', '3-6 months')",
      "keyActions": ["Action 1", "Action 2", "Action 3"],
      "businessOwner": "Recommended business owner role (e.g., 'Chief Compliance Officer', 'Head of Risk')",
      "estimatedBudget": "Budget estimate range in dollars (e.g., '$25k-$50k', '$100k-$150k')",
      "riskReductionPercent": 15,
      "remediationDays": 30
    }
  ]
}

Requirements:
1. Include ONE strategy for each priority level (immediate, short-term, medium-term, long-term)
2. Consider the organization's size and resources when estimating budget and timeline
3. Focus on practical, implementable solutions
4. Address the highest severity gaps first
5. Include specific actions and realistic timeframes
6. Assign appropriate business owner based on the compliance area (not generic titles)
7. Estimate budget based on gap count, severity, and organization size
8. Provide realistic risk reduction percentage (typically 10-30% per strategy)
9. Estimate remediation days considering priority and complexity
```

**Example AI Response:**
```json
{
  "strategies": [
    {
      "strategy": "Deploy automated KYC screening platform with real-time sanctions checking",
      "priority": "immediate",
      "impact": "high",
      "rationale": "Critical regulatory requirement to prevent onboarding sanctioned individuals and meet EU AML compliance obligations",
      "estimatedTimeframe": "2-4 weeks",
      "keyActions": [
        "Evaluate and select vendor KYC platform with EU sanctions coverage",
        "Integrate platform with existing customer onboarding workflow",
        "Train frontline staff on new screening procedures"
      ],
      "businessOwner": "Chief Compliance Officer",
      "estimatedBudget": "$45k-$75k",
      "riskReductionPercent": 35,
      "remediationDays": 21
    },
    {
      "strategy": "Enhance customer risk assessment framework with enhanced due diligence protocols",
      "priority": "short-term",
      "impact": "high",
      "rationale": "Strengthens risk-based approach and enables proper segmentation of customer base by risk profile",
      "estimatedTimeframe": "1-3 months",
      "keyActions": [
        "Develop comprehensive risk assessment questionnaire",
        "Implement tiered due diligence procedures",
        "Create ongoing monitoring triggers for high-risk customers"
      ],
      "businessOwner": "Head of KYC Operations",
      "estimatedBudget": "$30k-$50k",
      "riskReductionPercent": 25,
      "remediationDays": 60
    },
    {
      "strategy": "Update and digitize AML policies and procedures manual",
      "priority": "medium-term",
      "impact": "medium",
      "rationale": "Ensures all policies reflect current regulatory requirements and are accessible to all staff",
      "estimatedTimeframe": "3-6 months",
      "keyActions": [
        "Conduct gap analysis against latest EU AML directives",
        "Revise policies with legal and compliance review",
        "Deploy digital policy management platform"
      ],
      "businessOwner": "Compliance Director",
      "estimatedBudget": "$20k-$35k",
      "riskReductionPercent": 15,
      "remediationDays": 120
    },
    {
      "strategy": "Establish continuous compliance training and certification program",
      "priority": "long-term",
      "impact": "medium",
      "rationale": "Builds long-term compliance culture and ensures staff remain current with evolving regulations",
      "estimatedTimeframe": "6-12 months",
      "keyActions": [
        "Develop role-specific training curricula",
        "Implement learning management system",
        "Create quarterly compliance certification requirements"
      ],
      "businessOwner": "Head of Learning & Development",
      "estimatedBudget": "$25k-$40k",
      "riskReductionPercent": 10,
      "remediationDays": 270
    }
  ]
}
```

---

## Output Structure

### Strategy Matrix Row
**Source:** `assessment.service.ts:2753-2769`

```typescript
interface StrategyMatrixRow {
  priority: number;                    // Sequential number (1, 2, 3...)
  riskArea: string;                    // Category (e.g., "KYC/AML")
  adjustedRisk: "HIGH" | "MEDIUM" | "LOW";  // Based on category score
  urgency: string;                     // "IMMEDIATE" | "SHORT-TERM" | etc.
  impact: string;                      // Category risk score (e.g., "7.5")
  primaryMitigation: string;           // AI strategy description
  timeline: string;                    // AI: "2-4 weeks", "1-3 months"
  budget: string;                      // AI: "$45k-$75k", "$100k-$150k"
  businessOwner: string;               // AI: "Chief Compliance Officer"
  gapCount: number;                    // Number of gaps in category
  criticalGaps: number;                // Number of critical gaps
  riskReductionPercent: number;        // AI: 15, 25, 35
  remediationDays: number;             // AI: 21, 60, 120
}
```

### Aggregated Metrics
**Source:** `assessment.service.ts:2794-2803`

```typescript
interface AggregatedMetrics {
  totalRiskReduction: number;     // Sum of all riskReductionPercent
  avgRemediationDays: number;     // Average of all remediationDays
  totalRemediationDays: number;   // Sum of all remediationDays
}
```

### Complete API Response
```typescript
interface AIAnalysisResponse {
  riskAnalysis: {
    [category: string]: {
      score: number;                      // 0-10 risk score
      totalGaps: number;
      criticalGaps: number;
      keyFindings: KeyFinding[];          // 3-5 synthesized findings
      mitigationStrategies: MitigationStrategy[];  // 4 strategies
    }
  };
  strategyMatrix: StrategyMatrixRow[];  // One row per category
  generatedAt: string;                  // ISO timestamp
  partialFailure?: boolean;             // True if some categories failed
  failedCategories?: string[];          // List of failed categories
  metrics: AggregatedMetrics;           // Computed from AI values
}
```

---

## Frontend Integration

### Data Fetching
**Location:** `frontend/src/pages/AssessmentResults.tsx:1009-1018`

```typescript
// Fetch AI-generated metrics
const { data: aiAnalysis } = useQuery({
  queryKey: ['ai-analysis', assessmentId],
  queryFn: async () => {
    const response = await apiRequest<any>(`/assessments/${assessmentId}/ai-analysis`);
    return response.data;
  },
  enabled: !!assessmentId && !!results && (results.gaps?.length > 0),
  staleTime: Infinity,  // Never refetch - it's permanent
  retry: 1,
});
```

### Usage in Components

**Executive Summary:**
```typescript
// frontend/src/pages/AssessmentResults.tsx:77-85
const ExecutiveSummary = ({ results, gaps, risks, aiMetrics }: any) => {
  // Use AI-generated remediation days instead of hardcoded calculation
  const estimatedRemediationDays = aiMetrics?.avgRemediationDays ||
    (highPriorityGaps * 7 + (gaps.length - highPriorityGaps) * 14);

  // Use AI risk reduction instead of hardcoded multiplier
  const improvementPercent = aiMetrics?.totalRiskReduction
    ? Math.round(aiMetrics.totalRiskReduction / 4)
    : Math.round(highPriorityGaps * 2.5);

  // Display in months
  const estimatedMonths = Math.ceil(estimatedRemediationDays / 30);

  return (
    <div>
      <div>Estimated Remediation: {estimatedMonths} months</div>
      <div>Expected Improvement: {improvementPercent}%</div>
    </div>
  );
};
```

**Strategy Matrix:**
```typescript
// frontend/src/pages/AssessmentResults.tsx:686-687
// Sum individual AI-generated risk reduction percentages
const totalRiskReduction = strategyData.reduce(
  (sum: number, s: any) => sum + (s.riskReductionPercent || 15),
  0
);
```

---

## Fallback Mechanisms

### When OpenAI is Unavailable
**Source:** `risk-analysis-ai.service.ts:466-542`

The system gracefully degrades by generating fallback values based on gap data:

```typescript
// Fallback mitigation strategies with gap-based estimates
private generateFallbackMitigationStrategies(gaps: Gap[]): MitigationStrategy[] {
  const critical = gaps.filter(g => g.severity === 'CRITICAL');
  const high = gaps.filter(g => g.severity === 'HIGH');

  return [
    {
      strategy: `Address ${critical.length} critical gaps immediately...`,
      priority: 'immediate',
      businessOwner: 'Chief Compliance Officer',
      estimatedBudget: critical.length > 3 ? '$50k-$100k' : '$25k-$50k',
      riskReductionPercent: 25,  // Reasonable default
      remediationDays: 14,
      ...
    },
    // ... 3 more strategies
  ];
}
```

### Fallback Calculation Logic

**Budget Estimation:**
```
IF criticalGaps > 3 THEN "$50k-$100k"
ELSE IF highGaps > 5 THEN "$75k-$125k"
ELSE "$25k-$50k"
```

**Remediation Days:**
```
immediate:   14 days
short-term:  60 days
medium-term: 120 days
long-term:   270 days
```

**Risk Reduction:**
```
immediate:   25%
short-term:  20%
medium-term: 15%
long-term:   10%
```

### Error Handling Flow

```
1. Try OpenAI API call
2. If fail → Log error + use fallback
3. If partial success → Return available data + flag failures
4. Store result in database (even if partial)
5. Return to frontend with status indicator
```

---

## Performance Characteristics

### Generation Time
- **First request:** 3-5 seconds (2 AI calls per category × N categories)
- **Subsequent requests:** <100ms (retrieved from database)
- **Caching:** Permanent (stored in `assessment.aiRiskAnalysis` field)

### Token Usage
- **Per key findings call:** ~300-500 tokens
- **Per mitigation call:** ~500-800 tokens
- **Total per assessment:** ~2,000-5,000 tokens (depending on gap count)

### Rate Limiting
- **Max concurrent requests:** 5
- **Queue mechanism:** Requests wait for available capacity
- **Timeout:** OpenAI client default (30 seconds)

---

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...          # OpenAI API key

# Optional
OPENAI_MODEL=gpt-4o-mini       # Default: gpt-4o-mini
```

### Model Selection
Current: **gpt-4o-mini**
- Cost-effective for structured outputs
- Fast response times
- Sufficient for compliance analysis

Alternatives:
- `gpt-4o`: Higher quality, more expensive
- `gpt-4-turbo`: Balance of quality and cost

---

## Example End-to-End Flow

### Scenario: Medium-sized fintech company completing financial crime assessment

**Input:**
```javascript
Organization: {
  size: "MEDIUM",
  industry: "Financial Services",
  geography: "EUROPE",
  annualRevenue: "10M_50M",
  complianceTeamSize: "SMALL"
}

Gaps Identified: 23 gaps across 4 categories
- KYC_AML: 8 gaps (3 CRITICAL, 3 HIGH, 2 MEDIUM)
- DATA_PROTECTION: 6 gaps (1 CRITICAL, 2 HIGH, 3 MEDIUM)
- TRANSACTION_MONITORING: 7 gaps (2 CRITICAL, 3 HIGH, 2 LOW)
- GOVERNANCE: 2 gaps (1 HIGH, 1 MEDIUM)
```

**AI Processing:**
```
Category 1: KYC_AML
  ├─ Generate 4 key findings (3s)
  ├─ Generate 4 mitigation strategies (3s)
  └─ Result: businessOwner="Chief Compliance Officer",
             budget="$45k-$75k",
             remediationDays=21,
             riskReduction=35%

Category 2: DATA_PROTECTION
  ├─ Generate 3 key findings (2s)
  ├─ Generate 4 mitigation strategies (3s)
  └─ Result: businessOwner="Chief Data Officer",
             budget="$30k-$50k",
             remediationDays=45,
             riskReduction=20%

... (repeat for other categories)
```

**Output:**
```javascript
{
  strategyMatrix: [
    {
      priority: 1,
      riskArea: "KYC/AML",
      businessOwner: "Chief Compliance Officer",  // AI-generated
      budget: "$45k-$75k",                       // AI-generated
      timeline: "2-4 weeks",                     // AI-generated
      remediationDays: 21,                       // AI-generated
      riskReductionPercent: 35                   // AI-generated
    },
    // ... 3 more rows
  ],
  metrics: {
    totalRiskReduction: 90,      // 35 + 20 + 25 + 10
    avgRemediationDays: 99,      // (21 + 45 + 90 + 240) / 4
    totalRemediationDays: 396    // 21 + 45 + 90 + 240
  }
}
```

**Frontend Display:**
```
Executive Summary:
  "Your organization demonstrates MODERATE compliance posture.
   Estimated remediation time: 3 months
   Expected improvement: 23% within 30 days"

Strategy Matrix:
  Priority 1: KYC/AML
    Business Owner: Chief Compliance Officer
    Budget: $45k-$75k
    Timeline: 2-4 weeks
    Risk Reduction: 35%
```

---

## Maintenance Notes

### When to Update Prompts

1. **Regulatory changes** - Update prompt requirements if new compliance standards emerge
2. **User feedback** - Adjust if AI recommendations consistently miss the mark
3. **Model upgrades** - Re-evaluate temperature and max_tokens when switching models
4. **Output quality** - Refine instructions if JSON parsing frequently fails

### Monitoring

Track these metrics:
- AI call success rate
- Fallback usage frequency
- Average generation time
- Token consumption
- User feedback on recommendation quality

### Cost Optimization

Current cost per assessment: ~$0.05-$0.10
- Most cost-effective model (gpt-4o-mini)
- Permanent caching (generated once)
- Rate limiting prevents runaway costs

---

## Related Documentation

- [OPENAI_COST_ANALYSIS_REPORT.md](./OPENAI_COST_ANALYSIS_REPORT.md) - Detailed cost breakdown
- [ASSESSMENT-RISK-GENERATION-FIX.md](./ASSESSMENT-RISK-GENERATION-FIX.md) - Previous risk generation fixes
- [architecture.md](./architecture.md) - Overall system architecture

---

**Questions or Issues?**
Contact the development team or file an issue in the repository.
