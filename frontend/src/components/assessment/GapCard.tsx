import { ChevronDown, ChevronUp, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Gap, Severity, Priority } from '@/types/assessment';
import { formatCostRange, formatEffortRange } from '@/utils/assessment-display';

interface GapCardProps {
  gap: Gap;
  isExpanded: boolean;
  onToggle: () => void;
}

const severityColors: Record<Severity, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/50',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  LOW: 'bg-green-500/20 text-green-400 border-green-500/50',
};

const priorityBadgeColors: Record<Priority, string> = {
  IMMEDIATE: 'bg-red-900/50 text-red-300 border-red-700',
  SHORT_TERM: 'bg-orange-900/50 text-orange-300 border-orange-700',
  MEDIUM_TERM: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  LONG_TERM: 'bg-blue-900/50 text-blue-300 border-blue-700',
};

const GapCard: React.FC<GapCardProps> = ({ gap, isExpanded, onToggle }) => {
  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:border-cyan-700/50 transition-all">
      <CardContent className="p-6">
        <Collapsible open={isExpanded}>
          <CollapsibleTrigger onClick={onToggle} className="w-full">
            <div className="flex items-start justify-between text-left">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  <Badge className={severityColors[gap.severity]}>{gap.severity}</Badge>
                  <Badge variant="outline" className={priorityBadgeColors[gap.priority]}>
                    {gap.priority.replace('_', ' ')}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">{gap.title}</h3>

                <p className="text-gray-400 text-sm line-clamp-2">{gap.description}</p>

                <div className="flex items-center gap-4 mt-3 text-xs">
                  <div className="flex items-center gap-1 text-gray-500">
                    <DollarSign className="h-3 w-3" />
                    <span>Cost: {formatCostRange(gap.estimatedCost)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Effort: {formatEffortRange(gap.estimatedEffort)}</span>
                  </div>
                </div>
              </div>

              <div className="ml-4">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
              {/* Category */}
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Category</p>
                <p className="text-sm text-gray-300">{gap.category}</p>
              </div>

              {/* Recommendations */}
              {gap.recommendations && gap.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-2">Recommendations</p>
                  <ul className="space-y-1">
                    {gap.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mitigation Steps */}
              {gap.mitigationSteps && gap.mitigationSteps.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-2">Mitigation Steps</p>
                  <ol className="space-y-1">
                    {gap.mitigationSteps.map((step, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-pink-400 mt-1">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Impact Assessment */}
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-400 mb-2">Impact Assessment</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Priority:</span>
                    <span className="ml-2 text-gray-300">{gap.priority.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Severity:</span>
                    <span className="ml-2 text-gray-300">{gap.severity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Est. Cost:</span>
                    <span className="ml-2 text-gray-300">{formatCostRange(gap.estimatedCost)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Timeline:</span>
                    <span className="ml-2 text-gray-300">
                      {formatEffortRange(gap.estimatedEffort)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default GapCard;
