import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Target,
  Brain,
  Rocket,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Zap,
  ArrowLeft,
  X,
  Loader2,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import BusinessProfile from '@/components/BusinessProfile';
import RiskAssessmentUpload from '@/components/RiskAssessmentUpload';
import RiskDashboard from '@/components/RiskDashboard';
import DocumentSelectionForAssessment from '@/components/DocumentSelectionForAssessment';
import RiskProfileCard from '@/components/RiskProfileCard';
import { TemplateSelectionStep } from '@/components/assessment/TemplateSelectionStep';
import { GuidedQuestionnaireStep } from '@/components/assessment/questionnaire/GuidedQuestionnaireStep';
import { EnhancedResultsStep } from '@/components/assessment/results/EnhancedResultsStep';
import { AIProcessingStep } from '@/components/assessment/AIProcessingStep';
import { useQuery, useMutation } from '@tanstack/react-query';
import { organizationApi, queryKeys } from '@/lib/api';
import { anonymousApi } from '@/lib/anonymousApi';
import { useAuth } from '@/hooks/useAuth';

const AssessmentJourney = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2); // Start at template selection
  const [businessProfile, setBusinessProfile] = useState(null);
  const [uploadedReport, setUploadedReport] = useState(null);
  const [animateStep, setAnimateStep] = useState(false);
  const { user } = useAuth();
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(null);

  // State tracking for proceed button validation
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [documentsUploading, setDocumentsUploading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Assessment journey state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);

  // Derive whether user can proceed to next step
  const canProceed =
    profileSaved && selectedDocuments.size > 0 && !profileSaving && !documentsUploading;

  // Fetch organization data to get organizationId for DocumentSelectionForAssessment
  const { data: organization } = useQuery({
    queryKey: queryKeys.myOrganization,
    queryFn: organizationApi.getMyOrganization,
    enabled: !!user?.id && !isAnonymousMode,
    retry: 1,
  });

  // Anonymous session initialization mutation
  const initializeAnonymousSession = useMutation({
    mutationFn: anonymousApi.initializeSession,
    onSuccess: data => {
      setAnonymousSessionId(data.sessionId);
      toast({
        title: 'Anonymous session started',
        description: 'Your progress will be saved anonymously.',
      });
    },
    onError: error => {
      console.error('Failed to initialize anonymous session:', error);
      toast({
        title: 'Error starting session',
        description: 'Failed to initialize anonymous session. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome',
      icon: Sparkles,
      color: 'cyan',
    },
    {
      id: 'profile',
      title: 'Business Profile',
      icon: Target,
      color: 'pink',
    },
    {
      id: 'template',
      title: 'Choose Template',
      icon: FileText,
      color: 'cyan',
    },
    {
      id: 'ai-processing',
      title: 'AI Processing',
      icon: Brain,
      color: 'pink',
    },
    {
      id: 'results',
      title: 'Results',
      icon: CheckCircle,
      color: 'cyan',
    },
    {
      id: 'gaps',
      title: 'Gap Analysis',
      icon: Target,
      color: 'pink',
    },
    {
      id: 'marketplace',
      title: 'Solutions',
      icon: Rocket,
      color: 'cyan',
    },
  ];

  const handleNextStep = (fromAnonymousButton = false) => {
    if (fromAnonymousButton) {
      setIsAnonymousMode(true);
    }
    setAnimateStep(true);
    setTimeout(() => {
      setCurrentStep(currentStep + 1);
      setAnimateStep(false);
    }, 300);
  };

  const handleNextStepClick = () => handleNextStep();
  const handleNextStepAnonymous = () => {
    // Initialize anonymous session when starting anonymous mode
    initializeAnonymousSession.mutate();
    handleNextStep(true);
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setAnimateStep(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setAnimateStep(false);
      }, 300);
    }
  };

  const handleProfileComplete = (profile: any) => {
    setBusinessProfile(profile);
    // Remove auto-advance - let the Continue button control navigation
  };

  const handleProfileSaved = (saved: boolean) => {
    setProfileSaved(saved);
  };

  const handleProfileSaving = (saving: boolean) => {
    setProfileSaving(saving);
  };

  const handleDocumentSelectionChange = (selected: Set<string>) => {
    setSelectedDocuments(selected);
  };

  const handleDocumentsUploading = (uploading: boolean) => {
    setDocumentsUploading(uploading);
  };

  const handleReportUploaded = (report: any) => {
    setUploadedReport(report);
    handleNextStep();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="floating-shapes">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-5"
            style={{
              left: `${20 + i * 20}%`,
              top: `${10 + i * 15}%`,
              animation: `float ${15 + i * 5}s infinite ease-in-out`,
            }}
          >
            <div
              className={`w-64 h-64 rounded-full bg-gradient-to-br ${
                i % 2 === 0 ? 'from-cyan-500 to-cyan-400' : 'from-pink-500 to-pink-400'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-cyan-400" />
              <h1 className="text-2xl font-bold gradient-text">Heliolus</h1>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white"
            >
              Exit Journey
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-center ${index !== steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div className="relative">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
                      ${isActive ? `bg-${step.color}-600 glow-${step.color} scale-110` : ''}
                      ${isCompleted ? 'bg-green-600' : 'bg-gray-800'}
                      ${!isActive && !isCompleted ? 'border-2 border-gray-700' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-white" />
                    ) : (
                      <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-white'}`} />
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute -inset-1 rounded-full bg-cyan-500 opacity-30 animate-pulse" />
                  )}
                </div>

                {index !== steps.length - 1 && (
                  <div
                    className={`
                      h-1 flex-1 mx-3 transition-all duration-500
                      ${isCompleted ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gray-800'}
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-sm mt-2">
          {steps.map(step => (
            <span key={step.id} className="text-white">
              {step.title}
            </span>
          ))}
        </div>

        <Progress
          value={(currentStep / (steps.length - 1)) * 100}
          className="mt-4 h-1 bg-gray-800"
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className={`transition-all duration-500 ${animateStep ? 'opacity-0 transform translate-y-4' : 'opacity-100'}`}
        >
          {/* Welcome Step */}
          {currentStep === 0 && (
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-8 inline-flex p-4 rounded-2xl bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/20">
                <Sparkles className="h-16 w-16 text-cyan-400" />
              </div>

              <h2 className="text-4xl font-bold mb-6 gradient-text">
                Begin Your Compliance Transformation
              </h2>

              <p className="text-xl text-white mb-12">
                Our AI-powered assessment will analyze your business profile and risk factors to
                create a personalized compliance strategy tailored to your needs.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  { icon: Target, title: '5 Minutes', description: 'Quick assessment process' },
                  { icon: Brain, title: 'AI Analysis', description: 'Powered by advanced ML' },
                  { icon: Zap, title: 'Instant Results', description: 'Get recommendations now' },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Card
                      key={index}
                      className="bg-gray-900/50 backdrop-blur-sm border-gray-800 card-hover"
                    >
                      <CardContent className="p-6 text-center">
                        <Icon className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
                        <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                        <p className="text-sm text-white">{item.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="space-y-4">
                {user ? (
                  <Button
                    size="lg"
                    onClick={handleNextStepClick}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    data-testid="button-start-assessment"
                  >
                    Start Assessment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <>
                    <div className="space-y-3">
                      <Button
                        size="lg"
                        onClick={handleNextStepAnonymous}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                        data-testid="button-start-without-account"
                      >
                        Start Assessment (No Account Required)
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-700"></div>
                        <span className="text-sm text-gray-400">or</span>
                        <div className="flex-1 h-px bg-gray-700"></div>
                      </div>

                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => navigate('/login')}
                        className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                        data-testid="button-signin-first"
                      >
                        Sign In First
                      </Button>
                    </div>

                    <p className="text-sm text-gray-400 mt-4">
                      Starting without an account? Your progress will be saved and you can create an
                      account later to access all features.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Business Profile Step */}
          {currentStep === 1 && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3 gradient-text">
                  Tell Us About Your Business
                </h2>
                <p className="text-white">
                  Complete each section to proceed with your risk assessment
                </p>
              </div>

              <div className="space-y-4">
                {/* Business Profile Accordion Item */}
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 transition-all duration-300 hover:border-cyan-600/50">
                  <CardHeader
                    className="cursor-pointer p-6"
                    onClick={() =>
                      setExpandedSection(expandedSection === 'profile' ? null : 'profile')
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                          <Target className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                          <CardTitle className="text-white">Business Profile Setup</CardTitle>
                          <CardDescription className="text-gray-400">
                            Tell us about your organization to receive tailored compliance
                            recommendations
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {profileSaved && <CheckCircle className="h-5 w-5 text-green-500" />}
                        <ChevronRight
                          className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === 'profile' ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  {expandedSection === 'profile' && (
                    <CardContent className="p-6 pt-0">
                      <BusinessProfile
                        onProfileComplete={handleProfileComplete}
                        onProfileSaved={handleProfileSaved}
                        onProfileSaving={handleProfileSaving}
                        hideButtons={true}
                        isAnonymous={isAnonymousMode}
                      />
                    </CardContent>
                  )}
                </Card>

                {/* Risk Profile Accordion Item */}
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 transition-all duration-300 hover:border-orange-600/50">
                  <CardHeader
                    className="cursor-pointer p-6"
                    onClick={() => setExpandedSection(expandedSection === 'risk' ? null : 'risk')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <Shield className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                          <CardTitle className="text-white">Financial Crime Risk Profile</CardTitle>
                          <CardDescription className="text-gray-400">
                            Assess your organization's financial crime risk exposure and compliance
                            requirements
                          </CardDescription>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === 'risk' ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </CardHeader>
                  {expandedSection === 'risk' && (
                    <CardContent className="p-6 pt-0">
                      <RiskProfileCard
                        isAnonymous={isAnonymousMode}
                        onRiskProfileSaved={saved => {
                          // Risk profile saving doesn't affect proceed button currently
                          // Could be enhanced to require risk profile completion
                        }}
                        onRiskProfileSaving={saving => {
                          // Could show saving indicator if needed
                        }}
                      />
                    </CardContent>
                  )}
                </Card>

                {/* Document Selection Accordion Item */}
                <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 transition-all duration-300 hover:border-purple-600/50">
                  <CardHeader
                    className="cursor-pointer p-6"
                    onClick={() =>
                      setExpandedSection(expandedSection === 'documents' ? null : 'documents')
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <FileText className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <CardTitle className="text-white">Document Selection</CardTitle>
                          <CardDescription className="text-gray-400">
                            Choose documents for your risk assessment analysis
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedDocuments.size > 0 && (
                          <span className="text-sm text-green-400">
                            {selectedDocuments.size} selected
                          </span>
                        )}
                        <ChevronRight
                          className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === 'documents' ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  {expandedSection === 'documents' && (
                    <CardContent className="p-6 pt-0">
                      <DocumentSelectionForAssessment
                        organizationId={organization?.id || null}
                        className="transition-all duration-500"
                        onSelectionChange={handleDocumentSelectionChange}
                        onUploadingChange={handleDocumentsUploading}
                        hideButtons={true}
                        isAnonymous={isAnonymousMode}
                        anonymousSessionId={anonymousSessionId}
                        onAnalysisComplete={results => {
                          console.log('Risk assessment analysis complete:', results);
                          // Here you could navigate to reports or show results
                        }}
                      />
                    </CardContent>
                  )}
                </Card>
              </div>

              {/* Single Proceed Button with Validation */}
              <div className="mt-8 text-center">
                {/* Status Indicators */}
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    {profileSaved ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-gray-500" />
                    )}
                    <span className={profileSaved ? 'text-green-400' : 'text-gray-400'}>
                      Business profile {profileSaved ? 'saved' : 'not saved'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {selectedDocuments.size > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-gray-500" />
                    )}
                    <span
                      className={selectedDocuments.size > 0 ? 'text-green-400' : 'text-gray-400'}
                    >
                      {selectedDocuments.size > 0
                        ? `${selectedDocuments.size} document${selectedDocuments.size > 1 ? 's' : ''} selected`
                        : 'No documents selected'}
                    </span>
                  </div>
                </div>

                {/* Helper Text */}
                {!canProceed && (
                  <p className="text-sm text-gray-400 mb-4">
                    {!profileSaved && !selectedDocuments.size
                      ? 'Please save your business profile and select at least one document to proceed'
                      : !profileSaved
                        ? 'Please save your business profile to proceed'
                        : !selectedDocuments.size
                          ? 'Please select at least one document to proceed'
                          : profileSaving || documentsUploading
                            ? 'Please wait for the operation to complete...'
                            : ''}
                  </p>
                )}

                {/* Proceed Button */}
                <Button
                  size="lg"
                  onClick={handleNextStepClick}
                  disabled={!canProceed}
                  className="bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-700 hover:to-pink-700 text-white px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg disabled:shadow-none"
                  data-testid="button-proceed-assessment"
                >
                  {profileSaving || documentsUploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {profileSaving ? 'Saving Profile...' : 'Uploading Document...'}
                    </>
                  ) : (
                    <>
                      Proceed to Next Step
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {/* Previous Step Button */}
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    onClick={handlePreviousStep}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Template Selection Step */}
          {currentStep === 2 && (
            <TemplateSelectionStep
              assessmentId={assessmentId || ''}
              onTemplateSelected={async templateId => {
                try {
                  setIsCreatingAssessment(true);
                  setSelectedTemplateId(templateId);

                  // Get organizationId from JWT token
                  const token = localStorage.getItem('token');
                  let organizationIdFromToken = null;

                  if (token) {
                    try {
                      const payload = JSON.parse(atob(token.split('.')[1]));
                      organizationIdFromToken = payload.organizationId;
                      console.log(
                        '[AssessmentJourney] OrganizationId from token:',
                        organizationIdFromToken
                      );
                    } catch (e) {
                      console.error('[AssessmentJourney] Failed to decode token:', e);
                    }
                  }

                  // Use organizationId from token first, then fall back to query result
                  const organizationId = organizationIdFromToken || organization?.id;

                  // Create assessment with selected template
                  const { assessmentApi } = await import('@/lib/api');

                  const assessmentData: any = {
                    templateId: templateId,
                  };

                  // Only include organizationId if user is authenticated and has org
                  if (organizationId) {
                    assessmentData.organizationId = organizationId;
                  }

                  console.log('[AssessmentJourney] Creating assessment with data:', assessmentData);

                  const assessment = await assessmentApi.createAssessment(assessmentData);

                  console.log('[AssessmentJourney] Assessment created:', assessment.id);

                  // Redirect to new card-based journey where user completes profile/docs
                  navigate(`/assessment/journey/${assessment.id}`);
                } catch (error: any) {
                  console.error('Failed to create assessment:', error);

                  let errorMessage =
                    error.message || 'Failed to create assessment. Please try again.';

                  // Handle specific error codes
                  if (error.code === 'NO_ORGANIZATION') {
                    errorMessage =
                      'Please save your business profile first. Your organization details are required to create an assessment.';
                  }

                  toast({
                    title: 'Error creating assessment',
                    description: errorMessage,
                    variant: 'destructive',
                  });
                } finally {
                  setIsCreatingAssessment(false);
                }
              }}
              onBack={handlePreviousStep}
              initialTemplateId={selectedTemplateId || undefined}
            />
          )}

          {/* AI Processing Step */}
          {currentStep === 3 && assessmentId && (
            <AIProcessingStep
              assessmentId={assessmentId}
              onComplete={() => {
                toast({
                  title: 'AI Analysis Complete',
                  description: 'Your assessment has been processed successfully.',
                });
                handleNextStepClick();
              }}
              onError={error => {
                toast({
                  title: 'Processing Error',
                  description: error.message || 'Failed to process assessment. Please try again.',
                  variant: 'destructive',
                });
              }}
            />
          )}

          {/* Loading state for assessment creation */}
          {currentStep === 3 && selectedTemplateId && !assessmentId && isCreatingAssessment && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
              <p className="mt-4 text-lg text-gray-400">Creating your assessment...</p>
            </div>
          )}

          {/* Enhanced Results Step */}
          {currentStep === 4 && assessmentId && (
            <EnhancedResultsStep
              assessmentId={assessmentId}
              onContinue={() => handleNextStepClick()}
              onBack={handlePreviousStep}
            />
          )}

          {/* Gap Analysis Step - Placeholder */}
          {currentStep === 5 && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3 gradient-text">Gap Analysis</h2>
                <p className="text-white">Detailed analysis of compliance gaps and priorities</p>
              </div>

              <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
                <CardContent className="p-8 text-center">
                  <Target className="h-16 w-16 text-pink-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Gap Analysis Coming Soon
                  </h3>
                  <p className="text-gray-400 mb-6">
                    This feature will provide detailed gap prioritization and remediation plans.
                  </p>
                  <Button
                    size="lg"
                    onClick={handleNextStepClick}
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    Continue to Solutions
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Marketplace/Solutions Step - Placeholder */}
          {currentStep === 6 && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3 gradient-text">Recommended Solutions</h2>
                <p className="text-white">
                  Explore vendor solutions tailored to your compliance needs
                </p>
              </div>

              <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
                <CardContent className="p-8 text-center">
                  <Rocket className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-4">Explore Our Marketplace</h3>
                  <p className="text-gray-400 mb-6">
                    Discover compliance solutions from top vendors matched to your specific gaps.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => navigate('/marketplace')}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    data-testid="button-explore-solutions"
                  >
                    Browse Solutions
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
        }
      `}</style>
    </div>
  );
};

export default AssessmentJourney;
