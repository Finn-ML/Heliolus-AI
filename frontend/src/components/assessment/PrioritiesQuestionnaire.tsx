/**
 * PrioritiesQuestionnaire - Multi-step wizard for priorities input
 * Story 1.14: Priorities Questionnaire UI
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { assessmentApi } from '@/lib/api';
import type { PrioritiesData, PrioritiesDraft, PrioritiesPayload } from '@/types/priorities.types';

// Import step components (will be created next)
import OrganizationalContext from './questionnaire/OrganizationalContext';
import GoalsTimeline from './questionnaire/GoalsTimeline';
import UseCasePrioritization from './questionnaire/UseCasePrioritization';
import SolutionRequirements from './questionnaire/SolutionRequirements';
import VendorPreferences from './questionnaire/VendorPreferences';
import DecisionFactorRanking from './questionnaire/DecisionFactorRanking';
import PrioritiesReview from './questionnaire/PrioritiesReview';

// Validation schemas for each step
// Note: companySize, annualRevenue, and complianceTeamSize come from business profile
const step1Schema = z.object({
  companySize: z.string().optional(), // From business profile
  annualRevenue: z.string().optional(), // From business profile
  complianceTeamSize: z.string().optional(), // From business profile
  jurisdictions: z.array(z.string()).min(1, 'Select at least one jurisdiction'),
  existingSystems: z.array(z.string()).min(1, 'Select at least one option'),
});

const step2Schema = z.object({
  primaryGoal: z.string().min(1, 'Primary goal is required'),
  implementationUrgency: z.number().min(1).max(4),
});

const step3Schema = z.object({
  prioritizedUseCases: z
    .array(
      z.object({
        category: z.string(),
        rank: z.number(),
      })
    )
    .min(3, 'Select and rank at least 3 use cases')
    .max(3),
});

const step4Schema = z.object({
  budgetRange: z.string().min(1, 'Budget range is required'),
  deploymentPreference: z.string().min(1, 'Deployment preference is required'),
  mustHaveFeatures: z.array(z.string()).max(5, 'Select at most 5 features'),
  criticalIntegrations: z.array(z.string()),
});

const step5Schema = z.object({
  vendorMaturity: z.string().min(1, 'Vendor maturity is required'),
  geographicRequirements: z.string().min(1, 'Geographic requirements are required'),
  supportModel: z.string().min(1, 'Support model is required'),
});

const step6Schema = z.object({
  decisionFactorRanking: z
    .array(
      z.object({
        factor: z.string(),
        rank: z.number(),
      })
    )
    .length(6),
});

const STEP_SCHEMAS = [step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, step6Schema];

interface PrioritiesQuestionnaireProps {
  assessmentId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

// Animation variants for step transitions
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function PrioritiesQuestionnaire({
  assessmentId,
  onComplete,
  onCancel,
}: PrioritiesQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const totalSteps = 7;

  // Initialize form with React Hook Form
  const methods = useForm<PrioritiesData>({
    mode: 'onChange',
    defaultValues: {
      step1: {
        // companySize, annualRevenue, complianceTeamSize come from business profile
        jurisdictions: [],
        existingSystems: [],
      },
      step2: {
        primaryGoal: '',
        implementationUrgency: 2,
      },
      step3: {
        prioritizedUseCases: [],
      },
      step4: {
        budgetRange: '',
        deploymentPreference: '',
        mustHaveFeatures: [],
        criticalIntegrations: [],
      },
      step5: {
        vendorMaturity: '',
        geographicRequirements: '',
        supportModel: '',
      },
      step6: {
        decisionFactorRanking: [],
      },
    },
  });

  const { watch, trigger } = methods;

  // Auto-save to localStorage on data change
  useEffect(() => {
    const subscription = watch(value => {
      const cleanedValue = { ...value };

      // Remove deprecated fields that now come from business profile
      if (cleanedValue.step1) {
        const { companySize, annualRevenue, complianceTeamSize, ...restStep1 } = cleanedValue.step1;
        cleanedValue.step1 = restStep1;
      }

      const draft: PrioritiesDraft = {
        assessmentId,
        currentStep,
        data: cleanedValue as PrioritiesData,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(`priorities-draft-${assessmentId}`, JSON.stringify(draft));
    });

    return () => subscription.unsubscribe();
  }, [watch, assessmentId, currentStep]);

  // Restore from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`priorities-draft-${assessmentId}`);
    if (savedDraft) {
      try {
        const draft: PrioritiesDraft = JSON.parse(savedDraft);

        // Validate draft has compatible data (check for old enum values)
        const hasOldEnumValues =
          (draft.data.step1?.annualRevenue?.includes('BETWEEN_')) ||
          (draft.data.step1?.complianceTeamSize === 'SMALL' || draft.data.step1?.complianceTeamSize === 'MEDIUM' || draft.data.step1?.complianceTeamSize === 'LARGE') ||
          (draft.data.step4?.budgetRange?.includes('BETWEEN_')) ||
          (draft.data.step5?.vendorMaturity === 'GROWTH');

        if (hasOldEnumValues) {
          console.warn('Old localStorage data detected, clearing...');
          localStorage.removeItem(`priorities-draft-${assessmentId}`);
          toast({
            title: 'Form Reset',
            description: 'Your previous session data was incompatible and has been cleared. Please fill out the form again.',
            variant: 'default',
          });
          return;
        }

        // Clean up step1 by removing deprecated fields that now come from business profile
        if (draft.data.step1) {
          const { companySize, annualRevenue, complianceTeamSize, ...restStep1 } = draft.data.step1;
          draft.data.step1 = restStep1;
        }

        methods.reset(draft.data);
        setCurrentStep(draft.currentStep);
        toast({
          title: 'Progress Restored',
          description: 'Your previous session has been restored.',
        });
      } catch (error) {
        console.error('Failed to restore draft:', error);
        localStorage.removeItem(`priorities-draft-${assessmentId}`);
      }
    }
  }, [assessmentId, methods]);

  // Mutation for submitting priorities
  const submitPrioritiesMutation = useMutation({
    mutationFn: async (data: PrioritiesPayload) => {
      console.log('[PrioritiesQuestionnaire] Submitting payload:', JSON.stringify(data, null, 2));
      const result = await assessmentApi.submitPriorities(assessmentId, data);
      console.log('[PrioritiesQuestionnaire] Submission result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[PrioritiesQuestionnaire] Success! Data received:', data);

      // Clear localStorage draft
      localStorage.removeItem(`priorities-draft-${assessmentId}`);

      // Invalidate vendor matches query
      queryClient.invalidateQueries({
        queryKey: ['assessments', assessmentId, 'vendor-matches'],
      });

      // Invalidate priorities query
      queryClient.invalidateQueries({
        queryKey: ['assessments', assessmentId, 'priorities'],
      });

      // Invalidate the main assessments query used by Reports page
      queryClient.invalidateQueries({
        queryKey: ['assessments'],
      });

      toast({
        title: 'Priorities Saved',
        description: 'Your priorities have been saved successfully.',
      });

      // Navigate to vendor matches or call onComplete
      if (onComplete) {
        onComplete();
      } else {
        navigate(`/marketplace?assessmentId=${assessmentId}`);
      }
    },
    onError: (error: any) => {
      console.error('[PrioritiesQuestionnaire] Submission error:', error);
      console.error('[PrioritiesQuestionnaire] Error details:', error.response?.data || error);

      // Try to show detailed validation errors
      let errorMessage = error.message;
      if (error.response?.data?.details) {
        errorMessage = JSON.stringify(error.response.data.details, null, 2);
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Navigate to next step
  const handleNext = async () => {
    // Validate current step
    const stepKey = `step${currentStep}` as keyof PrioritiesData;
    const isValid = await trigger(stepKey);

    if (!isValid) {
      toast({
        title: 'Validation Error',
        description: 'Please complete all required fields before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    setDirection(1);
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  // Navigate to previous step
  const handleBack = () => {
    setDirection(-1);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Jump to specific step (from review page)
  const jumpToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  // Handle form submission (from review page)
  const handleSubmit = (data: PrioritiesData) => {
    console.log('[handleSubmit] Raw form data:', JSON.stringify(data, null, 2));

    // Transform implementation urgency number to enum string
    const urgencyMap = ['IMMEDIATE', 'PLANNED', 'STRATEGIC', 'LONG_TERM'];
    const implementationUrgency = urgencyMap[(data.step2?.implementationUrgency || 1) - 1] || 'PLANNED';

    // Transform prioritizedUseCases array to separate selectedUseCases and rankedPriorities
    const prioritizedUseCases = data.step3?.prioritizedUseCases || [];
    const sortedUseCases = [...prioritizedUseCases].sort((a, b) => a.rank - b.rank);
    const rankedPriorities = sortedUseCases.slice(0, 3).map(uc => uc.category);
    const selectedUseCases = prioritizedUseCases.map(uc => uc.category);

    // Transform decisionFactorRanking array to just factor names sorted by rank
    // Note: df.factor contains the ID (like "1", "2"), we need to look up the actual factor name
    const decisionFactors = data.step6?.decisionFactorRanking || [];
    const sortedFactors = [...decisionFactors].sort((a, b) => a.rank - b.rank);

    // Import DECISION_FACTORS to map IDs to names
    const DECISION_FACTORS = [
      { id: '1', factor: 'Total Cost of Ownership' },
      { id: '2', factor: 'Implementation Speed' },
      { id: '3', factor: 'Feature Completeness' },
      { id: '4', factor: 'Vendor Reputation & Stability' },
      { id: '5', factor: 'Integration Capabilities' },
      { id: '6', factor: 'Scalability & Future-readiness' },
    ];

    const decisionFactorRanking = sortedFactors.map(df => {
      const factorDef = DECISION_FACTORS.find(f => f.id === df.factor);
      return factorDef?.factor || df.factor;
    });

    // Flatten data structure for API payload
    const payload = {
      // Step 1 - Note: companySize, annualRevenue, complianceTeamSize are pulled from business profile by backend
      jurisdictions: data.step1?.jurisdictions || [],
      existingSystems: data.step1?.existingSystems || [],

      // Step 2
      primaryGoal: data.step2?.primaryGoal || '',
      implementationUrgency,

      // Step 3
      selectedUseCases,
      rankedPriorities,

      // Step 4
      budgetRange: data.step4?.budgetRange || '',
      deploymentPreference: data.step4?.deploymentPreference || '',
      mustHaveFeatures: data.step4?.mustHaveFeatures || [],
      criticalIntegrations: data.step4?.criticalIntegrations || [],

      // Step 5
      vendorMaturity: data.step5?.vendorMaturity || '',
      geographicRequirements: data.step5?.geographicRequirements || '',
      supportModel: data.step5?.supportModel || '',

      // Step 6
      decisionFactorRanking,
    };

    // Debug: Show what we have in step4
    console.log('[handleSubmit] Step4 data:', {
      budgetRange: data.step4?.budgetRange,
      deploymentPreference: data.step4?.deploymentPreference,
      mustHaveFeatures: data.step4?.mustHaveFeatures,
      criticalIntegrations: data.step4?.criticalIntegrations,
    });

    // Validate payload before submitting
    // Note: companySize, annualRevenue, complianceTeamSize are pulled from business profile by backend
    const missing = [];
    if (payload.jurisdictions.length === 0) missing.push('Jurisdictions');
    if (!payload.primaryGoal) missing.push('Primary Goal');
    if (payload.selectedUseCases.length < 3) missing.push('At least 3 Use Cases');
    if (payload.rankedPriorities.length !== 3) missing.push('3 Ranked Priorities');
    if (!payload.budgetRange) missing.push('Budget Range');
    if (!payload.deploymentPreference) missing.push('Deployment Preference');
    if (!payload.vendorMaturity) missing.push('Vendor Maturity');
    if (!payload.geographicRequirements) missing.push('Geographic Requirements');
    if (!payload.supportModel) missing.push('Support Model');
    if (payload.decisionFactorRanking.length !== 6) missing.push('6 Decision Factors');

    if (missing.length > 0) {
      // Debug: Show what's in payload when validation fails
      console.log('[handleSubmit] Validation failed. Payload:', payload);
      console.log('[handleSubmit] Missing fields:', missing);

      toast({
        title: 'Incomplete Form',
        description: `Missing: ${missing.join(', ')}. Check step 4 (budgetRange: "${data.step4?.budgetRange || 'EMPTY'}")`,
        variant: 'destructive',
      });
      return;
    }

    submitPrioritiesMutation.mutate(payload);
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-950 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Priorities Questionnaire</h1>
            <p className="text-gray-400">
              Help us understand your needs to find the best vendor matches
            </p>
          </div>

          {/* Progress Bar */}
          <Card className="mb-8 bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm font-medium text-cyan-400">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="mt-2 text-xs text-gray-500">
                {currentStep < 7 ? 'Complete all fields to continue' : 'Review and submit'}
              </div>
            </CardContent>
          </Card>

          {/* Step Content with Animation */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-8">
                  {currentStep === 1 && <OrganizationalContext />}
                  {currentStep === 2 && <GoalsTimeline />}
                  {currentStep === 3 && <UseCasePrioritization assessmentId={assessmentId} />}
                  {currentStep === 4 && <SolutionRequirements />}
                  {currentStep === 5 && <VendorPreferences />}
                  {currentStep === 6 && <DecisionFactorRanking />}
                  {currentStep === 7 && (
                    <PrioritiesReview
                      data={watch()}
                      onEdit={jumpToStep}
                      onSubmit={handleSubmit}
                      isSubmitting={submitPrioritiesMutation.isPending}
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          {currentStep < 7 && (
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={currentStep === 1 && onCancel ? onCancel : handleBack}
                disabled={currentStep === 1 && !onCancel}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {currentStep === 1 && onCancel ? 'Cancel' : 'Back'}
              </Button>

              <Button onClick={handleNext} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                {currentStep === 6 ? 'Review' : 'Next'}
                {currentStep === 6 ? (
                  <Check className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowRight className="ml-2 h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </FormProvider>
  );
}
