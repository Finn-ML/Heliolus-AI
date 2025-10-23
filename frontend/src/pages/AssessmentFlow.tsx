import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import TemplateSelector from '@/components/TemplateSelector';
import AssessmentFlow from '@/components/AssessmentFlow';
import AssessmentResults from '@/components/AssessmentResults';
import { AssessmentTemplate } from '@/types/assessment';
import { toast } from '@/hooks/use-toast';

type FlowStep = 'select-template' | 'assessment' | 'results';

interface AssessmentFlowPageState {
  step: FlowStep;
  selectedTemplate?: AssessmentTemplate;
  assessmentId?: string;
}

const AssessmentFlowPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [flowState, setFlowState] = useState<AssessmentFlowPageState>({
    step: 'select-template',
  });

  // Initialize state from URL parameters
  useEffect(() => {
    const step = (searchParams.get('step') as FlowStep) || 'select-template';
    const assessmentId = searchParams.get('assessmentId') || undefined;
    const templateId = searchParams.get('templateId') || undefined;

    setFlowState({
      step,
      assessmentId,
      // If we have templateId but no template object, we'll fetch it in the component
      selectedTemplate: templateId ? ({ id: templateId } as AssessmentTemplate) : undefined,
    });
  }, [searchParams]);

  const updateFlowState = (newState: Partial<AssessmentFlowPageState>) => {
    const updatedState = { ...flowState, ...newState };
    setFlowState(updatedState);

    // Update URL parameters
    const params = new URLSearchParams();
    if (updatedState.step !== 'select-template') {
      params.set('step', updatedState.step);
    }
    if (updatedState.assessmentId) {
      params.set('assessmentId', updatedState.assessmentId);
    }
    if (updatedState.selectedTemplate?.id) {
      params.set('templateId', updatedState.selectedTemplate.id);
    }

    setSearchParams(params, { replace: true });
  };

  const handleTemplateSelect = (template: AssessmentTemplate) => {
    updateFlowState({
      step: 'assessment',
      selectedTemplate: template,
    });

    toast({
      title: 'Template Selected',
      description: `Starting ${template.name} assessment`,
    });
  };

  const handleSkipTemplates = () => {
    // Redirect to the existing risk assessment upload component
    navigate('/dashboard?tab=assessment');
  };

  const handleAssessmentComplete = (assessmentId: string) => {
    updateFlowState({
      step: 'results',
      assessmentId,
    });

    toast({
      title: 'Assessment Complete!',
      description: 'Your assessment results are now available.',
    });
  };

  const handleSaveAndExit = () => {
    navigate('/dashboard');
    toast({
      title: 'Assessment Saved',
      description: 'You can continue your assessment later from the dashboard.',
    });
  };

  const handleStartNewAssessment = () => {
    updateFlowState({
      step: 'select-template',
      selectedTemplate: undefined,
      assessmentId: undefined,
    });
  };

  const handleNavigateToMarketplace = () => {
    navigate('/marketplace');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const getStepTitle = () => {
    switch (flowState.step) {
      case 'select-template':
        return 'Select Assessment Template';
      case 'assessment':
        return `Complete ${flowState.selectedTemplate?.name || 'Assessment'}`;
      case 'results':
        return 'Assessment Results';
      default:
        return 'Assessment Flow';
    }
  };

  const getStepDescription = () => {
    switch (flowState.step) {
      case 'select-template':
        return 'Choose from our comprehensive library of compliance assessment templates';
      case 'assessment':
        return 'Answer questions to identify compliance gaps and risks in your organization';
      case 'results':
        return 'Review your compliance analysis and get actionable recommendations';
      default:
        return 'Complete your compliance assessment';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToDashboard}
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold">{getStepTitle()}</h1>
                <p className="text-muted-foreground">{getStepDescription()}</p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="hidden md:flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1 rounded-full text-sm',
                  flowState.step === 'select-template'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    flowState.step === 'select-template'
                      ? 'bg-primary-foreground'
                      : 'bg-muted-foreground'
                  )}
                />
                Template
              </div>

              <div className="w-8 h-px bg-border" />

              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1 rounded-full text-sm',
                  flowState.step === 'assessment'
                    ? 'bg-primary text-primary-foreground'
                    : flowState.step === 'results'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-muted/50 text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    flowState.step === 'assessment'
                      ? 'bg-primary-foreground'
                      : flowState.step === 'results'
                        ? 'bg-muted-foreground'
                        : 'bg-muted-foreground/50'
                  )}
                />
                Assessment
              </div>

              <div className="w-8 h-px bg-border" />

              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1 rounded-full text-sm',
                  flowState.step === 'results'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    flowState.step === 'results'
                      ? 'bg-primary-foreground'
                      : 'bg-muted-foreground/50'
                  )}
                />
                Results
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Template Selection Step */}
        {flowState.step === 'select-template' && (
          <TemplateSelector onTemplateSelect={handleTemplateSelect} onSkip={handleSkipTemplates} />
        )}

        {/* Assessment Step */}
        {flowState.step === 'assessment' && flowState.selectedTemplate && (
          <AssessmentFlow
            templateId={flowState.selectedTemplate.id}
            assessmentId={flowState.assessmentId}
            onComplete={handleAssessmentComplete}
            onSaveAndExit={handleSaveAndExit}
          />
        )}

        {/* Results Step */}
        {flowState.step === 'results' && flowState.assessmentId && (
          <AssessmentResults
            assessmentId={flowState.assessmentId}
            onNavigateToMarketplace={handleNavigateToMarketplace}
            onStartNewAssessment={handleStartNewAssessment}
          />
        )}

        {/* Error State - Invalid Step */}
        {((flowState.step === 'assessment' && !flowState.selectedTemplate) ||
          (flowState.step === 'results' && !flowState.assessmentId)) && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Invalid Assessment State</h3>
              <p className="text-muted-foreground mb-4">
                The assessment flow is in an invalid state. Please start over.
              </p>
              <Button onClick={handleStartNewAssessment} data-testid="button-restart-assessment">
                Start New Assessment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AssessmentFlowPage;
