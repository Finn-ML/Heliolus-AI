import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getNextSteps, type NextStepsPanelProps } from './types/results.types';

export const NextStepsPanel: React.FC<NextStepsPanelProps> = ({ assessmentId, hasPriorities }) => {
  const navigate = useNavigate();
  const nextSteps = getNextSteps(hasPriorities);

  const handleStepClick = (action: string) => {
    switch (action) {
      case 'priorities':
        // Navigate to priorities questionnaire
        navigate(`/assessment/${assessmentId}/priorities`);
        break;
      case 'gaps':
        // Navigate to gap analysis
        navigate(`/assessment/${assessmentId}/gaps`);
        break;
      case 'vendors':
        // Navigate to vendor marketplace
        navigate('/marketplace');
        break;
      default:
        break;
    }
  };

  return (
    <Card className="p-6 mt-6">
      <h3 className="text-lg font-semibold text-white mb-4">🎯 Next Steps</h3>

      <div className="space-y-4">
        {nextSteps.map((step, index) => (
          <div
            key={step.id}
            className={`p-4 rounded-lg border ${step.enabled ? 'bg-gray-800/50' : 'bg-gray-800/30 opacity-60'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{step.icon}</span>
                  <h4 className="font-medium text-white">
                    {index + 1}. {step.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-400 ml-10">{step.description}</p>
              </div>
              <Button
                onClick={() => handleStepClick(step.ctaAction)}
                disabled={!step.enabled}
                className="ml-4 bg-cyan-600 hover:bg-cyan-700"
              >
                {step.ctaLabel} →
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
