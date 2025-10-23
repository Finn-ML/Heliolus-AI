# Component Specification: Step 5 - Guided Assessment Questionnaire

**Feature:** Multi-section guided questionnaire for completing risk assessments
**Priority:** P0 (CRITICAL - Core feature currently missing)
**Effort:** 5 days
**Story:** Phase 1 - Core Assessment Journey

---

## 📋 Overview

### Purpose
**THE CRITICAL MISSING FEATURE.** Provide users with a structured questionnaire interface to answer assessment questions section-by-section. This is the core assessment execution feature that currently doesn't exist in the journey.

### User Story
> **As a** compliance officer completing a risk assessment
> **I want to** answer assessment questions in a guided, section-by-section format
> **So that** I can systematically evaluate my organization's compliance posture with clear progress tracking and evidence-based scoring

### Success Criteria
- ✅ Users can answer all questions in the selected template
- ✅ Progress tracking shows current section and overall completion
- ✅ Pre-filled answers from document analysis are clearly indicated with evidence tiers
- ✅ Question weights are visible to users
- ✅ Auto-save prevents data loss
- ✅ Can save draft and resume later
- ✅ Review screen before final submission
- ✅ Works on mobile with touch-friendly inputs

---

## 🎨 User Experience

### Visual Design

```
┌──────────────────────────────────────────────────────────────────┐
│  [← Back]                                       Step 5 of 10     │
│                                                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Section 2/5 │
│                                                                   │
│  📊 Transaction Monitoring                                       │
│  This section evaluates your transaction monitoring controls     │
│  Section Weight: 18% of overall score • 8 of 8 questions         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Question 3 of 8                             ⭐ Foundational  ││
│  │                                                              ││
│  │ Do you have an automated transaction monitoring system      ││
│  │ in place?                                                    ││
│  │                                                              ││
│  │ ℹ️ Help: Transaction monitoring systems automatically detect ││
│  │ suspicious patterns in payment flows...                      ││
│  │                                                              ││
│  │ ○ Yes, fully automated (10 points)                          ││
│  │ ● Partially - manual review required (6 points)  ← SELECTED ││
│  │ ○ No, fully manual process (0 points)                       ││
│  │                                                              ││
│  │ ┌─────────────────────────────────────────────────────────┐││
│  │ │ 💡 Pre-filled from: AML_Policy_2024.pdf                 │││
│  │ │ Evidence Tier: TIER_1 (Claimed with Basic Evidence)     │││
│  │ │ AI Confidence: Medium                                    │││
│  │ │ [View Document] [View AI Explanation]                    │││
│  │ └─────────────────────────────────────────────────────────┘││
│  │                                                              ││
│  │ 📝 Additional Notes (optional):                             ││
│  │ ┌───────────────────────────────────────────────────────┐  ││
│  │ │ We use a third-party TMS but require manual approval   │  ││
│  │ │ for transactions over $50k...                          │  ││
│  │ └───────────────────────────────────────────────────────┘  ││
│  │                                                              ││
│  │ Last saved: 2 minutes ago (auto-saved)                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  [← Previous Question]  [Save Draft]  [Next Question →]         │
│                                                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Questions: 1●  2●  3●  4○  5○  6○  7○  8○                       │
└──────────────────────────────────────────────────────────────────┘
```

### Section Navigation View

```
┌──────────────────────────────────────────────────────────────────┐
│  [← Back to Business Profile]                  Step 5 of 10     │
│                                                                   │
│  📋 AML/KYC Assessment                                           │
│  Complete all sections to receive your risk assessment results   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✅ Section 1: Customer Due Diligence                       │ │
│  │    12/12 questions complete • 22% of overall score          │ │
│  │    [Review Answers]                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⏳ Section 2: Transaction Monitoring                       │ │
│  │    3/8 questions complete • 18% of overall score            │ │
│  │    [Continue Section →]                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⭕ Section 3: Sanctions Screening                         │ │
│  │    0/10 questions • 25% of overall score                    │ │
│  │    [Start Section →]                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Overall Progress: 15/42 questions (36%)                         │
│                                                                   │
│  [Save & Exit]                      [Complete Assessment →]     │
└──────────────────────────────────────────────────────────────────┘
```

