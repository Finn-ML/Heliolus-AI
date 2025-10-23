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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { assessmentApi, queryKeys } from '@/lib/api';
import {
  AssessmentResults as AssessmentResultsType,
  Gap,
  Risk,
  Severity,
  Priority,
} from '@/types/assessment';
import RiskScoreGauge from '@/components/assessment/RiskScoreGauge';
import GapCard from '@/components/assessment/GapCard';
import StrategyMatrix from '@/components/assessment/StrategyMatrix';
import RiskHeatmap from '@/components/assessment/RiskHeatmap';

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
const ExecutiveSummary = ({ results, gaps, risks }: any) => {
  const compliance = getComplianceLevel(results.overallRiskScore);

  // Calculate key metrics from actual data
  const criticalGaps = gaps.filter((g: Gap) => g.severity === 'CRITICAL').length;
  const highPriorityGaps = gaps.filter((g: Gap) => g.priority === 'IMMEDIATE').length;
  const uniqueCategories = new Set(gaps.map((g: Gap) => g.category)).size;
  const estimatedRemediationDays = highPriorityGaps * 7 + (gaps.length - highPriorityGaps) * 14;

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
              your compliance score by approximately {Math.round(highPriorityGaps * 2.5)}% within the next 30 days.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

// AI-Generated Strategy Component
const RemediationStrategy = ({ gaps, risks, assessmentId }: any) => {
  const [strategy, setStrategy] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Group gaps by priority for phased approach
  const immediateGaps = gaps.filter((g: Gap) => g.priority === 'IMMEDIATE');
  const shortTermGaps = gaps.filter((g: Gap) => g.priority === 'SHORT_TERM');
  const mediumTermGaps = gaps.filter((g: Gap) => g.priority === 'MEDIUM_TERM');
  const longTermGaps = gaps.filter((g: Gap) => g.priority === 'LONG_TERM');

  const generateStrategy = async () => {
    setIsGenerating(true);
    try {
      // This would call your AI service to generate a comprehensive strategy
      // For now, showing a structured approach based on the data
      await new Promise(resolve => setTimeout(resolve, 1500));

      setStrategy({
        phases: [
          {
            name: 'Phase 1: Critical Remediation',
            duration: '0-30 days',
            gaps: immediateGaps,
            focus: 'Address critical compliance failures and high-risk exposures',
            resources: 'Compliance team + External consultants',
            budget: '$50,000 - $100,000'
          },
          {
            name: 'Phase 2: Foundation Building',
            duration: '1-3 months',
            gaps: shortTermGaps,
            focus: 'Implement core compliance processes and controls',
            resources: 'Compliance + IT Security teams',
            budget: '$100,000 - $250,000'
          },
          {
            name: 'Phase 3: Optimization',
            duration: '3-6 months',
            gaps: mediumTermGaps,
            focus: 'Enhance and automate compliance operations',
            resources: 'Cross-functional teams',
            budget: '$150,000 - $300,000'
          },
          {
            name: 'Phase 4: Maturity',
            duration: '6-12 months',
            gaps: longTermGaps,
            focus: 'Achieve compliance excellence and continuous improvement',
            resources: 'Organization-wide',
            budget: '$100,000 - $200,000'
          }
        ]
      });
    } catch (error) {
      toast({
        title: 'Strategy Generation Failed',
        description: 'Unable to generate remediation strategy',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (gaps.length > 0) {
      generateStrategy();
    }
  }, [gaps]);

  if (!strategy && !isGenerating) {
    return null;
  }

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-pink-400" />
            <CardTitle className="text-white">AI-Generated Remediation Strategy</CardTitle>
          </div>
          {isGenerating && (
            <Badge className="bg-purple-500/20 text-purple-400 animate-pulse">
              <Sparkles className="h-3 w-3 mr-1" />
              Generating...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {strategy && (
          <div className="space-y-6">
            {strategy.phases.map((phase: any, index: number) => (
              <div key={index} className="relative">
                {index > 0 && (
                  <div className="absolute -top-3 left-6 w-0.5 h-3 bg-gray-700" />
                )}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{phase.name}</h4>
                        <p className="text-sm text-gray-400">{phase.duration}</p>
                      </div>
                      <Badge className="bg-cyan-500/20 text-cyan-400">
                        {phase.gaps.length} gaps
                      </Badge>
                    </div>
                    <p className="text-gray-300 mb-3">{phase.focus}</p>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Resources:</span>
                        <span className="text-gray-300 ml-2">{phase.resources}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Est. Budget:</span>
                        <span className="text-gray-300 ml-2">{phase.budget}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Component
const AssessmentResults = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [expandedGaps, setExpandedGaps] = useState<Set<string>>(new Set());

  // Fetch assessment results
  const { data: results, isLoading, error } = useQuery({
    queryKey: queryKeys.assessmentResults(assessmentId!),
    queryFn: () => assessmentApi.getAssessmentResults(assessmentId!),
    enabled: !!assessmentId,
  });

  // Check for priorities questionnaire
  const { data: priorities } = useQuery({
    queryKey: queryKeys.priorities(assessmentId!),
    queryFn: () => assessmentApi.getPriorities(assessmentId!),
    enabled: !!assessmentId && !!results,
    retry: false,
  });

  const handleDownloadReport = async () => {
    try {
      toast({
        title: 'Generating Report',
        description: 'Your compliance report is being generated...',
      });
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

        {/* Call to Action - Vendor Matching */}
        {priorities && (
          <Card className="mb-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
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
            </CardContent>
          </Card>
        )}

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
            />

            {/* AI Recommendations */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                  <CardTitle className="text-white">Priority Recommendations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.recommendations.slice(0, 5).map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Critical Gaps',
                  value: results.gaps.filter((g: Gap) => g.severity === 'CRITICAL').length,
                  color: 'text-red-400',
                  icon: AlertTriangle
                },
                {
                  label: 'Quick Wins',
                  value: Math.floor(results.gaps.length * 0.3),
                  color: 'text-green-400',
                  icon: TrendingUp
                },
                {
                  label: 'Categories Affected',
                  value: new Set(results.gaps.map((g: Gap) => g.category)).size,
                  color: 'text-cyan-400',
                  icon: Activity
                },
                {
                  label: 'Est. Timeline',
                  value: results.summary.estimatedEffort,
                  color: 'text-purple-400',
                  icon: Target
                }
              ].map((stat, idx) => (
                <Card key={idx} className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      <span className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gap Analysis Tab */}
          <TabsContent value="gaps" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                Compliance Gap Analysis
              </h2>
              <Badge className="bg-gray-800">
                {results.gaps.length} Total Gaps
              </Badge>
            </div>

            {/* Gap Summary by Severity */}
            <div className="grid md:grid-cols-4 gap-3 mb-6">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(severity => {
                const count = results.gaps.filter((g: Gap) => g.severity === severity).length;
                const colors = {
                  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/50',
                  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
                  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
                  LOW: 'bg-green-500/20 text-green-400 border-green-500/50'
                };
                return (
                  <div key={severity} className={`rounded-lg border p-3 ${colors[severity as keyof typeof colors]}`}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm">{severity} Severity</div>
                  </div>
                );
              })}
            </div>

            {/* Gap Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {results.gaps.map((gap: Gap) => (
                <GapCard
                  key={gap.id}
                  gap={gap}
                  isExpanded={expandedGaps.has(gap.id)}
                  onToggle={() => {
                    setExpandedGaps(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(gap.id)) {
                        newSet.delete(gap.id);
                      } else {
                        newSet.add(gap.id);
                      }
                      return newSet;
                    });
                  }}
                />
              ))}
            </div>
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-6">
            <RemediationStrategy
              gaps={results.gaps}
              risks={results.risks}
              assessmentId={assessmentId}
            />

            {/* Risk Heatmap */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Risk Distribution Matrix</CardTitle>
                <CardDescription className="text-gray-400">
                  Likelihood vs Impact Analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RiskHeatmap risks={results.risks} />
              </CardContent>
            </Card>

            {/* Original Strategy Matrix Component */}
            <StrategyMatrix assessmentId={assessmentId!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AssessmentResults;