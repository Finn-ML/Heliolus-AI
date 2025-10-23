# Component Specification: Step 7 - Enhanced Results Overview

**Feature:** Real assessment results with evidence-weighted scoring visualization
**Priority:** P0 (Critical Path)
**Effort:** 3 days
**Story:** Phase 1 - Core Assessment Journey + Story 1.15

---

## 📋 Overview

### Purpose
Display comprehensive assessment results with evidence-weighted risk scores, section breakdowns, and methodology transparency. Replaces current mock data with real assessment execution results.

### User Story
> **As a** user who completed a risk assessment
> **I want to** see my risk score with clear evidence-based breakdown
> **So that** I can understand my compliance posture, trust the assessment methodology, and identify areas for improvement

### Success Criteria
- ✅ Overall risk score (0-100) displayed prominently
- ✅ Evidence distribution visualization (TIER_0/1/2 breakdown)
- ✅ Section-by-section score breakdown with evidence tier counts
- ✅ Confidence level indicator based on evidence quality
- ✅ Methodology explanation (expandable) for transparency
- ✅ Clear next steps (priorities questionnaire, gap analysis, vendor matching)
- ✅ No mock data - all values come from real backend calculation

---

## 🎨 User Experience

### Visual Design

```
┌──────────────────────────────────────────────────────────────────┐
│  [← Back]                                       Step 7 of 10     │
│                                                                   │
│  🎉 Your Risk Assessment Results                                 │
│  Based on 42 answers with evidence-weighted scoring              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │                        Risk Score                          │ │
│  │                                                            │ │
│  │                          67/100                            │ │
│  │                     MEDIUM RISK                            │ │
│  │                                                            │ │
│  │        ████████████████████████████░░░░░░░░░░░░░           │ │
│  │                                                            │ │
│  │               Confidence: MEDIUM                           │ │
│  │        Based on evidence tier distribution                 │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────┬─────────────────────────────────────┐  │
│  │ Evidence Quality    │  Section Breakdown                  │  │
│  │                     │                                     │  │
│  │       ┌───┐        │  📊 Customer Due Diligence          │  │
│  │       │   │  19%   │     Score: 72/100                   │  │
│  │   ┌───┤   ├───┐   │     Weight: 22% • Evidence: Mixed   │  │
│  │   │   │   │   │   │                                     │  │
│  │ ┌─┤   │   │   ├─┐ │  📊 Transaction Monitoring          │  │
│  │ │ │░░░│███│▓▓▓│ │ │     Score: 58/100                   │  │
│  │ └─┴───┴───┴───┴─┘ │     Weight: 18% • Evidence: Low     │  │
│  │  T0   T1   T2     │                                     │  │
│  │                     │  📊 Sanctions Screening            │  │
│  │ • Tier 0: 8 (19%) │     Score: 81/100                   │  │
│  │ • Tier 1: 12 (29%) │     Weight: 25% • Evidence: High   │  │
│  │ • Tier 2: 22 (52%) │                                     │  │
│  │                     │  [View All Sections →]             │  │
│  └─────────────────────┴─────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ℹ️ How is this score calculated?                           │ │
│  │                                                            │ │
│  │ Your risk score is calculated using evidence-weighted     │ │
│  │ methodology:                                               │ │
│  │                                                            │ │
│  │ 1. Question-Level Scoring                                 │ │
│  │    • Answer points × Evidence multiplier (0.6-1.0)        │ │
│  │    • TIER_0: ×0.6 | TIER_1: ×0.8 | TIER_2: ×1.0          │ │
│  │                                                            │ │
│  │ 2. Section-Level Aggregation                              │ │
│  │    • Weighted average of question scores                  │ │
│  │    • Foundational questions count more                    │ │
│  │                                                            │ │
│  │ 3. Overall Score                                          │ │
│  │    • Weighted sum of section scores                       │ │
│  │    • Sections weighted by compliance importance           │ │
│  │                                                            │ │
│  │ [View Detailed Methodology →]                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🎯 Next Steps                                              │ │
│  │                                                            │ │
│  │ 1. Complete priorities questionnaire (5 min)              │ │
│  │    Help us understand your organizational context         │ │
│  │    [Start Priorities →]                                   │ │
│  │                                                            │ │
│  │ 2. View detailed gap analysis                             │ │
│  │    Identify specific compliance gaps and priorities       │ │
│  │    [View Gaps →]                                          │ │
│  │                                                            │ │
│  │ 3. Explore vendor solutions                               │ │
│  │    Find vendors matched to your gaps                      │ │
│  │    [View Vendors →]                                       │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [← Back to Review]                    [Continue to Gaps →]     │
└──────────────────────────────────────────────────────────────────┘
```