### Final Review Screen

```
┌──────────────────────────────────────────────────────────────────┐
│  📋 Review Your Assessment                                       │
│  Please review your answers before submission                    │
│                                                                   │
│  ✅ All sections complete (42/42 questions)                      │
│                                                                   │
│  📊 Customer Due Diligence (Section 1)                           │
│  ├─ Q1: Do you have KYC procedures? → Yes, comprehensive        │
│  ├─ Q2: Do you verify customer identity? → Always verified       │
│  └─ Q3: Enhanced due diligence process? → Risk-based approach   │
│  [Edit Section]                                                  │
│                                                                   │
│  📊 Transaction Monitoring (Section 2)                           │
│  ├─ Q1: Automated monitoring system? → Partially automated       │
│  ├─ Q2: Alert investigation process? → Documented workflow       │
│  └─ Q3: Thresholds reviewed regularly? → Quarterly review        │
│  [Edit Section]                                                  │
│                                                                   │
│  💡 Evidence Summary:                                            │
│  • 8 answers pre-filled from documents (TIER_2)                 │
│  • 12 answers claimed with basic evidence (TIER_1)              │
│  • 22 answers self-declared (TIER_0)                            │
│                                                                   │
│  ⚠️ Your assessment will be scored based on answer quality and   │
│  evidence tier. Higher evidence tiers result in higher scores.   │
│                                                                   │
│  [← Back to Edit]              [Submit Assessment ✓]            │
└──────────────────────────────────────────────────────────────────┘
```

### Interaction Flow

1. **Initial Load:** Shows section navigation with progress
2. **User clicks section:** Opens first unanswered question in that section
3. **User answers question:** Auto-save triggers after 2 seconds
4. **User clicks next:** Validates answer, moves to next question
5. **User completes section:** Returns to section navigation, section marked complete
6. **User completes all sections:** "Complete Assessment" button activates
7. **User clicks complete:** Shows final review screen
8. **User clicks submit:** Assessment marked complete, navigate to Step 7 (Results)

---

## 🏗️ Component Architecture

### Component Tree

```
GuidedQuestionnaireStep/
├── QuestionnaireContainer
│   ├── SectionNavigationView
│   │   ├── SectionProgress (overall)
│   │   └── SectionCard[]
│   │       ├── SectionHeader
│   │       ├── SectionMetadata (weight, question count)
│   │       └── SectionActionButton
│   │
│   ├── QuestionView (when in a section)
│   │   ├── SectionHeader
│   │   │   ├── SectionTitle
│   │   │   ├── SectionDescription
│   │   │   └── SectionProgress
│   │   ├── QuestionCard
│   │   │   ├── QuestionHeader
│   │   │   │   ├── QuestionNumber
│   │   │   │   └── QuestionWeight (Foundational/Standard)
│   │   │   ├── QuestionText
│   │   │   ├── QuestionHelp (expandable)
│   │   │   ├── AnswerInput (type-specific)
│   │   │   │   ├── MultipleChoiceInput
│   │   │   │   ├── TextAreaInput
│   │   │   │   ├── RatingInput
│   │   │   │   └── YesNoInput
│   │   │   ├── EvidenceIndicator (if pre-filled)
│   │   │   │   ├── EvidenceTierBadge (from Story 1.12)
│   │   │   │   ├── DocumentSource
│   │   │   │   └── AIConfidenceLevel
│   │   │   ├── NotesTextArea (optional)
│   │   │   └── AutoSaveIndicator
│   │   └── QuestionNavigation
│   │       ├── PreviousButton
│   │       ├── SaveDraftButton
│   │       └── NextButton
│   │   └── QuestionProgressDots
│   │
│   └── ReviewScreen
│       ├── ReviewHeader
│       ├── CompletionStatus
│       ├── SectionReview[]
│       │   ├── SectionSummary
│       │   ├── AnswerList (condensed)
│       │   └── EditSectionButton
│       ├── EvidenceSummary
│       ├── ScoringNotice
│       └── SubmitButton
```

### File Structure

