# Phase 1 Implementation Plan: Core Assessment Journey

**Status:** ✅ APPROVED
**Timeline:** 3-4 weeks (October 9 - November 6, 2025)
**Goal:** Make assessment journey functional with real data execution

---

## 📋 Overview

Phase 1 focuses on the **critical path** to make the assessment journey production-ready. This replaces the current mock data implementation with real assessment execution.

### Success Criteria
- ✅ Users can select a template without leaving the journey
- ✅ Users can complete a guided assessment questionnaire
- ✅ Results display real data from completed assessments
- ✅ No mock data visible in the journey
- ✅ Journey completion rate > 60%

---

## 🎯 Phase 1 Deliverables

### 1. Step 3: Template Selection (NEW)
**Effort:** 2 days
**Priority:** P0 (Critical Path)
**Dependencies:** None

**Current Issue:** Template selection redirects to `/assessment-templates`, breaking journey flow.

**Solution:** Inline template selection component within journey.

**Components to Build:**
- `TemplateSelectionStep.tsx` - Main step container
- `TemplateCard.tsx` - Individual template card with radio selection
- `TemplateCategoryFilter.tsx` - Filter by category (Financial Crime, Trade Compliance, etc.)

**Files to Create:**
```
frontend/src/components/assessment/
  ├── TemplateSelectionStep.tsx
  ├── TemplateCard.tsx
  └── TemplateCategoryFilter.tsx
```

**API Integration:**
- Endpoint: `GET /api/templates` (existing)
- Response: Array of templates with metadata

---

### 2. Step 5: Guided Assessment Questionnaire (NEW - CRITICAL)
**Effort:** 5 days
**Priority:** P0 (Critical Path)
**Dependencies:** Step 3 must be complete

**Current Issue:** This feature is completely missing. Users cannot actually answer assessment questions.

**Solution:** Multi-section questionnaire wizard with evidence tier integration.

**Components to Build:**
- `GuidedQuestionnaireStep.tsx` - Main step container with section navigation
- `SectionProgress.tsx` - Progress indicator showing section X of Y
- `QuestionRenderer.tsx` - Renders question based on type (multiple choice, text, rating)
- `AnswerInput.tsx` - Input components for different question types
- `EvidenceIndicator.tsx` - Shows evidence tier for pre-filled answers
- `WeightIndicator.tsx` - Visual indicator of question importance
- `QuestionnaireReview.tsx` - Final review before submission

**Files to Create:**
```
frontend/src/components/assessment/questionnaire/
  ├── GuidedQuestionnaireStep.tsx
  ├── SectionProgress.tsx
  ├── QuestionRenderer.tsx
  ├── AnswerInput.tsx
  ├── EvidenceIndicator.tsx
  ├── WeightIndicator.tsx
  └── QuestionnaireReview.tsx
```

**API Integration:**
- Endpoint: `GET /api/assessments/:id/questions` (existing - from template)
- Endpoint: `POST /api/assessments/:id/answers` (existing)
- Endpoint: `PUT /api/assessments/:id/answers/:answerId` (existing)
- Endpoint: `POST /api/assessments/:id/complete` (existing)

**Features:**
- Section-by-section navigation
- Auto-save every 30 seconds
- Pre-filled answers from document analysis
- Evidence tier badges on pre-filled answers
- Question weight visualization
- Progress tracking
- Draft save functionality

---

### 3. Step 7: Results Overview (ENHANCED)
**Effort:** 3 days
**Priority:** P0 (Critical Path)
**Dependencies:** Backend endpoint + Step 5 complete

**Current Issue:** Displays hardcoded mock data instead of real assessment results.

**Solution:** Replace mock data with real results from enhanced backend endpoint.

**Components to Build:**
- `EnhancedResultsStep.tsx` - Main results container
- `OverallRiskScore.tsx` - Large score display with confidence indicator
- `EvidenceDistributionChart.tsx` - Donut chart using Story 1.12 component
- `SectionBreakdown.tsx` - Section scores with evidence tier breakdown
- `MethodologyExplanation.tsx` - Expandable scoring methodology
- `NextStepsPrompt.tsx` - CTA for next actions (priorities, marketplace)