### Risk Score Visualization States

**HIGH RISK (0-40):**
```
       35/100
    HIGH RISK
████████░░░░░░░░░░░░░░░░░░
🔴 Urgent attention required
```

**MEDIUM RISK (41-70):**
```
       67/100
   MEDIUM RISK
████████████████████░░░░░░░
🟡 Improvement opportunities exist
```

**LOW RISK (71-100):**
```
       88/100
    LOW RISK
████████████████████████████
🟢 Strong compliance posture
```

---

## 🏗️ Component Architecture

### Component Tree

```
EnhancedResultsStep/
├── JourneyStepContainer (shared)
│   ├── ResultsHeader
│   │   └── Title + Subtitle with answer count
│   │
│   ├── OverallScoreCard
│   │   ├── ScoreCircle (large animated number)
│   │   ├── RiskLevelBadge (HIGH/MEDIUM/LOW)
│   │   ├── ScoreProgressBar
│   │   └── ConfidenceBadge
│   │
│   ├── TwoColumnLayout
│   │   ├── LeftColumn: EvidenceQualityPanel
│   │   │   ├── EvidenceDistributionChart (donut chart from Story 1.12)
│   │   │   └── EvidenceLegend
│   │   │       ├── Tier0Badge + count
│   │   │       ├── Tier1Badge + count
│   │   │       └── Tier2Badge + count
│   │   │
│   │   └── RightColumn: SectionBreakdownPanel
│   │       └── SectionScoreCard[]
│   │           ├── SectionIcon
│   │           ├── SectionName
│   │           ├── SectionScore (mini bar)
│   │           ├── SectionWeight
│   │           └── EvidenceQuality (High/Medium/Low)
│   │
│   ├── MethodologyAccordion (expandable)
│   │   ├── AccordionTrigger: "How is this score calculated?"
│   │   └── AccordionContent
│   │       ├── QuestionLevelExplanation
│   │       ├── SectionLevelExplanation
│   │       ├── OverallScoreExplanation
│   │       └── DetailedMethodologyLink
│   │
│   ├── NextStepsPanel
│   │   └── NextStepCard[]
│   │       ├── StepNumber
│   │       ├── StepTitle
│   │       ├── StepDescription
│   │       └── StepCTA (button)
│   │
│   └── JourneyNavigation (shared)
│       ├── BackButton
│       └── ContinueButton
```

### File Structure

```
frontend/src/components/assessment/results/
├── EnhancedResultsStep.tsx              (main component - 200 lines)
├── OverallScoreCard.tsx                 (score display - 120 lines)
├── EvidenceQualityPanel.tsx             (evidence viz - 100 lines)
├── SectionBreakdownPanel.tsx            (section list - 120 lines)
├── MethodologyAccordion.tsx             (methodology - 100 lines)
├── NextStepsPanel.tsx                   (next steps - 80 lines)
│
├── score/
│   ├── ScoreCircle.tsx                  (animated score - 80 lines)
│   ├── RiskLevelBadge.tsx               (HIGH/MEDIUM/LOW - 40 lines)
│   ├── ScoreProgressBar.tsx             (progress bar - 40 lines)
│   └── ConfidenceBadge.tsx              (confidence level - 40 lines)
│
├── evidence/
│   ├── EvidenceDistributionChart.tsx    (reuse from Story 1.12)
│   ├── EvidenceLegend.tsx               (legend - 50 lines)
│   └── EvidenceTierIndicator.tsx        (reuse from Story 1.12)
│
├── section/
│   ├── SectionScoreCard.tsx             (section card - 80 lines)
│   └── SectionScoreMiniBar.tsx          (mini progress bar - 40 lines)
│
├── __tests__/
│   ├── EnhancedResultsStep.test.tsx
│   ├── OverallScoreCard.test.tsx
│   ├── EvidenceQualityPanel.test.tsx
│   └── SectionBreakdownPanel.test.tsx
│
└── types/
    └── results.types.ts                 (TypeScript types)
```

