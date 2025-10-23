import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { templateApi, assessmentApi, queryKeys, createMutations } from '@/lib/api';
import {
  AssessmentTemplate,
  Assessment,
  AssessmentStatus,
  AssessmentFlowState,
  AssessmentProgress,
  QuestionType,
  TemplateQuestion,
  UpdateAssessmentRequest,
  AssessmentResults,
  Priority,
} from '@/types/assessment';
import { toast } from '@/hooks/use-toast';
import { FreemiumBanner } from '@/components/ui/freemium';

interface AssessmentFlowProps {
  templateId: string;
  assessmentId?: string;
  onComplete: (assessmentId: string) => void;
  onSaveAndExit: () => void;
  className?: string;
}

// Create dynamic form schema based on question types
const createQuestionSchema = (question: TemplateQuestion) => {
  let schema: z.ZodType<any>;

  switch (question.type) {
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE':
      schema = z.string();
      break;
    case 'TEXT':
      schema = z.string();
      if (question.validation?.min) {
        schema = (schema as z.ZodString).min(question.validation.min, question.validation.message);
      }
      if (question.validation?.max) {
        schema = (schema as z.ZodString).max(question.validation.max, question.validation.message);
      }
      break;
    case 'NUMBER':
    case 'RATING':
      schema = z.number();
      if (question.validation?.min !== undefined) {
        schema = (schema as z.ZodNumber).min(question.validation.min, question.validation.message);
      }
      if (question.validation?.max !== undefined) {
        schema = (schema as z.ZodNumber).max(question.validation.max, question.validation.message);
      }
      break;
    case 'CHECKLIST':
      schema = z.array(z.string());
      break;
    default:
      schema = z.string();
  }

  if (question.required) {
    return schema;
  } else {
    return schema.optional();
  }
};

