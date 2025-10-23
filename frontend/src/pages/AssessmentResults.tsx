import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Shield,
  Download,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Brain,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  FileText,
  Activity,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { assessmentApi, queryKeys, apiRequest } from '@/lib/api';
import {
  AssessmentResults as AssessmentResultsType,
  Gap,
  Risk,
  Severity,
  Priority,
} from '@/types/assessment';
import RiskScoreGauge from '@/components/assessment/RiskScoreGauge';
import GapDetailsDialog from '@/components/assessment/GapDetailsDialog';

// FIXED: Inverted logic - HIGH scores are GOOD (compliant)
const getComplianceLevel = (score: number): { level: string; color: string; description: string } => {
  if (score >= 80) {
    return {
      level: 'EXCELLENT',
      color: 'text-green-400 bg-green-500/20 border-green-500/50',
      description: 'Outstanding compliance posture with minimal gaps'
    };
  }
  if (score >= 60) {
    return {
      level: 'GOOD',
      color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/50',
      description: 'Strong compliance with some areas for improvement'
    };
  }
  if (score >= 40) {
    return {
      level: 'MODERATE',
      color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50',
      description: 'Adequate compliance but significant improvements needed'
    };
  }
  if (score >= 20) {
    return {
      level: 'NEEDS IMPROVEMENT',
      color: 'text-orange-400 bg-orange-500/20 border-orange-500/50',
      description: 'Major compliance gaps requiring immediate attention'
    };
  }
  return {
    level: 'CRITICAL',
    color: 'text-red-400 bg-red-500/20 border-red-500/50',
    description: 'Critical compliance failures requiring urgent remediation'
  };
};

