/**
 * Assessment Priorities Page
 * Story 1.14: Priorities Questionnaire UI
 *
 * Dedicated page for completing the priorities questionnaire
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assessmentApi, queryKeys } from '@/lib/api';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PrioritiesQuestionnaire from '@/components/assessment/PrioritiesQuestionnaire';

export default function AssessmentPriorities() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  // Fetch assessment to verify it exists and is completed
  const {
    data: assessment,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.assessment(assessmentId!),
    queryFn: () => assessmentApi.getAssessment(assessmentId!),
    enabled: !!assessmentId,
  });

  const handleComplete = () => {
    // Navigate to marketplace after completing priorities
    navigate(`/marketplace?assessmentId=${assessmentId}`);
  };

  const handleCancel = () => {
    // Navigate back to assessment results
    navigate(`/assessments/${assessmentId}/results`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <Card className="max-w-2xl mx-auto bg-red-900/20 border-red-800">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-400 mb-2">Assessment Not Found</h2>
            <p className="text-gray-400 mb-4">
              The assessment you're looking for doesn't exist or you don't have permission to access
              it.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/assessment-templates')}
              className="border-gray-700 text-gray-300"
            >
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PrioritiesQuestionnaire
      assessmentId={assessmentId!}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