const AssessmentFlow = ({
  templateId,
  assessmentId: existingAssessmentId,
  onComplete,
  onSaveAndExit,
  className,
}: AssessmentFlowProps) => {
  const queryClient = useQueryClient();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentId, setAssessmentId] = useState<string | null>(existingAssessmentId || null);
  const [flowState, setFlowState] = useState<AssessmentFlowState>({
    currentSection: 0,
    currentQuestion: 0,
    responses: {},
    isComplete: false,
    isDraft: false,
    progress: 0,
  });

  // Fetch template details
  const {
    data: template,
    isLoading: templateLoading,
    error: templateError,
  } = useQuery({
    queryKey: queryKeys.template(templateId),
    queryFn: () => templateApi.getTemplate(templateId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch existing assessment if provided
  const { data: existingAssessment, isLoading: assessmentLoading } = useQuery({
    queryKey: assessmentId ? queryKeys.assessment(assessmentId) : ['assessment', null],
    queryFn: () => (assessmentId ? assessmentApi.getAssessment(assessmentId) : null),
    enabled: !!assessmentId,
  });

  // Mutations
  const mutations = createMutations(queryClient);

  const createAssessmentMutation = useMutation(mutations.createAssessment);

  const updateAssessmentMutation = useMutation({
    ...(assessmentId
      ? mutations.updateAssessment(assessmentId)
      : {
          mutationFn: async (): Promise<Assessment> => ({
            id: '',
            organizationId: '',
            templateId: '',
            responses: {},
            status: 'DRAFT' as AssessmentStatus,
            creditsUsed: 0,
            createdAt: '',
            updatedAt: '',
          }),
        }),
  });

  const completeAssessmentMutation = useMutation({
    ...(assessmentId
      ? mutations.completeAssessment(assessmentId)
      : {
          mutationFn: async (): Promise<AssessmentResults> => ({
            assessment: {
              id: '',
              organizationId: '',
              templateId: '',
              responses: {},
              status: 'COMPLETED' as AssessmentStatus,
              creditsUsed: 0,
              createdAt: '',
              updatedAt: '',
            },
            gaps: [],
            risks: [],
            overallRiskScore: 0,
            summary: {
              totalGaps: 0,
              criticalGaps: 0,
              highRisks: 0,
              estimatedCost: '',
              estimatedEffort: '',
              priority: 'LONG_TERM' as Priority,
            },
            recommendations: [],
            nextSteps: [],
          }),
        }),
  });

  // Get current section and question
  const currentSection = template?.sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const totalQuestions =
    template?.sections.reduce((sum, section) => sum + section.questions.length, 0) || 0;
  const completedQuestions = Object.keys(flowState.responses).length;

  // Calculate progress
  const progress: AssessmentProgress = {
    sectionIndex: currentSectionIndex,
    questionIndex: currentQuestionIndex,
    totalSections: template?.sections.length || 0,
    totalQuestions,
    completedQuestions,
    percentComplete:
      totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
  };

  // Dynamic form schema for current question
  const questionSchema = currentQuestion
    ? z.object({
        [currentQuestion.id]: createQuestionSchema(currentQuestion),
      })
    : z.object({});

  const form = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      [currentQuestion?.id || '']: flowState.responses[currentQuestion?.id || ''] || '',
    },
  });

  // Initialize assessment on mount
  useEffect(() => {
    if (template && !assessmentId && !existingAssessmentId) {
      createAssessmentMutation.mutate(
        {
          organizationId: 'current-org', // This should come from auth context
          templateId: template.id,
        },
        {
          onSuccess: newAssessment => {
            setAssessmentId(newAssessment.id);
            toast({
              title: 'Assessment Started',
              description: `Started ${template.name} assessment`,
            });
          },
          onError: error => {
            toast({
              title: 'Failed to Start Assessment',
              description: error.message,
              variant: 'destructive',
            });
          },
        }
      );
    }
  }, [template, assessmentId, existingAssessmentId]);

  // Load existing responses
  useEffect(() => {
    if (existingAssessment?.responses) {
      setFlowState(prev => ({
        ...prev,
        responses: existingAssessment.responses,
        isDraft: existingAssessment.status === 'DRAFT',
      }));
    }
  }, [existingAssessment]);

  // Update form defaults when question changes
  useEffect(() => {
    if (currentQuestion) {
      form.reset({
        [currentQuestion.id]:
          flowState.responses[currentQuestion.id] || getCurrentQuestionDefaultValue(),
      });
    }
  }, [currentQuestion, flowState.responses, form]);

  const getCurrentQuestionDefaultValue = () => {
    if (!currentQuestion) return '';

    switch (currentQuestion.type) {
      case 'CHECKLIST':
        return [];
      case 'RATING':
      case 'NUMBER':
        return 0;
      default:
        return '';
    }
  };

  const saveProgress = async (responses: Record<string, any>) => {
    if (!assessmentId) return;

    try {
      await updateAssessmentMutation.mutateAsync({
        responses,
        status: 'IN_PROGRESS' as AssessmentStatus,
      } as UpdateAssessmentRequest);

      setFlowState(prev => ({
        ...prev,
        responses,
        progress: Math.round((Object.keys(responses).length / totalQuestions) * 100),
      }));
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleQuestionAnswer = async (data: any) => {
    if (!currentQuestion) return;

    const updatedResponses = {
      ...flowState.responses,
      [currentQuestion.id]: data[currentQuestion.id],
    };

    // Auto-save progress
    await saveProgress(updatedResponses);

    // Move to next question
    moveToNextQuestion();
  };

  const moveToNextQuestion = () => {
    if (!currentSection) return;

    if (currentQuestionIndex < currentSection.questions.length - 1) {
      // Next question in current section
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < (template?.sections.length || 0) - 1) {
      // First question of next section
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Assessment complete
      handleAssessmentComplete();
    }
  };

  const moveToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Previous question in current section
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      // Last question of previous section
      setCurrentSectionIndex(prev => prev - 1);
      const prevSection = template?.sections[currentSectionIndex - 1];
      if (prevSection) {
        setCurrentQuestionIndex(prevSection.questions.length - 1);
      }
    }
  };

  const handleAssessmentComplete = async () => {
    if (!assessmentId) return;

    try {
      await completeAssessmentMutation.mutateAsync();
      toast({
        title: 'Assessment Complete!',
        description: 'Your assessment has been submitted for analysis.',
      });
      onComplete(assessmentId);
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveAndExit = async () => {
    if (assessmentId && Object.keys(flowState.responses).length > 0) {
      await saveProgress(flowState.responses);
    }
    onSaveAndExit();
  };

  const renderQuestionField = () => {
    if (!currentQuestion) return null;

    return (
      <FormField
        control={form.control}
        name={currentQuestion.id}
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel className="text-lg font-medium">
              {currentQuestion.text}
              {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>

            {currentQuestion.helpText && (
              <FormDescription className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>{currentQuestion.helpText}</span>
              </FormDescription>
            )}

            <FormControl>{renderQuestionInput(field, currentQuestion)}</FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const renderQuestionInput = (field: any, question: TemplateQuestion) => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <RadioGroup
            value={field.value || ''}
            onValueChange={field.onChange}
            className="space-y-2"
          >
            {question.options?.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={option.id}
                  data-testid={`option-${option.id}`}
                />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'TRUE_FALSE':
        return (
          <RadioGroup
            value={field.value || ''}
            onValueChange={field.onChange}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" data-testid="option-true" />
              <Label htmlFor="true" className="cursor-pointer">
                True
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" data-testid="option-false" />
              <Label htmlFor="false" className="cursor-pointer">
                False
              </Label>
            </div>
          </RadioGroup>
        );

      case 'TEXT':
        return (
          <Textarea
            {...field}
            placeholder="Enter your response..."
            className="min-h-[100px] resize-none"
            data-testid="input-text-response"
          />
        );

      case 'NUMBER':
        return (
          <Input
            {...field}
            type="number"
            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
            placeholder="Enter a number"
            data-testid="input-number-response"
          />
        );

      case 'RATING':
        return (
          <div className="space-y-4">
            <Slider
              value={[field.value || 0]}
              onValueChange={([value]) => field.onChange(value)}
              max={question.validation?.max || 10}
              min={question.validation?.min || 0}
              step={1}
              className="w-full"
              data-testid="slider-rating"
            />
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">{field.value || 0}</span>
              <span className="text-sm text-muted-foreground ml-1">
                / {question.validation?.max || 10}
              </span>
            </div>
          </div>
        );

      case 'CHECKLIST':
        return (
          <div className="space-y-3">
            {question.options?.map(option => {
              const isChecked = Array.isArray(field.value) && field.value.includes(option.value);

              return (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={isChecked}
                    onCheckedChange={checked => {
                      const currentValues = Array.isArray(field.value) ? field.value : [];
                      if (checked) {
                        field.onChange([...currentValues, option.value]);
                      } else {
                        field.onChange(currentValues.filter((val: string) => val !== option.value));
                      }
                    }}
                    data-testid={`checkbox-${option.id}`}
                  />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      default:
        return (
          <Input
            {...field}
            placeholder="Enter your response..."
            data-testid="input-default-response"
          />
        );
    }
  };

  // Loading state
  if (templateLoading || assessmentLoading) {
    return (
      <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (templateError || !template) {
    return (
      <div className={cn('max-w-4xl mx-auto', className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Assessment Unavailable</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load the assessment template. Please try again.
            </p>
            <Button onClick={() => window.location.reload()} data-testid="button-reload">
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFirstQuestion = currentSectionIndex === 0 && currentQuestionIndex === 0;
  const isLastQuestion =
    currentSectionIndex === template.sections.length - 1 &&
    currentQuestionIndex === (currentSection?.questions.length || 0) - 1;

  return (
    <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {template.name}
              </CardTitle>
              <CardDescription>
                Section {currentSectionIndex + 1} of {template.sections.length}:{' '}
                {currentSection?.title}
              </CardDescription>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              Question {completedQuestions + 1} of {totalQuestions}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {progress.percentComplete}% complete
            </span>
          </div>
          <Progress value={progress.percentComplete} className="h-2" />
        </CardContent>
      </Card>

      {/* Freemium Banner */}
      <FreemiumBanner
        title="Assessment in Progress"
        description="Complete this assessment to unlock detailed compliance insights"
        ctaText="Learn About Premium"
        onCTA={() => {
          toast({
            title: 'Premium Features',
            description: 'Premium subscriptions coming soon!',
          });
        }}
      />

      {/* Question Card */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{currentSection?.title}</Badge>
              <span className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1} of {currentSection?.questions.length || 0}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                ~{Math.ceil(template.estimatedMinutes * (1 - progress.percentComplete / 100))} min
                left
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleQuestionAnswer)} className="space-y-6">
              {renderQuestionField()}

              <Separator />

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={moveToPreviousQuestion}
                  disabled={isFirstQuestion}
                  data-testid="button-previous-question"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSaveAndExit}
                    disabled={updateAssessmentMutation.isPending}
                    data-testid="button-save-exit"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save & Exit
                  </Button>

                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting || updateAssessmentMutation.isPending}
                    data-testid={
                      isLastQuestion ? 'button-complete-assessment' : 'button-next-question'
                    }
                  >
                    {form.formState.isSubmitting || updateAssessmentMutation.isPending ? (
                      'Saving...'
                    ) : isLastQuestion ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete Assessment
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentFlow;