---

## 💻 Component Specifications

### 1. EnhancedResultsStep.tsx

**Purpose:** Main container orchestrating results display

**Props:**
```typescript
interface EnhancedResultsStepProps {
  assessmentId: string;
  onContinue: () => void;
  onBack: () => void;
}
```

**API Integration:**
```typescript
// NEW ENDPOINT - Must be created by backend team
const { data: results, isLoading, isError } = useQuery({
  queryKey: ['assessment-results', assessmentId],
  queryFn: () => api.getEnhancedResults(assessmentId),
  staleTime: 60 * 1000, // Cache for 1 minute
});
```

**Implementation:**
```tsx
export const EnhancedResultsStep: React.FC<EnhancedResultsStepProps> = ({
  assessmentId,
  onContinue,
  onBack
}) => {
  const { data: results, isLoading, isError, refetch } = useQuery({
    queryKey: ['assessment-results', assessmentId],
    queryFn: () => api.getEnhancedResults(assessmentId),
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <JourneyStepContainer>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
          <p className="mt-4 text-lg text-gray-600">Calculating your risk score...</p>
          <p className="text-sm text-gray-500">Analyzing 42 answers with evidence weighting</p>
        </div>
      </JourneyStepContainer>
    );
  }

  if (isError || !results) {
    return (
      <JourneyStepContainer>
        <ErrorState
          message="Failed to calculate assessment results"
          onRetry={refetch}
        />
      </JourneyStepContainer>
    );
  }

  return (
    <JourneyStepContainer>
      <JourneyStepHeader
        title="🎉 Your Risk Assessment Results"
        description={`Based on ${results.totalAnswers} answers with evidence-weighted scoring`}
        stepNumber={7}
        totalSteps={10}
      />

      {/* Overall score card */}
      <OverallScoreCard
        score={results.overallScore}
        confidenceLevel={results.confidenceLevel}
        totalAnswers={results.totalAnswers}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Evidence quality */}
        <EvidenceQualityPanel
          distribution={results.evidenceDistribution}
        />

        {/* Section breakdown */}
        <SectionBreakdownPanel
          sections={results.sectionBreakdown}
        />
      </div>

      {/* Methodology explanation */}
      <MethodologyAccordion
        methodology={results.methodology}
      />

      {/* Next steps */}
      <NextStepsPanel
        assessmentId={assessmentId}
        hasPriorities={results.hasPriorities}
      />

      {/* Navigation */}
      <JourneyNavigation
        onBack={onBack}
        onContinue={onContinue}
        continueLabel="Continue to Gap Analysis"
      />
    </JourneyStepContainer>
  );
};
```

---

### 2. OverallScoreCard.tsx

**Purpose:** Large score display with risk level and confidence

