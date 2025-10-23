import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { JourneyStepContainer, LoadingState, ErrorState } from '../shared';
import { SectionNavigationView } from './SectionNavigationView';
import { QuestionView } from './QuestionView';
import { ReviewScreen } from './ReviewScreen';
import {
  calculateSectionProgress,
  type GuidedQuestionnaireStepProps,
  type CurrentView,
  type Answer,
} from './types/questionnaire.types';

/**
 * GuidedQuestionnaireStep
 * Main orchestrator for guided assessment questionnaire
 * Manages state and navigation between section nav, questions, and review
 */
export const GuidedQuestionnaireStep: React.FC<GuidedQuestionnaireStepProps> = ({
  assessmentId,
  templateId,
  onComplete,
  onBack,
  onSaveDraft,
}) => {
  const [currentView, setCurrentView] = useState<CurrentView>('section-nav');
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const queryClient = useQueryClient();

  // Fetch template structure
  const {
    data: template,
    isLoading: templateLoading,
    isError: templateError,
    refetch: refetchTemplate,
  } = useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      const { templateApi } = await import('@/lib/api');
      const result = await templateApi.getTemplate(templateId);
      console.log('[GuidedQuestionnaire] Template loaded:', result);
      return result;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch existing answers (for resume)
  const { data: existingAnswers } = useQuery({
    queryKey: ['assessment-answers', assessmentId],
    queryFn: async () => {
      const { assessmentApi } = await import('@/lib/api');
      return assessmentApi.getAssessmentAnswers(assessmentId);
    },
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // Initialize answers from existing data
  useEffect(() => {
    if (existingAnswers && Array.isArray(existingAnswers)) {
      const answersMap: Record<string, Answer> = {};
      existingAnswers.forEach((ans: any) => {
        answersMap[ans.questionId] = ans;
      });
      setAnswers(answersMap);
    }
  }, [existingAnswers]);

  // Auto-save mutation
  const { mutate: saveAnswer } = useMutation({
    mutationFn: async (answer: Answer) => {
      const { assessmentApi } = await import('@/lib/api');
      return assessmentApi.saveAnswer(assessmentId, answer);
    },
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['assessment-answers', assessmentId] });
    },
    onError: error => {
      console.error('Failed to save answer:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save your answer. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Submit assessment mutation
  const { mutate: submitAssessment, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      const { assessmentApi } = await import('@/lib/api');
      return assessmentApi.completeAssessment(assessmentId);
    },
    onSuccess: () => {
      toast({
        title: 'Assessment completed!',
        description: 'Your assessment has been submitted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessment-answers', assessmentId] });
      onComplete();
    },
    onError: error => {
      console.error('Failed to submit assessment:', error);
      toast({
        title: 'Submission failed',
        description: 'Failed to submit your assessment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Auto-save effect (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      Object.values(answers).forEach(answer => {
        if (answer.value) {
          saveAnswer(answer);
        }
      });
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [answers, saveAnswer]);

  // Calculate overall completion
  const allSectionsComplete = useMemo(() => {
    if (!template || !template.sections || !Array.isArray(template.sections)) return false;

    return template.sections.every(section => {
      const progress = calculateSectionProgress(section, answers);
      return progress.answered === progress.total;
    });
  }, [template, answers]);

  // Handlers
  const handleSectionClick = (sectionId: string) => {
    setCurrentSectionId(sectionId);

    // Find first unanswered question in section, or start at beginning
    const section = template?.sections?.find(s => s.id === sectionId);
    if (section && section.questions && Array.isArray(section.questions)) {
      const firstUnanswered = section.questions.findIndex(q => !answers[q.id]);
      setCurrentQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    } else {
      setCurrentQuestionIndex(0);
    }

    setCurrentView('question');
  };

  const handleAnswerChange = (questionId: string, value: Answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNextQuestion = () => {
    const currentSection = template?.sections?.find(s => s.id === currentSectionId);
    if (!currentSection || !currentSection.questions || !Array.isArray(currentSection.questions))
      return;

    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Section complete, return to nav
      toast({
        title: 'Section completed!',
        description: `You've completed ${currentSection.title}.`,
      });
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

  const handleBackToNav = () => {
    setCurrentView('section-nav');
    setCurrentSectionId(null);
  };

  // Get current section for question view
  const currentSection = template?.sections?.find(s => s.id === currentSectionId);

  // Loading state
  if (templateLoading) {
    return (
      <JourneyStepContainer>
        <LoadingState message="Loading assessment questions..." />
      </JourneyStepContainer>
    );
  }

  // Error state
  if (templateError) {
    return (
      <JourneyStepContainer>
        <ErrorState message="Failed to load assessment template" onRetry={refetchTemplate} />
      </JourneyStepContainer>
    );
  }

  // No template loaded yet
  if (!template) {
    return (
      <JourneyStepContainer>
        <LoadingState message="Loading assessment template..." />
      </JourneyStepContainer>
    );
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

      {currentView === 'question' && currentSection && (
        <QuestionView
          section={currentSection}
          questionIndex={currentQuestionIndex}
          answer={answers[currentSection.questions[currentQuestionIndex]?.id]}
          onAnswerChange={handleAnswerChange}
          onNext={handleNextQuestion}
          onPrevious={handlePreviousQuestion}
          onBackToNav={handleBackToNav}
          lastSaved={lastSaved}
        />
      )}

      {currentView === 'review' && (
        <ReviewScreen
          template={template}
          answers={answers}
          onBack={handleBackToNav}
          onEditSection={handleSectionClick}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </JourneyStepContainer>
  );
};