**Files to Create:**
```
frontend/src/components/assessment/results/
  ├── EnhancedResultsStep.tsx
  ├── OverallRiskScore.tsx
  ├── EvidenceDistributionChart.tsx
  ├── SectionBreakdown.tsx
  ├── MethodologyExplanation.tsx
  └── NextStepsPrompt.tsx
```

**API Integration:**
- **NEW ENDPOINT REQUIRED:** `GET /api/assessments/:id/enhanced-results`
  - Returns: Overall score, evidence distribution, section breakdowns, confidence level
  - **Status:** ⚠️ BLOCKED - Backend must create this endpoint first

**Backend Requirements:**
```typescript
// Required response structure
interface EnhancedResultsResponse {
  assessmentId: string;
  overallScore: number; // 0-100
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  evidenceDistribution: {
    tier0Count: number;
    tier1Count: number;
    tier2Count: number;
    tier0Percentage: number;
    tier1Percentage: number;
    tier2Percentage: number;
  };
  sectionBreakdown: Array<{
    sectionId: string;
    sectionName: string;
    score: number;
    weight: number;
    weightedContribution: number;
    evidenceCounts: {
      tier0: number;
      tier1: number;
      tier2: number;
    };
  }>;
  methodology: {
    scoringApproach: string;
    weightingExplanation: string;
    evidenceImpact: string;
  };
}
```

---

### 4. Journey Navigation Updates
**Effort:** 1 day
**Priority:** P0 (Critical Path)
**Dependencies:** None