**Implementation:**
```tsx
export const OverallScoreCard: React.FC<OverallScoreCardProps> = ({
  score,
  confidenceLevel,
  totalAnswers
}) => {
  const getRiskLevel = (score: number) => {
    if (score <= 40) return { level: 'HIGH', color: 'red', icon: AlertTriangle };
    if (score <= 70) return { level: 'MEDIUM', color: 'yellow', icon: AlertCircle };
    return { level: 'LOW', color: 'green', icon: CheckCircle };
  };

  const risk = getRiskLevel(score);

  return (
    <Card className="p-8 text-center bg-gradient-to-br from-white to-gray-50">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Risk Score</h3>

      {/* Animated score circle */}
      <ScoreCircle score={score} color={risk.color} />

      {/* Risk level badge */}
      <div className="mt-4 flex justify-center">
        <RiskLevelBadge level={risk.level} color={risk.color} Icon={risk.icon} />
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <ScoreProgressBar score={score} color={risk.color} />
      </div>

      {/* Confidence */}
      <div className="mt-6 flex justify-center items-center gap-2">
        <span className="text-sm text-gray-600">Confidence:</span>
        <ConfidenceBadge level={confidenceLevel} />
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Based on evidence tier distribution
      </p>
    </Card>
  );
};
```

---

### 3. EvidenceQualityPanel.tsx

**Purpose:** Visualize evidence tier distribution using Story 1.12 component

**Implementation:**
```tsx
export const EvidenceQualityPanel: React.FC<EvidenceQualityPanelProps> = ({
  distribution
}) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Evidence Quality
      </h3>

      {/* Reuse EvidenceDistributionChart from Story 1.12 */}
      <EvidenceTierDistribution
        tier0Count={distribution.tier0Count}
        tier1Count={distribution.tier1Count}
        tier2Count={distribution.tier2Count}
        size="large"
        showPercentages
      />

      {/* Legend */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EvidenceTierBadge tier="TIER_0" size="sm" />
            <span className="text-sm text-gray-600">Self-declared</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {distribution.tier0Count} ({distribution.tier0Percentage}%)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EvidenceTierBadge tier="TIER_1" size="sm" />
            <span className="text-sm text-gray-600">Claimed with evidence</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {distribution.tier1Count} ({distribution.tier1Percentage}%)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EvidenceTierBadge tier="TIER_2" size="sm" />
            <span className="text-sm text-gray-600">Pre-filled from docs</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {distribution.tier2Count} ({distribution.tier2Percentage}%)
          </span>
        </div>
      </div>
    </Card>
  );
};
```

---

### 4. SectionBreakdownPanel.tsx

**Purpose:** List section scores with mini visualizations

**Implementation:**
```tsx
export const SectionBreakdownPanel: React.FC<SectionBreakdownPanelProps> = ({
  sections
}) => {
  const [expanded, setExpanded] = useState(false);
  const displaySections = expanded ? sections : sections.slice(0, 3);

  const getEvidenceQuality = (section: SectionBreakdown) => {
    const tier2Pct = (section.evidenceCounts.tier2 /
      (section.evidenceCounts.tier0 + section.evidenceCounts.tier1 + section.evidenceCounts.tier2)) * 100;

    if (tier2Pct >= 60) return { label: 'High', color: 'green' };
    if (tier2Pct >= 30) return { label: 'Medium', color: 'yellow' };
    return { label: 'Low', color: 'gray' };
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Section Breakdown
      </h3>

      <div className="space-y-4">
        {displaySections.map((section) => {
          const evidenceQuality = getEvidenceQuality(section);

          return (
            <div key={section.sectionId} className="border-l-4 border-cyan-500 pl-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{section.sectionName}</h4>
                  <p className="text-xs text-gray-600">
                    Weight: {section.weight}% • Evidence: {evidenceQuality.label}
                  </p>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {section.score}/100
                </span>
              </div>

              {/* Mini progress bar */}
              <SectionScoreMiniBar score={section.score} />
            </div>
          );
        })}
      </div>

      {sections.length > 3 && (
        <Button
          variant="link"
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full"
        >
          {expanded ? 'Show Less ↑' : `View All Sections (${sections.length - 3} more) ↓`}
        </Button>
      )}
    </Card>
  );
};
```

---

### 5. MethodologyAccordion.tsx

**Purpose:** Expandable methodology explanation for transparency