```
frontend/src/components/assessment/questionnaire/
├── GuidedQuestionnaireStep.tsx          (main orchestrator - 250 lines)
├── SectionNavigationView.tsx            (section list - 150 lines)
├── QuestionView.tsx                     (single question - 200 lines)
├── ReviewScreen.tsx                     (final review - 180 lines)
│
├── section/
│   ├── SectionCard.tsx                  (section card - 80 lines)
│   ├── SectionHeader.tsx                (section title/meta - 60 lines)
│   └── SectionProgress.tsx              (progress bar - 50 lines)
│
├── question/
│   ├── QuestionCard.tsx                 (question container - 120 lines)
│   ├── QuestionHeader.tsx               (question title/weight - 60 lines)
│   ├── QuestionHelp.tsx                 (collapsible help - 40 lines)
│   └── QuestionProgressDots.tsx         (dot indicators - 40 lines)
│
├── inputs/
│   ├── MultipleChoiceInput.tsx          (radio/checkbox - 80 lines)
│   ├── TextAreaInput.tsx                (long text - 50 lines)
│   ├── RatingInput.tsx                  (1-5 scale - 60 lines)
│   └── YesNoInput.tsx                   (yes/no toggle - 40 lines)
│
├── evidence/
│   ├── EvidenceIndicator.tsx            (evidence display - 100 lines)
│   ├── DocumentSourceLink.tsx           (link to doc - 40 lines)
│   └── AIConfidenceBadge.tsx            (confidence level - 30 lines)
│
├── shared/
│   ├── AutoSaveIndicator.tsx            (saving status - 40 lines)
│   └── QuestionNavigation.tsx           (prev/next buttons - 60 lines)
│
├── __tests__/
│   ├── GuidedQuestionnaireStep.test.tsx
│   ├── SectionNavigationView.test.tsx
│   ├── QuestionView.test.tsx
│   ├── ReviewScreen.test.tsx
│   └── inputs/
│       ├── MultipleChoiceInput.test.tsx
│       └── TextAreaInput.test.tsx
│
└── types/
    └── questionnaire.types.ts           (TypeScript types)
```

**Total:** ~1,800 lines of code across 20+ components

---

## 💻 Core Component Specifications

### 1. GuidedQuestionnaireStep.tsx

**Purpose:** Main orchestrator managing state and navigation between views

**Props:**
```typescript
interface GuidedQuestionnaireStepProps {
  assessmentId: string;
  templateId: string;
  onComplete: () => void; // Navigate to results
  onBack: () => void;
  onSaveDraft: () => void;
}
```

