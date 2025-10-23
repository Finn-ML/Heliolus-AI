import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  AlertTriangle,
  Shield,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface Gap {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedCost?: string;
  estimatedEffort?: string;
  recommendation?: string;
}

interface GapDetailsDialogProps {
  category: string;
  categoryScore: number;
  gaps: Gap[];
  criticalGaps: number;
  totalGaps: number;
  keyFindings?: any[];
  mitigationStrategies?: any[];
  children?: React.ReactNode;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    case 'HIGH':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'LOW':
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'IMMEDIATE':
      return <AlertTriangle className="h-4 w-4 text-red-400" />;
    case 'HIGH':
      return <AlertCircle className="h-4 w-4 text-orange-400" />;
    case 'MEDIUM':
      return <Clock className="h-4 w-4 text-yellow-400" />;
    case 'LOW':
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
};

const formatCategoryTitle = (category: string) => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function GapDetailsDialog({
  category,
  categoryScore,
  gaps,
  criticalGaps,
  totalGaps,
  keyFindings = [],
  mitigationStrategies = [],
  children,
}: GapDetailsDialogProps) {
  const [selectedTab, setSelectedTab] = useState<'gaps' | 'findings' | 'strategies'>('gaps');

  // Ensure gaps is an array
  const gapsArray = Array.isArray(gaps) ? gaps : [];

  // Sort gaps by severity and priority
  const sortedGaps = [...gapsArray].sort((a, b) => {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const priorityOrder = { IMMEDIATE: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Ensure keyFindings and strategies are arrays
  const findingsArray = Array.isArray(keyFindings) ? keyFindings : [];
  const strategiesArray = Array.isArray(mitigationStrategies) ? mitigationStrategies : [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button
            size="sm"
            variant="ghost"
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
          >
            View Details
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh] bg-gray-900 border-gray-800 p-0">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-b border-gray-800 p-6">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">
                    {formatCategoryTitle(category)}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400 mt-1">
                    Detailed analysis of compliance gaps and remediation strategies
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Risk Score</span>
                  <div className="text-2xl font-bold text-orange-400">
                    {categoryScore.toFixed(1)}
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Critical Gaps</span>
                  <div className="text-2xl font-bold text-red-400">
                    {criticalGaps}
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Total Gaps</span>
                  <div className="text-2xl font-bold text-cyan-400">
                    {totalGaps}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mt-4 p-1 bg-gray-800/50 rounded-lg">
              <button
                onClick={() => setSelectedTab('gaps')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  selectedTab === 'gaps'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Gaps ({sortedGaps.length})
                </div>
              </button>
              {findingsArray.length > 0 && (
                <button
                  onClick={() => setSelectedTab('findings')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    selectedTab === 'findings'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Target className="h-4 w-4" />
                    Key Findings ({findingsArray.length})
                  </div>
                </button>
              )}
              {strategiesArray.length > 0 && (
                <button
                  onClick={() => setSelectedTab('strategies')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    selectedTab === 'strategies'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Strategies ({strategiesArray.length})
                  </div>
                </button>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(85vh - 280px)' }}>
          {selectedTab === 'gaps' && (
            <div className="space-y-4">
              {sortedGaps.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No gaps identified in this category</p>
                </div>
              ) : (
                sortedGaps.map((gap, index) => (
                <div
                  key={gap.id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getPriorityIcon(gap.priority)}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">
                          {index + 1}. {gap.title || 'Gap Identified'}
                        </h4>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {gap.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`${getSeverityColor(gap.severity)} border`}>
                        {gap.severity}
                      </Badge>
                    </div>
                  </div>

                  {gap.recommendation && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                        <div>
                          <span className="text-green-400 text-sm font-medium">Recommendation:</span>
                          <p className="text-gray-300 text-sm mt-1">{gap.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(gap.estimatedCost || gap.estimatedEffort) && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50 flex gap-4">
                      {gap.estimatedCost && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm text-gray-400">Cost:</span>
                          <span className="text-sm text-white font-medium">{gap.estimatedCost}</span>
                        </div>
                      )}
                      {gap.estimatedEffort && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-400" />
                          <span className="text-sm text-gray-400">Effort:</span>
                          <span className="text-sm text-white font-medium">{gap.estimatedEffort}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                ))
              )}
            </div>
          )}

          {selectedTab === 'findings' && (
            <div className="space-y-4">
              {findingsArray.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No key findings available</p>
                </div>
              ) : (
                findingsArray.map((finding, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-4 border border-purple-500/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Target className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">
                        Finding {index + 1}: {finding.finding || 'Risk Identified'}
                      </h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {finding.description || 'Analysis in progress'}
                      </p>
                      <div className="mt-3">
                        <Badge className={`${getSeverityColor(finding.severity || 'HIGH')} border`}>
                          {finding.severity || 'HIGH'} SEVERITY
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          )}

          {selectedTab === 'strategies' && (
            <div className="space-y-4">
              {strategiesArray.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No mitigation strategies available</p>
                </div>
              ) : (
                strategiesArray.map((strategy, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-lg p-4 border border-cyan-500/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">
                        {strategy.strategy || 'Mitigation Strategy'}
                      </h4>
                      <p className="text-gray-300 text-sm leading-relaxed mb-3">
                        {strategy.rationale || 'Strategic approach to address identified gaps'}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-800/50 rounded p-2">
                          <span className="text-gray-400 text-xs">Priority</span>
                          <div className="text-white font-medium text-sm mt-1">
                            {strategy.priority || 'High'}
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                          <span className="text-gray-400 text-xs">Impact</span>
                          <div className="text-white font-medium text-sm mt-1">
                            {strategy.impact || 'Significant'}
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                          <span className="text-gray-400 text-xs">Timeline</span>
                          <div className="text-white font-medium text-sm mt-1">
                            {strategy.estimatedTimeframe || 'TBD'}
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                          <span className="text-gray-400 text-xs">Budget</span>
                          <div className="text-white font-medium text-sm mt-1">
                            {strategy.estimatedBudget || 'TBD'}
                          </div>
                        </div>
                      </div>

                      {strategy.keyActions && strategy.keyActions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                          <span className="text-cyan-400 text-sm font-medium">Key Actions:</span>
                          <ul className="mt-2 space-y-1">
                            {strategy.keyActions.map((action: string, actionIndex: number) => (
                              <li key={actionIndex} className="flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 text-cyan-400 mt-0.5" />
                                <span className="text-gray-300 text-sm">{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 bg-gray-900/50">
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Shield className="h-4 w-4" />
                <span>Compliance Analysis powered by AI</span>
              </div>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Close
                </Button>
              </DialogTrigger>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}