// AI-Generated Executive Summary Component
const ExecutiveSummary = ({ results, gaps, risks, aiMetrics }: any) => {
  const compliance = getComplianceLevel(results.overallRiskScore);

  // Use AI-generated metrics when available, fallback to calculated values
  const criticalGaps = gaps.filter((g: Gap) => g.severity === 'CRITICAL').length;
  const highPriorityGaps = gaps.filter((g: Gap) => g.priority === 'IMMEDIATE').length;
  const uniqueCategories = new Set(gaps.map((g: Gap) => g.category)).size;
  // Use AI-generated remediation days if available
  const estimatedRemediationDays = aiMetrics?.avgRemediationDays || (highPriorityGaps * 7 + (gaps.length - highPriorityGaps) * 14);

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-800/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-400" />
          <CardTitle className="text-white">Executive Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 leading-relaxed">
            Your organization demonstrates a <strong className={compliance.color}>{compliance.level}</strong> compliance
            posture with a score of <strong>{results.overallRiskScore}%</strong>. {compliance.description}.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">{gaps.length}</div>
              <div className="text-sm text-gray-400">Total Gaps Identified</div>
              {criticalGaps > 0 && (
                <Badge className="mt-2 bg-red-500/20 text-red-400 border-red-500/50">
                  {criticalGaps} Critical
                </Badge>
              )}
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">{uniqueCategories}</div>
              <div className="text-sm text-gray-400">Affected Areas</div>
              <div className="text-xs text-gray-500 mt-1">
                Across compliance domains
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-white mb-1">
                {Math.ceil(estimatedRemediationDays / 30)}<span className="text-lg font-normal"> months</span>
              </div>
              <div className="text-sm text-gray-400">Est. Remediation Time</div>
              <div className="text-xs text-gray-500 mt-1">
                For full compliance
              </div>
            </div>
          </div>

          <Alert className="mt-6 bg-cyan-900/20 border-cyan-800/50">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="text-gray-300">
              <strong>Key Insight:</strong> Addressing your {highPriorityGaps} immediate priority gaps could improve
              your compliance score by approximately {aiMetrics?.totalRiskReduction ? Math.round(aiMetrics.totalRiskReduction / 4) : Math.round(highPriorityGaps * 2.5)}% within the next 30 days.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

// AI-Powered Risk Areas Analysis Component
const RiskAreasAnalysis = ({ gaps, assessmentId }: { gaps: Gap[]; assessmentId: string }) => {
  const [analysisData, setAnalysisData] = useState<any>(null);

  // Fetch AI analysis from database (generates if not exists) - Story 3.5
  const { data: aiData, isLoading: isGenerating, error } = useQuery({
    queryKey: ['ai-analysis', assessmentId],
    queryFn: async () => {
      const response = await apiRequest<any>(`/assessments/${assessmentId}/ai-analysis`);
      return response.data;
    },
    enabled: gaps.length > 0,
    staleTime: Infinity, // Never refetch - it's permanent
    cacheTime: Infinity, // Keep in cache forever
    retry: 1, // Only retry once on failure
  });

  // Update analysisData when aiData changes
  useEffect(() => {
    if (aiData?.riskAnalysis) {
      setAnalysisData(aiData.riskAnalysis);
    }
  }, [aiData]);

  // Group gaps by category (for fallback and display)
  const gapsByCategory = gaps.reduce((acc: Record<string, Gap[]>, gap) => {
    if (!acc[gap.category]) {
      acc[gap.category] = [];
    }
    acc[gap.category].push(gap);
    return acc;
  }, {});

  // Calculate risk score for each category (0-10 scale)
  const calculateCategoryRiskScore = (categoryGaps: Gap[]) => {
    const severityWeights = { CRITICAL: 10, HIGH: 7.5, MEDIUM: 5, LOW: 2.5 };
    const totalWeight = categoryGaps.reduce((sum, gap) =>
      sum + severityWeights[gap.severity as keyof typeof severityWeights], 0
    );
    const maxWeight = categoryGaps.length * 10;
    return Math.min(10, (totalWeight / maxWeight) * 10).toFixed(1);
  };

  // Get risk level badge color
  const getRiskLevelBadge = (score: number) => {
    if (score >= 7) return { label: 'High Risk', color: 'bg-red-500 text-white' };
    if (score >= 4) return { label: 'Medium Risk', color: 'bg-yellow-500 text-gray-900' };
    return { label: 'Low Risk', color: 'bg-green-500 text-white' };
  };

  // Display generation date if available (AC 6)
  const generatedAt = aiData?.generatedAt;

  // Show loading banner at the top, but don't block content
  const showLoadingBanner = isGenerating && !analysisData;
  const showErrorBanner = error && !analysisData;

  if (!analysisData && !isGenerating && !error) return null;

  return (
    <div className="space-y-8">
      {/* Loading Banner */}
      {showLoadingBanner && (
        <Alert className="border-cyan-800 bg-cyan-900/20">
          <Brain className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Generating AI analysis (one-time process)... This may take up to 5 seconds.</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Banner */}
      {showErrorBanner && (
        <Alert className="border-red-800 bg-red-900/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            AI analysis generation is taking longer than expected. You can view basic gap information below, or refresh the page to retry.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Risk Areas Analysis</h2>
        <p className="text-gray-400">
          Detailed breakdown of identified risk areas with AI-generated findings and mitigation strategies
        </p>
      </div>

      {/* Risk Area Cards */}
      {analysisData && Object.entries(analysisData).map(([category, data]: [string, any]) => {
        const riskLevel = getRiskLevelBadge(parseFloat(data.score));
        const progressPercentage = (parseFloat(data.score) / 10) * 100;

        // Get the actual gaps for this category
        const categoryGaps = gaps.filter((gap: Gap) => gap.category === category);

        return (
          <Card key={category} className="bg-gray-900/50 backdrop-blur-sm border-gray-800 overflow-hidden">
            {/* Category Header */}
            <div className="px-6 py-4 border-b border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">
                    {category.replace(/_/g, ' ')}
                  </h3>
                  <Badge className={riskLevel.color}>
                    {riskLevel.label}
                  </Badge>
                  {data.criticalGaps > 0 && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                      {data.criticalGaps} Critical
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-white">
                  {data.score}<span className="text-sm text-gray-400">/10</span>
                </div>
              </div>

              {/* Risk Score Progress Bar */}
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                    parseFloat(data.score) >= 7 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                    parseFloat(data.score) >= 4 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    'bg-gradient-to-r from-green-500 to-cyan-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Key Findings and Mitigation Strategies */}
            <div className="grid md:grid-cols-2 divide-x divide-gray-800">
              {/* Key Findings Column */}
              <div className="p-6">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Key Findings
                </h4>
                <div className="space-y-3">
                  {data.keyFindings.map((finding: any, idx: number) => (
                    <div key={finding.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <AlertTriangle className={`h-4 w-4 ${
                          finding.severity === 'CRITICAL' ? 'text-red-400' :
                          finding.severity === 'HIGH' ? 'text-orange-400' :
                          'text-yellow-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {finding.finding}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mitigation Strategies Column */}
              <div className="p-6">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Mitigation Strategies
                </h4>
                <div className="space-y-3">
                  {data.mitigationStrategies.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {item.strategy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer with Quick Stats */}
            <div className="px-6 py-3 bg-gray-800/30 border-t border-gray-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  {data.totalGaps} total gaps identified in this category
                </span>
                <GapDetailsDialog
                  category={category}
                  categoryScore={parseFloat(data.score)}
                  gaps={categoryGaps}
                  criticalGaps={data.criticalGaps}
                  totalGaps={data.totalGaps}
                  keyFindings={data.keyFindings || []}
                  mitigationStrategies={data.mitigationStrategies || []}
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// Risk Mitigation Strategy Matrix Component
const RemediationStrategy = ({ gaps, risks, assessmentId }: any) => {
  const [strategyData, setStrategyData] = useState<any[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Use the same query as RiskAreasAnalysis (will share cache) - Story 3.5
  const { data: aiData, isLoading: isGenerating, error } = useQuery({
    queryKey: ['ai-analysis', assessmentId],
    queryFn: async () => {
      const response = await apiRequest<any>(`/assessments/${assessmentId}/ai-analysis`);
      return response.data;
    },
    enabled: gaps.length > 0,
    staleTime: Infinity, // Never refetch - it's permanent
    cacheTime: Infinity, // Keep in cache forever
  });

  // Helper to parse budget string to number
  const parseBudget = (budget: string | undefined): number => {
    if (!budget) return 0;
    const match = budget.match(/\$(\d+)k/);
    return match ? parseInt(match[1], 10) * 1000 : 0;
  };

  // Helper to parse timeline string to number (in weeks)
  const parseTimeline = (timeline: string | undefined): number => {
    if (!timeline) return 0;
    if (timeline.includes('week')) {
      const match = timeline.match(/(\d+)-?(\d*)\s*weeks?/);
      if (match) {
        return match[2] ? (parseInt(match[1]) + parseInt(match[2])) / 2 : parseInt(match[1]);
      }
    }
    if (timeline.includes('month')) {
      const match = timeline.match(/(\d+)-?(\d*)\s*months?/);
      if (match) {
        const months = match[2] ? (parseInt(match[1]) + parseInt(match[2])) / 2 : parseInt(match[1]);
        return months * 4; // Convert to weeks
      }
    }
    return 0;
  };

  // Update strategyData when aiData changes
  useEffect(() => {
    if (aiData?.strategyMatrix) {
      // Transform backend data to add budgetValue and timelineValue
      const transformedData = aiData.strategyMatrix.map((item: any) => ({
        ...item,
        budgetValue: parseBudget(item.budget),
        timelineValue: parseTimeline(item.timeline)
      }));
      setStrategyData(transformedData);
    }
  }, [aiData]);

  // REMOVED: Generate strategy matrix data with setTimeout
  // Now using real API data from backend
  /*
  useEffect(() => {
    const generateStrategyMatrix = async () => {
      setIsGenerating(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Group gaps by category and create strategy rows
        const gapsByCategory = gaps.reduce((acc: Record<string, Gap[]>, gap) => {
          if (!acc[gap.category]) {
            acc[gap.category] = [];
          }
          acc[gap.category].push(gap);
          return acc;
        }, {});

        const strategies = Object.entries(gapsByCategory).map(([category, categoryGaps], index) => {
          const criticalCount = categoryGaps.filter(g => g.severity === 'CRITICAL').length;
          const highCount = categoryGaps.filter(g => g.severity === 'HIGH').length;

          // Determine risk level and urgency
          let riskLevel = 'LOW';
          let urgency = 'LONG_TERM';

          if (criticalCount > 0) {
            riskLevel = 'HIGH';
            urgency = 'IMMEDIATE';
          } else if (highCount > 2) {
            riskLevel = 'HIGH';
            urgency = 'SHORT_TERM';
          } else if (highCount > 0) {
            riskLevel = 'MEDIUM';
            urgency = 'MEDIUM_TERM';
          }

          // Calculate impact score
          const impactScore = (criticalCount * 10 + highCount * 5 + categoryGaps.length) / 10;

          // Generate primary mitigation strategy
          const mitigation = `Deploy automated ${category.toLowerCase().replace(/_/g, ' ')} platform with AI-powered monitoring and real-time compliance validation suitable for ${categoryGaps.length > 5 ? 'enterprise-scale' : 'mid-market'} operations`;

          // Estimate timeline and budget
          const timelineMonths = urgency === 'IMMEDIATE' ? 1.5 : urgency === 'SHORT_TERM' ? 3 : urgency === 'MEDIUM_TERM' ? 6 : 9;
          const budget = urgency === 'IMMEDIATE' ? 75000 : urgency === 'SHORT_TERM' ? 150000 : urgency === 'MEDIUM_TERM' ? 250000 : 100000;

          return {
            priority: index + 1,
            riskArea: category.replace(/_/g, ' '),
            adjustedRisk: riskLevel,
            urgency: urgency.replace(/_/g, ' '),
            impact: impactScore.toFixed(1),
            primaryMitigation: mitigation,
            timeline: `${timelineMonths} months`,
            timelineValue: timelineMonths,
            budget: `$${budget.toLocaleString()}`,
            budgetValue: budget,
            businessOwner: getBusinessOwner(category),
            gapCount: categoryGaps.length,
            criticalGaps: criticalCount
          };
        });

        // Sort by priority initially
        setStrategyData(strategies.sort((a, b) => {
          if (a.adjustedRisk === 'HIGH' && b.adjustedRisk !== 'HIGH') return -1;
          if (a.adjustedRisk !== 'HIGH' && b.adjustedRisk === 'HIGH') return 1;
          return a.priority - b.priority;
        }));
      } catch (error) {
        toast({
          title: 'Strategy Generation Failed',
          description: 'Unable to generate mitigation strategy',
          variant: 'destructive'
        });
      } finally {
        setIsGenerating(false);
      }
    };

    if (gaps.length > 0) {
      generateStrategyMatrix();
    }
  }, [gaps]);
  */

  // Show loading banner at the top, but don't block content
  const showLoadingBanner = isGenerating && strategyData.length === 0;
  const showErrorBanner = error && strategyData.length === 0;

  // If no data and not loading/error, don't render anything
  if (!strategyData.length && !isGenerating && !error) {
    return null;
  }

  // Helper function to determine business owner
  const getBusinessOwner = (category: string) => {
    const owners: Record<string, string> = {
      'DATA_PROTECTION': 'Chief Data Officer',
      'TRANSACTION_MONITORING': 'Head of Compliance',
      'CUSTOMER_DUE_DILIGENCE': 'KYC Manager',
      'RISK_ASSESSMENT': 'Chief Risk Officer',
      'REGULATORY_REPORTING': 'Compliance Director',
      'TRAINING': 'Head of L&D',
      'GOVERNANCE': 'Chief Compliance Officer',
      'TECHNOLOGY': 'Chief Technology Officer',
      'AUDIT': 'Chief Audit Executive',
      'THIRD_PARTY': 'Vendor Management'
    };
    return owners[category] || 'Compliance Team';
  };

  // Sort function
  const handleSort = (column: string) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);

    const sorted = [...strategyData].sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      // Handle numeric sorting
      if (column === 'impact') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else if (column === 'timeline') {
        aVal = a.timelineValue;
        bVal = b.timelineValue;
      } else if (column === 'budget') {
        aVal = a.budgetValue;
        bVal = b.budgetValue;
      }

      if (aVal < bVal) return newDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setStrategyData(sorted);
  };

  // Get badge styles
  const getRiskBadgeStyle = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-red-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-gray-900';
      default:
        return 'bg-green-500 text-white';
    }
  };

  const getUrgencyBadgeStyle = (urgency: string) => {
    if (urgency === 'IMMEDIATE') return 'bg-red-900 text-red-200 border-red-700';
    if (urgency === 'SHORT TERM') return 'bg-orange-900 text-orange-200 border-orange-700';
    if (urgency === 'MEDIUM TERM') return 'bg-yellow-900 text-yellow-200 border-yellow-700';
    return 'bg-gray-800 text-gray-300 border-gray-700';
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Target className="h-12 w-12 text-cyan-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Generating mitigation strategies...</p>
        </div>
      </div>
    );
  }

  // Calculate total investment (only if we have data)
  const totalInvestment = strategyData.length > 0 ? strategyData.reduce((sum, item) => sum + item.budgetValue, 0) : 0;
  const criticalPriorities = strategyData.filter(s => s.adjustedRisk === 'HIGH').length;
  const immediateActions = strategyData.filter(s => s.urgency === 'IMMEDIATE').length;
  const averageTimeline = strategyData.length > 0 ? (strategyData.reduce((sum, item) => sum + item.timelineValue, 0) / strategyData.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Loading Banner */}
      {showLoadingBanner && (
        <Alert className="border-cyan-800 bg-cyan-900/20">
          <Target className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Generating strategy matrix (one-time process)... This may take up to 5 seconds.</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Banner */}
      {showErrorBanner && (
        <Alert className="border-red-800 bg-red-900/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Strategy matrix generation is taking longer than expected. Please refresh the page to retry.
          </AlertDescription>
        </Alert>
      )}

      {/* Header Stats */}
      {strategyData.length > 0 && (
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Total Strategic Investment</div>
            <div className="text-2xl font-bold text-white">
              ${(totalInvestment / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-gray-500 mt-1">Over {averageTimeline} months average</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Critical Priority</div>
            <div className="text-2xl font-bold text-red-400">{criticalPriorities}</div>
            <div className="text-xs text-gray-500 mt-1">High-risk areas</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Immediate Actions</div>
            <div className="text-2xl font-bold text-orange-400">{immediateActions}</div>
            <div className="text-xs text-gray-500 mt-1">Require urgent attention</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Risk Reduction</div>
            <div className="text-2xl font-bold text-green-400">
              {strategyData.reduce((sum: number, s: any) => sum + (s.riskReductionPercent || 15), 0)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Expected improvement (AI-generated)</div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Strategy Matrix Table */}
      {strategyData.length > 0 && (
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Risk Mitigation Strategy Matrix</CardTitle>
              <CardDescription className="text-gray-400">
                Prioritized mitigation strategies with business context, adjusted for your Intermediate Compliance (Scale-up Level) maturity level
              </CardDescription>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-400">
              {strategyData.length} strategies
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('priority')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                    >
                      Priority
                      {sortColumn === 'priority' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('riskArea')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                    >
                      Risk Area
                      {sortColumn === 'riskArea' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Adjusted Risk
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Urgency
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('impact')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                    >
                      Impact
                      {sortColumn === 'impact' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Primary Mitigation
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('timeline')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                    >
                      Timeline
                      {sortColumn === 'timeline' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('budget')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                    >
                      Budget
                      {sortColumn === 'budget' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Business Owner
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {strategyData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-300">#{row.priority}</span>
                        {index === 0 && (
                          <Badge className="ml-2 bg-red-500/20 text-red-400 text-xs">
                            P1
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{row.riskArea}</div>
                        {row.criticalGaps > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {row.gapCount} gaps • {row.criticalGaps} critical
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge className={`${getRiskBadgeStyle(row.adjustedRisk)} text-xs px-2 py-1`}>
                        {row.adjustedRisk}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge className={`${getUrgencyBadgeStyle(row.urgency)} border text-xs px-2 py-1`}>
                        {row.urgency}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-white">{row.impact}</div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-300 max-w-xs">
                        {row.primaryMitigation}
                      </p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{row.timeline}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-cyan-400">{row.budget}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{row.businessOwner}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Action Footer */}
      {strategyData.length > 0 && (
        <Alert className="bg-cyan-900/20 border-cyan-800/50">
          <Target className="h-4 w-4" />
          <AlertDescription className="text-gray-300">
            Focus on high-risk areas that require immediate attention and quick wins to improve compliance posture.
            This strategic roadmap provides a clear path to achieve compliance excellence within {averageTimeline} months.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// AI Analysis Component - Displays AI-generated insights (Story 3.4)
const AIAnalysisSection = ({ assessmentId }: { assessmentId: string }) => {
  // Use the GET endpoint which automatically generates if not exists
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-analysis', assessmentId],
    queryFn: async () => {
      const response = await apiRequest<any>(`/assessments/${assessmentId}/ai-analysis`);
      return response.data;
    },
    enabled: !!assessmentId,
    retry: false,
  });

  const handleRetryGeneration = () => {
    refetch();
  };

  // Show error state
  if (error && !isLoading) {
    return (
      <Card className="bg-red-900/20 border-red-800/50">
        <CardContent className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Unable to Load AI Analysis
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              {(error as any)?.message || 'An error occurred while loading AI analysis'}
            </p>
            <Button
              onClick={handleRetryGeneration}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-900/20"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
        <CardContent className="p-12">
          <div className="text-center">
            <Brain className="h-12 w-12 text-cyan-400 animate-pulse mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Loading AI Analysis...</p>
            <p className="text-gray-500 text-sm">This may take a few moments if generating for the first time</p>
            <Progress value={66} className="mt-4 max-w-xs mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const analysis = {
    overview: data.aiGeneratedOverview,
    content: data.aiGeneratedContent,
    risks: data.aiGeneratedRisks,
    strategies: data.aiGeneratedStrategies
  };

  return (
    <div className="space-y-6">
      {/* AI Overview */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-800/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">AI Executive Analysis</CardTitle>
            <Badge className="bg-cyan-500/20 text-cyan-400 ml-auto">
              AI Generated
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {analysis.overview}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Risk Assessment */}
      {analysis.risks && (
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <CardTitle className="text-white">AI Risk Assessment</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {analysis.risks}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Strategies */}
      {analysis.strategies && (
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-400" />
              <CardTitle className="text-white">AI Strategic Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {analysis.strategies}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Main Component
const AssessmentResults = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  // Fetch assessment results
  const { data: results, isLoading, error } = useQuery({
    queryKey: queryKeys.assessmentResults(assessmentId!),
    queryFn: () => assessmentApi.getAssessmentResults(assessmentId!),
    enabled: !!assessmentId,
  });

  // Fetch AI-generated metrics
  const { data: aiAnalysis } = useQuery({
    queryKey: ['ai-analysis', assessmentId],
    queryFn: async () => {
      const response = await apiRequest<any>(`/assessments/${assessmentId}/ai-analysis`);
      return response.data;
    },
    enabled: !!assessmentId && !!results && (results.gaps?.length > 0),
    staleTime: Infinity,
    retry: 1,
  });

  // Check for priorities questionnaire
  const { data: priorities, refetch: refetchPriorities, isLoading: prioritiesLoading } = useQuery({
    queryKey: queryKeys.priorities(assessmentId!),
    queryFn: () => assessmentApi.getPriorities(assessmentId!),
    enabled: !!assessmentId && !!results,
    retry: false,
    staleTime: 0, // Always consider stale to ensure fresh data
    cacheTime: 0, // Don't cache at all
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Debug priorities
  useEffect(() => {
    if (assessmentId === 'cmh3fju610001phrlckdz3aa2') {
      console.log('[AssessmentResults] Debug priorities for cmh3fju610001phrlckdz3aa2:', {
        priorities,
        prioritiesLoading,
        hasPriorities: !!priorities,
      });
    }
  }, [priorities, prioritiesLoading, assessmentId]);

  // Refetch priorities when returning to the page or mounting
  useEffect(() => {
    // Immediate refetch on mount to ensure we have fresh data
    if (assessmentId && results) {
      refetchPriorities();
    }

    const handleFocus = () => {
      if (assessmentId && results) {
        refetchPriorities();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [assessmentId, results, refetchPriorities]);

  const handleDownloadReport = async () => {
    try {
      toast({
        title: 'Generating Report',
        description: 'Your compliance report is being generated...',
      });

      // First generate the PDF report
      await assessmentApi.generatePDFReport(assessmentId!);

      // Then download it
      await assessmentApi.downloadPDFReport(assessmentId!);

      toast({
        title: 'Report Downloaded',
        description: 'Your report has been downloaded successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message || 'Unable to download report',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-cyan-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Analyzing assessment results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <Alert className="max-w-2xl mx-auto border-red-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load assessment results. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const compliance = getComplianceLevel(results.overallRiskScore);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/5 via-gray-950 to-purple-900/5" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Compliance Assessment Results
              </h1>
              <p className="text-gray-400">
                Comprehensive analysis completed on {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/reports')}
                className="border-gray-700"
              >
                View All Reports
              </Button>
              <Button
                onClick={handleDownloadReport}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Compliance Score Card - Updated with correct interpretation */}
        <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-8">
              <div className="flex-shrink-0">
                <RiskScoreGauge score={results.overallRiskScore} size="large" />
              </div>
              <div className="flex-1">
                <div className="mb-4">
                  <Badge className={`text-lg px-4 py-2 ${compliance.color}`}>
                    {compliance.level}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Your Compliance Score: {results.overallRiskScore}%
                </h2>
                <p className="text-gray-300 text-lg">
                  {compliance.description}
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-gray-400">Gaps Identified:</span>
                    <span className="text-white font-semibold ml-2">{results.gaps.length}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Risks Found:</span>
                    <span className="text-white font-semibold ml-2">{results.risks.length}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Priority:</span>
                    <span className="text-white font-semibold ml-2">
                      {results.summary.priority.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action - Questionnaire or Vendor Matching */}
        <Card className="mb-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-800/50">
          <CardContent className="p-6">
            {!priorities ? (
              // Show Priorities Questionnaire CTA if not completed
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Target className="h-6 w-6 text-pink-400" />
                    Complete Your Priorities Questionnaire
                  </h3>
                  <p className="text-gray-300">
                    Tell us about your organization's priorities and get personalized vendor
                    recommendations based on your specific needs.
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/assessments/${assessmentId}/priorities`)}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Complete Questionnaire
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            ) : (
              // Show Vendor Matching CTA if priorities completed
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Ready to Address Your Compliance Gaps?
                  </h3>
                  <p className="text-gray-300">
                    Discover vendors matched to your specific compliance needs
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/marketplace?assessmentId=${assessmentId}`)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Find Matching Vendors
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-900/50 border border-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
            <TabsTrigger value="strategy">Strategy Matrix</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <ExecutiveSummary
              results={results}
              gaps={results.gaps}
              risks={results.risks}
              aiMetrics={aiAnalysis?.metrics}
            />
          </TabsContent>

          {/* Gap Analysis Tab */}
          <TabsContent value="gaps" className="space-y-6">
            <RiskAreasAnalysis gaps={results.gaps} assessmentId={assessmentId!} />
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-6">
            <RemediationStrategy
              gaps={results.gaps}
              risks={results.risks}
              assessmentId={assessmentId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AssessmentResults;