**State:**
```typescript
interface QuestionnaireState {
  currentView: 'section-nav' | 'question' | 'review';
  currentSectionId: string | null;
  currentQuestionIndex: number;
  answers: Record<string, Answer>;
  lastSaved: Date | null;
  isSubmitting: boolean;
}

interface Answer {
  questionId: string;
  value: string | string[]; // string for single, array for multiple
  notes?: string;
  preFilled: boolean;
  evidenceTier?: 'TIER_0' | 'TIER_1' | 'TIER_2';
  sourceDocumentId?: string;
  aiConfidence?: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

**Implementation Skeleton:**
```tsx
export const GuidedQuestionnaireStep: React.FC<GuidedQuestionnaireStepProps> = ({
  assessmentId,
  templateId,
  onComplete,
  onBack,
  onSaveDraft
}) => {
  const [currentView, setCurrentView] = useState<'section-nav' | 'question' | 'review'>('section-nav');
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  // Fetch template structure
  const { data: template, isLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => api.getTemplate(templateId)
  });

  // Fetch existing answers (for resume)
  const { data: existingAnswers } = useQuery({
    queryKey: ['assessment-answers', assessmentId],
    queryFn: () => api.getAssessmentAnswers(assessmentId)
  });

  // Auto-save mutation
  const { mutate: saveAnswer } = useMutation({
    mutationFn: (answer: Answer) => api.saveAssessmentAnswer(assessmentId, answer),
    onSuccess: () => {
      setLastSaved(new Date());
      toast.success('Progress saved');
    }
  });

  // Submit assessment mutation
  const { mutate: submitAssessment, isPending: isSubmitting } = useMutation({
    mutationFn: () => api.completeAssessment(assessmentId),
    onSuccess: () => {
      toast.success('Assessment completed!');
      onComplete();
    }
  });

  // Auto-save effect (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      Object.values(answers).forEach(answer => {
        saveAnswer(answer);
      });
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [answers]);

  // Calculate section completion
  const getSectionProgress = (sectionId: string) => {
    const section = template?.sections.find(s => s.id === sectionId);
    if (!section) return { answered: 0, total: 0 };

    const sectionQuestions = section.questions;
    const answered = sectionQuestions.filter(q => answers[q.id]).length;

    return { answered, total: sectionQuestions.length };
  };

  // Calculate overall completion
  const overallProgress = useMemo(() => {
    if (!template) return { answered: 0, total: 0 };

    const totalQuestions = template.sections.reduce(
      (sum, section) => sum + section.questions.length,
      0
    );
    const answeredQuestions = Object.keys(answers).length;

    return { answered: answeredQuestions, total: totalQuestions };
  }, [template, answers]);

  // Check if all sections complete
  const allSectionsComplete = useMemo(() => {
    if (!template) return false;

    return template.sections.every(section => {
      const progress = getSectionProgress(section.id);
      return progress.answered === progress.total;
    });
  }, [template, answers]);

  // Handlers
  const handleSectionClick = (sectionId: string) => {
    setCurrentSectionId(sectionId);
    setCurrentQuestionIndex(0);
    setCurrentView('question');
  };

  const handleAnswerChange = (questionId: string, value: Answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNextQuestion = () => {
    const currentSection = template?.sections.find(s => s.id === currentSectionId);
    if (!currentSection) return;

    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Section complete, return to nav
      setCurrentView('section-nav');
      setCurrentSectionId(null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleCompleteAssessment = () => {
    setCurrentView('review');
  };

  const handleSubmit = () => {
    submitAssessment();
  };

  // Render appropriate view
  if (isLoading) {
    return <LoadingState message="Loading assessment questions..." />;
  }

  if (!template) {
    return <ErrorState message="Failed to load assessment" />;
  }

  return (
    <JourneyStepContainer>
      {currentView === 'section-nav' && (
        <SectionNavigationView
          template={template}
          answers={answers}
          onSectionClick={handleSectionClick}
          onComplete={handleCompleteAssessment}
          canComplete={allSectionsComplete}
          onBack={onBack}
          onSaveDraft={onSaveDraft}
        />
      )}

      {currentView === 'question' && currentSectionId && (
        <QuestionView
          section={template.sections.find(s => s.id === currentSectionId)!}
          questionIndex={currentQuestionIndex}
          answer={answers[currentSection.questions[currentQuestionIndex].id]}
          onAnswerChange={handleAnswerChange}
          onNext={handleNextQuestion}
          onPrevious={handlePreviousQuestion}
          onBackToNav={() => setCurrentView('section-nav')}
          lastSaved={lastSaved}
        />
      )}

      {currentView === 'review' && (
        <ReviewScreen
          template={template}
          answers={answers}
          onBack={() => setCurrentView('section-nav')}
          onEditSection={(sectionId) => handleSectionClick(sectionId)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </JourneyStepContainer>
  );
};
```

---

### 2. SectionNavigationView.tsx

**Purpose:** Display all sections with progress and allow navigation

**Props:**
```typescript
interface SectionNavigationViewProps {
  template: AssessmentTemplate;
  answers: Record<string, Answer>;
  onSectionClick: (sectionId: string) => void;
  onComplete: () => void;
  canComplete: boolean;
  onBack: () => void;
  onSaveDraft: () => void;
}
```

**Implementation:**
```tsx
export const SectionNavigationView: React.FC<SectionNavigationViewProps> = ({
  template,
  answers,
  onSectionClick,
  onComplete,
  canComplete,
  onBack,
  onSaveDraft
}) => {
  const overallProgress = useMemo(() => {
    const total = template.sections.reduce(
      (sum, section) => sum + section.questions.length,
      0
    );
    const answered = Object.keys(answers).length;
    return { answered, total, percentage: Math.round((answered / total) * 100) };
  }, [template, answers]);

  return (
    <div className="space-y-6">
      <JourneyStepHeader
        title={template.name}
        description="Complete all sections to receive your risk assessment results"
        stepNumber={5}
        totalSteps={10}
      />

      {/* Overall progress */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">
            {overallProgress.answered}/{overallProgress.total} questions
          </span>
        </div>
        <Progress value={overallProgress.percentage} className="h-2" />
      </div>

      {/* Section cards */}
      <div className="space-y-4">
        {template.sections.map((section, index) => {
          const sectionProgress = getSectionProgress(section, answers);
          const isComplete = sectionProgress.answered === sectionProgress.total;
          const isStarted = sectionProgress.answered > 0;

          return (
            <SectionCard
              key={section.id}
              section={section}
              sectionNumber={index + 1}
              progress={sectionProgress}
              isComplete={isComplete}
              isStarted={isStarted}
              onClick={() => onSectionClick(section.id)}
            />
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <Button variant="outline" onClick={onSaveDraft}>
            Save & Exit
          </Button>
        </div>

        <Button
          onClick={onComplete}
          disabled={!canComplete}
          className="bg-gradient-to-r from-cyan-500 to-pink-500"
        >
          Complete Assessment →
        </Button>
      </div>
    </div>
  );
};
```

---

### 3. QuestionView.tsx

**Purpose:** Display and collect answer for a single question

**Props:**
```typescript
interface QuestionViewProps {
  section: AssessmentSection;
  questionIndex: number;
  answer: Answer | undefined;
  onAnswerChange: (questionId: string, answer: Answer) => void;
  onNext: () => void;
  onPrevious: () => void;
  onBackToNav: () => void;
  lastSaved: Date | null;
}
```

**Implementation:**
```tsx
export const QuestionView: React.FC<QuestionViewProps> = ({
  section,
  questionIndex,
  answer,
  onAnswerChange,
  onNext,
  onPrevious,
  onBackToNav,
  lastSaved
}) => {
  const question = section.questions[questionIndex];
  const [localAnswer, setLocalAnswer] = useState<string | string[]>(answer?.value || '');
  const [notes, setNotes] = useState(answer?.notes || '');

  const handleValueChange = (value: string | string[]) => {
    setLocalAnswer(value);
    onAnswerChange(question.id, {
      questionId: question.id,
      value,
      notes,
      preFilled: answer?.preFilled || false,
      evidenceTier: answer?.evidenceTier,
      sourceDocumentId: answer?.sourceDocumentId,
      aiConfidence: answer?.aiConfidence
    });
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    onAnswerChange(question.id, {
      questionId: question.id,
      value: localAnswer,
      notes: newNotes,
      preFilled: answer?.preFilled || false,
      evidenceTier: answer?.evidenceTier,
      sourceDocumentId: answer?.sourceDocumentId,
      aiConfidence: answer?.aiConfidence
    });
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <SectionHeader
        title={section.title}
        description={section.description}
        weight={section.weight}
        progress={{
          current: questionIndex + 1,
          total: section.questions.length
        }}
      />

      {/* Question card */}
      <Card className="p-8">
        <QuestionHeader
          questionNumber={questionIndex + 1}
          totalQuestions={section.questions.length}
          weight={question.weight}
          isFoundational={question.weight > 1.0}
        />

        <div className="mt-6 space-y-6">
          {/* Question text */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {question.text}
            </h3>
            {question.helpText && (
              <QuestionHelp helpText={question.helpText} />
            )}
          </div>

          {/* Answer input (type-specific) */}
          {renderAnswerInput(question.type, localAnswer, handleValueChange, question.options)}

          {/* Evidence indicator (if pre-filled) */}
          {answer?.preFilled && (
            <EvidenceIndicator
              tier={answer.evidenceTier!}
              sourceDocumentId={answer.sourceDocumentId}
              aiConfidence={answer.aiConfidence}
            />
          )}

          {/* Optional notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add any additional context or explanations..."
              rows={3}
              className="w-full"
            />
          </div>

          {/* Auto-save indicator */}
          <AutoSaveIndicator lastSaved={lastSaved} />
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onPrevious} disabled={questionIndex === 0}>
          ← Previous Question
        </Button>

        <QuestionProgressDots
          total={section.questions.length}
          current={questionIndex}
        />

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBackToNav}>
            Back to Sections
          </Button>
          <Button onClick={onNext} disabled={!localAnswer}>
            {questionIndex === section.questions.length - 1 ? 'Complete Section' : 'Next Question →'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper to render appropriate input based on question type
function renderAnswerInput(
  type: QuestionType,
  value: string | string[],
  onChange: (value: string | string[]) => void,
  options?: QuestionOption[]
) {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return <MultipleChoiceInput value={value as string} onChange={onChange} options={options!} />;
    case 'MULTIPLE_SELECT':
      return <MultipleChoiceInput value={value as string[]} onChange={onChange} options={options!} multiple />;
    case 'TEXT':
      return <TextAreaInput value={value as string} onChange={onChange} />;
    case 'RATING':
      return <RatingInput value={Number(value)} onChange={(v) => onChange(String(v))} />;
    case 'YES_NO':
      return <YesNoInput value={value as string} onChange={onChange} />;
    default:
      return null;
  }
}
```

---

### 4. ReviewScreen.tsx

**Purpose:** Final review before submission

**Implementation:**
```tsx
export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  template,
  answers,
  onBack,
  onEditSection,
  onSubmit,
  isSubmitting
}) => {
  const evidenceSummary = useMemo(() => {
    const summary = { tier0: 0, tier1: 0, tier2: 0 };
    Object.values(answers).forEach(answer => {
      if (answer.evidenceTier === 'TIER_0') summary.tier0++;
      else if (answer.evidenceTier === 'TIER_1') summary.tier1++;
      else if (answer.evidenceTier === 'TIER_2') summary.tier2++;
      else summary.tier0++; // Default to TIER_0
    });
    return summary;
  }, [answers]);

  return (
    <div className="space-y-6">
      <JourneyStepHeader
        title="Review Your Assessment"
        description="Please review your answers before submission"
      />

      {/* Completion status */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          All sections complete ({Object.keys(answers).length} questions answered)
        </AlertDescription>
      </Alert>

      {/* Section reviews */}
      {template.sections.map((section, index) => (
        <Card key={section.id} className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {section.title}
              </h3>
              <p className="text-sm text-gray-600">
                {section.weight}% of overall score
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onEditSection(section.id)}>
              Edit Section
            </Button>
          </div>

          <div className="space-y-2">
            {section.questions.slice(0, 3).map((question) => {
              const answer = answers[question.id];
              return (
                <div key={question.id} className="text-sm">
                  <span className="text-gray-700">Q: {question.text}</span>
                  <br />
                  <span className="text-gray-900 font-medium">A: {formatAnswer(answer?.value)}</span>
                </div>
              );
            })}
            {section.questions.length > 3 && (
              <p className="text-sm text-gray-500">
                + {section.questions.length - 3} more questions
              </p>
            )}
          </div>
        </Card>
      ))}

      {/* Evidence summary */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          💡 Evidence Summary
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• {evidenceSummary.tier2} answers pre-filled from documents (TIER_2)</li>
          <li>• {evidenceSummary.tier1} answers claimed with basic evidence (TIER_1)</li>
          <li>• {evidenceSummary.tier0} answers self-declared (TIER_0)</li>
        </ul>
        <p className="mt-4 text-sm text-gray-600">
          ⚠️ Your assessment will be scored based on answer quality and evidence tier.
          Higher evidence tiers result in higher scores.
        </p>
      </Card>

      {/* Submit */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          ← Back to Edit
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-cyan-500 to-pink-500"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Assessment ✓'
          )}
        </Button>
      </div>
    </div>
  );
};
```

---

## 🔌 API Integration

### Endpoints Used

**1. GET /api/templates/:id**
- **Purpose:** Fetch template structure with sections and questions
- **Existing:** Yes
- **Response:**
```typescript
interface AssessmentTemplate {
  id: string;
  name: string;
  sections: Array<{
    id: string;
    title: string;
    description: string;
    weight: number; // 0-100 (percentage)
    order: number;
    questions: Array<{
      id: string;
      text: string;
      helpText?: string;
      type: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TEXT' | 'RATING' | 'YES_NO';
      weight: number; // 0.6-1.0 (within section)
      options?: Array<{
        id: string;
        text: string;
        points: number;
      }>;
      order: number;
    }>;
  }>;
}
```

**2. GET /api/assessments/:id/answers**
- **Purpose:** Fetch existing answers (for resume/edit)
- **Existing:** Yes
- **Response:**
```typescript
interface AnswerResponse {
  questionId: string;
  value: string | string[];
  notes?: string;
  preFilled: boolean;
  evidenceTier?: 'TIER_0' | 'TIER_1' | 'TIER_2';
  sourceDocumentId?: string;
  aiConfidence?: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
}[]
```

**3. POST /api/assessments/:id/answers**
- **Purpose:** Save/update an answer
- **Existing:** Yes
- **Request:**
```typescript
{
  questionId: string;
  value: string | string[];
  notes?: string;
}
```

**4. POST /api/assessments/:id/complete**
- **Purpose:** Mark assessment as complete
- **Existing:** Yes
- **Request:** No body needed
- **Response:**
```typescript
{
  success: true;
  assessmentId: string;
  status: 'COMPLETED';
}
```

---

## 🧪 Testing

### Unit Tests

```typescript
describe('GuidedQuestionnaireStep', () => {
  it('renders section navigation on initial load', () => {
    const { getByText } = render(<GuidedQuestionnaireStep {...props} />);
    expect(getByText('Customer Due Diligence')).toBeInTheDocument();
    expect(getByText('Transaction Monitoring')).toBeInTheDocument();
  });

  it('navigates to question view when section clicked', () => {
    const { getByText } = render(<GuidedQuestionnaireStep {...props} />);
    fireEvent.click(getByText('Start Section'));
    expect(getByText('Question 1 of 12')).toBeInTheDocument();
  });

  it('saves answer and advances to next question', async () => {
    const { getByRole, getByText } = render(<GuidedQuestionnaireStep {...props} />);

    fireEvent.click(getByRole('radio', { name: /Yes/ }));
    fireEvent.click(getByText('Next Question'));

    await waitFor(() => {
      expect(getByText('Question 2 of 12')).toBeInTheDocument();
    });
  });

  it('auto-saves answer after 2 seconds', async () => {
    const mockSave = jest.fn();
    const { getByRole } = render(<GuidedQuestionnaireStep {...props} onSave={mockSave} />);

    fireEvent.click(getByRole('radio', { name: /Yes/ }));

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('shows evidence indicator for pre-filled answers', () => {
    const { getByText } = render(<QuestionView answer={preFilledAnswer} />);
    expect(getByText('Pre-filled from: AML_Policy_2024.pdf')).toBeInTheDocument();
    expect(getByText('TIER_1')).toBeInTheDocument();
  });

  it('enables complete button when all sections done', () => {
    const { getByRole } = render(<SectionNavigationView allComplete={true} />);
    const button = getByRole('button', { name: /Complete Assessment/ });
    expect(button).not.toBeDisabled();
  });

  it('shows review screen before submission', () => {
    const { getByText } = render(<ReviewScreen {...props} />);
    expect(getByText('Review Your Assessment')).toBeInTheDocument();
    expect(getByText('Evidence Summary')).toBeInTheDocument();
  });
});
```

---

## ♿ Accessibility

**WCAG 2.1 AA Compliance:**
- Keyboard navigation (Tab, Enter, Space, Arrow keys)
- Screen reader announcements for progress changes
- Focus management between views
- Proper ARIA labels and roles
- Color contrast minimum 4.5:1
- Focus indicators on all interactive elements

---

## 🚀 Performance

**Optimization Strategies:**
- Lazy load sections as user navigates
- Memoize section progress calculations
- Debounce auto-save (2 seconds)
- Optimistic UI updates for answer changes
- Virtual scrolling for review screen (if many questions)

**Performance Targets:**
- Initial render: <800ms
- Question navigation: <100ms
- Auto-save: <200ms to update UI
- Smooth 60fps animations

---

**This is the most critical component for Phase 1. Allocate 5 full days for implementation.** ✅

*Component Specification v1.0 - Created October 9, 2025*