**Implementation:**
```tsx
export const MethodologyAccordion: React.FC<MethodologyAccordionProps> = ({
  methodology
}) => {
  return (
    <Accordion type="single" collapsible className="mt-6">
      <AccordionItem value="methodology" className="border rounded-lg px-6">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-cyan-500" />
            <span className="font-medium">How is this score calculated?</span>
          </div>
        </AccordionTrigger>

        <AccordionContent className="pt-4 pb-6 space-y-6">
          {/* Question-level scoring */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              1. Question-Level Scoring
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Each answer receives points based on your response and evidence quality:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Answer points × Evidence multiplier</li>
              <li>• TIER_0 (Self-declared): ×0.6 multiplier</li>
              <li>• TIER_1 (Claimed with evidence): ×0.8 multiplier</li>
              <li>• TIER_2 (Pre-filled from documents): ×1.0 multiplier</li>
            </ul>
          </div>

          {/* Section-level aggregation */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              2. Section-Level Aggregation
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Questions within each section are weighted:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Foundational questions have higher weight</li>
              <li>• Section score = weighted average of question scores</li>
            </ul>
          </div>

          {/* Overall score */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              3. Overall Risk Score
            </h4>
            <p className="text-sm text-gray-600">
              Sections are combined based on compliance importance. High-impact areas
              (e.g., Sanctions Screening at 25%) contribute more to your overall score.
            </p>
          </div>

          {/* Link to full methodology */}
          <Button variant="link" className="p-0 h-auto text-cyan-600">
            View Detailed Methodology Documentation →
          </Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
```

---

## 🔌 API Integration

### NEW ENDPOINT REQUIRED: GET /api/assessments/:id/enhanced-results

**Status:** ⚠️ MUST BE CREATED BY BACKEND TEAM
**Priority:** P0 - Blocks Phase 1 Week 3
**Backend Story:** Story 1.15

**Request:**
```typescript
GET /api/assessments/:assessmentId/enhanced-results
Authorization: Bearer {token}
```

**Response Schema:**
```typescript
interface EnhancedResultsResponse {
  assessmentId: string;
  overallScore: number; // 0-100
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  totalAnswers: number;

  evidenceDistribution: {
    tier0Count: number;
    tier1Count: number;
    tier2Count: number;
    tier0Percentage: number; // 0-100
    tier1Percentage: number; // 0-100
    tier2Percentage: number; // 0-100
  };

  sectionBreakdown: Array<{
    sectionId: string;
    sectionName: string;
    score: number; // 0-100
    weight: number; // section weight percentage (0-100)
    weightedContribution: number; // how much this section contributed to overall
    evidenceCounts: {
      tier0: number;
      tier1: number;
      tier2: number;
    };
  }>;

  methodology: {
    scoringApproach: string; // Description of evidence-weighted scoring
    weightingExplanation: string; // How questions and sections are weighted
    evidenceImpact: string; // How evidence tiers affect scores
  };

  hasPriorities: boolean; // Whether user completed priorities questionnaire
}
```

**Backend Calculation Logic:**
```typescript
// Pseudocode for backend endpoint

1. Fetch assessment with all answers and their evidence tiers
2. Fetch template with section/question weights

3. For each answer:
   - Get answer points (from question option)
   - Apply evidence tier multiplier (0.6, 0.8, or 1.0)
   - Apply question weight within section
   - Calculate weighted question score

4. For each section:
   - Sum weighted question scores
   - Divide by sum of question weights
   - Get section score (0-100)

5. Calculate overall score:
   - Multiply each section score by section weight
   - Sum weighted section scores
   - Result is overall score (0-100)

6. Calculate confidence level:
   - Count evidence tier distribution
   - If >60% TIER_2: HIGH confidence
   - If >30% TIER_2: MEDIUM confidence
   - Else: LOW confidence

7. Return formatted response
```