**Changes Needed:**
- Update `AssessmentJourney.tsx` steps array to include new Step 3 and Step 5
- Remove mock data from steps 4-7
- Update step transitions to handle new flow
- Add step validation (can't proceed to Step 5 without Step 3 completion)

**File to Modify:**
- `frontend/src/pages/AssessmentJourney.tsx:80-123` (steps array)
- `frontend/src/pages/AssessmentJourney.tsx:656-987` (remove mock data)

---

### 5. Shared Component Library
**Effort:** 1 day
**Priority:** P1 (Supporting)
**Dependencies:** None

**Purpose:** Create reusable components used across multiple journey steps.

**Components to Build:**
- `JourneyStepContainer.tsx` - Consistent layout wrapper for all steps
- `JourneyStepHeader.tsx` - Step title, description, progress indicator
- `JourneyNavigation.tsx` - Back/Continue buttons with consistent styling
- `JourneyProgressBar.tsx` - Visual progress indicator (steps completed)
- `LoadingState.tsx` - Consistent loading indicator for async operations
- `ErrorState.tsx` - Consistent error display with retry functionality

**Files to Create:**
```
frontend/src/components/assessment/shared/
  ├── JourneyStepContainer.tsx
  ├── JourneyStepHeader.tsx
  ├── JourneyNavigation.tsx
  ├── JourneyProgressBar.tsx
  ├── LoadingState.tsx
  └── ErrorState.tsx
```

---

## 📅 Implementation Schedule

### Week 1 (Oct 9-15)
**Focus:** Foundation + Template Selection

**Day 1-2:**
- [ ] Create shared component library (Day 1)
- [ ] Build Step 3: Template Selection (Day 2)
- [ ] Backend: Start work on `GET /assessments/:id/enhanced-results` endpoint

**Day 3-5:**
- [ ] Begin Step 5: Guided Questionnaire (core structure)
- [ ] Build section navigation and progress tracking
- [ ] Backend: Complete enhanced-results endpoint

### Week 2 (Oct 16-22)
**Focus:** Guided Questionnaire (Critical Path)

**Day 6-10:**
- [ ] Complete Step 5: Guided Questionnaire
- [ ] Question renderer for all question types
- [ ] Evidence tier integration
- [ ] Auto-save functionality
- [ ] Review and submission flow
- [ ] Testing with real assessment templates

### Week 3 (Oct 23-29)
**Focus:** Results + Integration

**Day 11-13:**
- [ ] Build Step 7: Enhanced Results (using new backend endpoint)
- [ ] Evidence distribution visualization
- [ ] Section breakdown display
- [ ] Methodology explanation

**Day 14-15:**
- [ ] Update AssessmentJourney.tsx navigation
- [ ] Remove all mock data
- [ ] Integration testing of full flow

### Week 4 (Oct 30 - Nov 6)
**Focus:** Testing + Polish

**Day 16-18:**
- [ ] End-to-end testing with multiple templates
- [ ] Mobile responsiveness testing
- [ ] Error handling and edge cases
- [ ] Performance optimization

**Day 19-20:**
- [ ] User acceptance testing with 3-5 users
- [ ] Bug fixes and refinements
- [ ] Documentation updates
- [ ] **Phase 1 COMPLETE** ✅

---

## 🔧 Technical Specifications

### State Management
**Approach:** React Hook Form + TanStack Query

```typescript
// Assessment journey state
interface AssessmentJourneyState {
  assessmentId: string;
  currentStep: number;
  selectedTemplateId?: string;
  completedSteps: number[];
  lastSaved?: Date;
}

// Use TanStack Query for API calls
const { data: template } = useQuery({
  queryKey: ['template', templateId],
  queryFn: () => api.getTemplate(templateId)
});

// Use React Hook Form for questionnaire
const form = useForm<AssessmentAnswers>({
  defaultValues: preFilledAnswers,
  mode: 'onBlur'
});
```

### Auto-Save Strategy
```typescript
// Auto-save every 30 seconds or on blur
const { mutate: saveAnswers } = useMutation({
  mutationFn: (answers) => api.saveAssessmentAnswers(assessmentId, answers),
  onSuccess: () => {
    toast.success('Progress saved');
  }
});

// Debounced auto-save hook
useEffect(() => {
  const timeout = setTimeout(() => {
    const answers = form.getValues();
    saveAnswers(answers);
  }, 30000);

  return () => clearTimeout(timeout);
}, [form.watch()]);
```

### Loading States
```typescript
// Consistent loading pattern
{isLoading ? (
  <LoadingState message="Loading assessment questions..." />
) : isError ? (
  <ErrorState
    message="Failed to load questions"
    onRetry={() => refetch()}
  />
) : (
  <QuestionnaireContent data={data} />
)}
```

### Responsive Design
- **Desktop (>1024px):** Full sidebar navigation + main content
- **Tablet (768-1024px):** Collapsible sidebar + main content
- **Mobile (<768px):** Bottom navigation + main content (full width)

### Animation Guidelines
```typescript
// Framer Motion for step transitions
const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

<motion.div
  variants={stepVariants}
  initial="enter"
  animate="center"
  exit="exit"
  transition={{ duration: 0.3 }}
>
  {/* Step content */}
</motion.div>
```

---

## 🧪 Testing Strategy

### Unit Tests
**Tool:** Vitest + React Testing Library

**Coverage Requirements:**
- All shared components: 90%+ coverage
- Critical path components: 85%+ coverage
- Utility functions: 95%+ coverage

**Test Files to Create:**
```
frontend/src/components/assessment/
  ├── __tests__/
      ├── TemplateSelectionStep.test.tsx
      ├── GuidedQuestionnaireStep.test.tsx
      ├── EnhancedResultsStep.test.tsx
      └── shared/
          ├── JourneyStepContainer.test.tsx
          └── JourneyNavigation.test.tsx
```

### Integration Tests
**Scenarios:**
1. Complete template selection → questionnaire → results flow
2. Auto-save functionality during questionnaire
3. Evidence tier display on pre-filled answers
4. Section navigation and progress tracking
5. Error handling (network failures, invalid data)

### Manual Testing Checklist
- [ ] Desktop Chrome: Complete full journey
- [ ] Desktop Firefox: Complete full journey
- [ ] Desktop Safari: Complete full journey
- [ ] Mobile iOS Safari: Complete full journey
- [ ] Mobile Android Chrome: Complete full journey
- [ ] Tablet iPad: Complete full journey
- [ ] Test with slow network (3G simulation)
- [ ] Test with offline → online transition
- [ ] Test with multiple templates (short vs long)
- [ ] Test with no documents uploaded
- [ ] Test with documents uploaded (pre-filled answers)

---

## 🚧 Backend Dependencies

### Critical Blocker: Enhanced Results Endpoint
**Status:** ⚠️ MUST BE CREATED

**Endpoint:** `GET /api/assessments/:id/enhanced-results`

**Required By:** Week 3 (Oct 23)

**Implementation Requirements:**
1. Calculate overall risk score (0-100) using two-level weighted scoring
2. Determine confidence level based on evidence tier distribution
3. Aggregate evidence tier counts across all answers
4. Calculate section scores with weighted contributions
5. Generate methodology explanation text

**Backend Story Reference:** Story 1.15

**Backend Team Action:** Create this endpoint in Week 1-2 to unblock Phase 1.

---

## 📊 Success Metrics

### Functional Metrics
| Metric | Target |
|--------|--------|
| Journey Completion Rate | >60% |
| Time to Complete Assessment | <30 minutes |
| Auto-save Success Rate | >99% |
| API Error Rate | <0.5% |
| Page Load Time (P95) | <2 seconds |

### Quality Metrics
| Metric | Target |
|--------|--------|
| Unit Test Coverage | >85% |
| Integration Test Pass Rate | 100% |
| Accessibility Score (Lighthouse) | >90 |
| Performance Score (Lighthouse) | >85 |
| Zero Critical Bugs | ✅ |

### User Experience Metrics
| Metric | Target |
|--------|--------|
| User Satisfaction (post-test survey) | >7/10 |
| Task Success Rate | >90% |
| Average User Errors | <2 per journey |
| Help Documentation Access | <20% |

---

## 🎨 Design Specifications

### Color Palette (Existing)
```css
/* Risk score colors */
--score-low: #10b981 (green - low risk)
--score-medium: #f59e0b (yellow - medium risk)
--score-high: #ef4444 (red - high risk)

/* Evidence tier colors (from Story 1.12) */
--tier-0: #6b7280 (gray)
--tier-1: #3b82f6 (blue)
--tier-2: #10b981 (green)

/* Journey progress */
--progress-complete: #10b981 (cyan/green)
--progress-current: #ec4899 (pink)
--progress-pending: #4b5563 (gray)
```

### Typography
```css
/* Step titles */
font-family: Inter, sans-serif;
font-size: 2rem;
font-weight: 600;
line-height: 1.2;

/* Question text */
font-size: 1.125rem;
font-weight: 500;
line-height: 1.5;

/* Body text */
font-size: 1rem;
font-weight: 400;
line-height: 1.6;
```

### Spacing System
```css
/* Based on Tailwind spacing scale */
--space-xs: 0.25rem; /* 4px */
--space-sm: 0.5rem;  /* 8px */
--space-md: 1rem;    /* 16px */
--space-lg: 1.5rem;  /* 24px */
--space-xl: 2rem;    /* 32px */
--space-2xl: 3rem;   /* 48px */
```

---

## ⚠️ Risk Mitigation

### Risk 1: Backend Endpoint Delays
**Probability:** Medium
**Impact:** High (blocks Step 7 Results)

**Mitigation:**
- Week 1: Backend team starts endpoint immediately
- Week 2: Frontend builds Results UI with mock data
- Week 3: Swap mock for real endpoint when ready
- Contingency: If not ready by Week 3, Phase 1 launches with "Results Coming Soon" placeholder

### Risk 2: Questionnaire Takes Longer Than Estimated
**Probability:** High (most complex component)
**Impact:** High (critical path blocker)

**Mitigation:**
- Start Step 5 in Week 1 (earliest possible)
- Build MVP first (basic question types only)
- Add advanced question types incrementally
- Allocate 5 full days instead of 3-4
- Pair programming for complex logic

### Risk 3: User Testing Reveals Major UX Issues
**Probability:** Medium
**Impact:** Medium (requires rework)

**Mitigation:**
- Internal testing with 2-3 team members in Week 3
- Quick fixes before user testing in Week 4
- Build components with flexibility (easy to modify)
- Keep Week 4 buffer for refinements

### Risk 4: Performance Issues with Large Templates
**Probability:** Low
**Impact:** Medium

**Mitigation:**
- Test with largest templates early (Week 2)
- Implement pagination/virtualization if needed
- Optimize re-renders with React.memo
- Lazy load sections as user progresses

### Risk 5: Mobile Experience Inadequate
**Probability:** Medium
**Impact:** Medium

**Mitigation:**
- Mobile-first design approach from start
- Test on mobile weekly, not just at end
- Use Radix UI primitives (mobile-optimized)
- Responsive design built into shared components

---

## 📝 Documentation Requirements

### For Developers
- [ ] Component API documentation (props, events)
- [ ] State management patterns
- [ ] API integration guide
- [ ] Testing guidelines
- [ ] Troubleshooting common issues

### For Users
- [ ] Assessment journey walkthrough
- [ ] Help text for each step
- [ ] Tooltips for evidence tiers
- [ ] FAQ for common questions

### For Product Team
- [ ] Feature overview
- [ ] Success metrics dashboard
- [ ] User feedback collection process
- [ ] Roadmap for Phase 2

---

## ✅ Definition of Done

Phase 1 is complete when:

- [x] All 5 deliverables built and tested
- [x] Backend endpoint `GET /assessments/:id/enhanced-results` implemented
- [x] Unit test coverage >85%
- [x] All integration tests passing
- [x] Manual testing completed on desktop + mobile
- [x] No mock data visible in journey
- [x] User testing completed with 3-5 users
- [x] Critical bugs resolved (P0/P1)
- [x] Documentation updated
- [x] Code reviewed and merged to main branch
- [x] Deployed to staging environment
- [x] Journey completion rate >60% (measured over 1 week)

---

## 🚀 Next Steps

### Immediate Actions (This Week)
1. **Backend Team:** Create `GET /assessments/:id/enhanced-results` endpoint (URGENT)
2. **Frontend Team:** Start shared component library (Day 1)
3. **Frontend Team:** Build Step 3: Template Selection (Day 2)
4. **PM:** Schedule user testing sessions for Week 4

### Week 2-3 Actions
5. Build Step 5: Guided Questionnaire (critical path)
6. Build Step 7: Enhanced Results (needs backend endpoint)
7. Update AssessmentJourney.tsx navigation
8. Integration testing

### Week 4 Actions
9. User acceptance testing
10. Bug fixes and polish
11. Documentation
12. **Phase 1 Launch** 🎉

---

## 📞 Communication Plan

### Daily Standups
- **Time:** 9:30 AM
- **Duration:** 15 minutes
- **Attendees:** Dev team, Backend team, PM
- **Focus:** Progress, blockers, daily goals

### Weekly Reviews
- **Time:** Friday 3:00 PM
- **Duration:** 45 minutes
- **Attendees:** Full team + stakeholders
- **Focus:** Demo progress, review metrics, plan next week

### Backend Sync
- **Time:** Monday/Thursday 2:00 PM
- **Duration:** 30 minutes
- **Attendees:** Frontend lead + Backend lead
- **Focus:** API integration, endpoint status, data contracts

---

## 💾 Handoff to Dev Team

This implementation plan is ready for the **Dev Agent (James)** to begin execution.

**Recommended Starting Point:**
1. Review this plan in detail
2. Read component specifications (creating next)
3. Start with shared component library (foundation)
4. Then build Step 3: Template Selection (quickest win)
5. Then tackle Step 5: Guided Questionnaire (longest item, start early)

**Questions or Clarifications:**
Contact Sally (UX Expert) for UX/design questions or PM for scope/priority questions.

---

*Phase 1 Implementation Plan v1.0 - Created October 9, 2025*