**API Client Method:**
```typescript
// frontend/src/lib/api.ts
export const api = {
  async getEnhancedResults(assessmentId: string): Promise<EnhancedResultsResponse> {
    const response = await fetch(
      `${API_URL}/api/assessments/${assessmentId}/enhanced-results`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch assessment results');
    }

    return response.json();
  },
};
```

---

## 📱 Responsive Design

**Desktop (≥1024px):**
- Two-column layout for evidence + sections
- Large score circle (200px)
- All sections visible (expandable)

**Tablet (768px-1023px):**
- Stacked layout (evidence above sections)
- Medium score circle (150px)
- First 3 sections visible

**Mobile (<768px):**
- Single column stack
- Smaller score circle (120px)
- Compact section cards
- Methodology accordion collapsed by default

---

## ♿ Accessibility

**WCAG 2.1 AA:**
- Screen reader announces score with risk level context
- Keyboard navigation for accordion
- Color-blind safe (don't rely on color alone for risk level)
- Focus indicators on all interactive elements
- Alt text on all visualizations

---

## 🧪 Testing

### Unit Tests

```typescript
describe('EnhancedResultsStep', () => {
  it('displays overall score correctly', () => {
    const { getByText } = render(<EnhancedResultsStep results={mockResults} />);
    expect(getByText('67/100')).toBeInTheDocument();
    expect(getByText('MEDIUM RISK')).toBeInTheDocument();
  });

  it('shows evidence distribution chart', () => {
    const { getByText } = render(<EnhancedResultsStep results={mockResults} />);
    expect(getByText('8 (19%)')).toBeInTheDocument(); // TIER_0
    expect(getByText('12 (29%)')).toBeInTheDocument(); // TIER_1
    expect(getByText('22 (52%)')).toBeInTheDocument(); // TIER_2
  });

  it('displays section breakdown', () => {
    const { getByText } = render(<SectionBreakdownPanel sections={mockSections} />);
    expect(getByText('Customer Due Diligence')).toBeInTheDocument();
    expect(getByText('72/100')).toBeInTheDocument();
  });

  it('expands methodology accordion', () => {
    const { getByText, queryByText } = render(<MethodologyAccordion {...props} />);

    expect(queryByText('Question-Level Scoring')).not.toBeVisible();
    fireEvent.click(getByText('How is this score calculated?'));
    expect(queryByText('Question-Level Scoring')).toBeVisible();
  });

  it('shows loading state while calculating', () => {
    const { getByText } = render(<EnhancedResultsStep isLoading />);
    expect(getByText('Calculating your risk score...')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
describe('Results Integration', () => {
  it('fetches and displays real assessment results', async () => {
    const { findByText } = render(<EnhancedResultsStep assessmentId="test-123" />);

    expect(await findByText(/67\/100/)).toBeInTheDocument();
    expect(await findByText('MEDIUM RISK')).toBeInTheDocument();
  });

  it('handles backend error gracefully', async () => {
    mockApiError();
    const { findByText, getByRole } = render(<EnhancedResultsStep assessmentId="test-123" />);

    expect(await findByText('Failed to calculate assessment results')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
```

---

## 🚀 Performance

**Optimization:**
- Cache results for 1 minute (avoid recalculation)
- Lazy load methodology content
- Memoize evidence distribution calculations
- Optimize chart rendering (canvas vs SVG)

**Targets:**
- Initial render: <800ms
- Chart animation: 60fps
- Score counter animation: smooth 2-second count-up

---

## 🎭 Edge Cases

1. **All TIER_0 answers:** Show LOW confidence, suggest uploading documents
2. **Perfect score (100):** Special congratulations message
3. **Very low score (<20):** Emphasize next steps, offer support resources
4. **No sections:** Error state (shouldn't happen, template validation)
5. **Incomplete assessment:** Redirect back to questionnaire

---

**Backend Team Action Required:** Create `GET /api/assessments/:id/enhanced-results` endpoint by Week 2 to unblock Phase 1. ✅

*Component Specification v1.0 - Created October 9, 2025*
