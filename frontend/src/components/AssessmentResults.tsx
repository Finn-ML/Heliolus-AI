import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Download,
  Users,
  FileText,
  BarChart3,
  ArrowRight,
  Eye,
  Crown,
  Zap,
  Target,
  DollarSign,
  Calendar,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { assessmentApi, queryKeys } from '@/lib/api';
import {
  AssessmentResults as AssessmentResultsType,
  Assessment,
  Gap,
  Risk,
  Severity,
  Priority,
  RiskLevel,
  FreemiumRestrictions,
} from '@/types/assessment';
import {
  BlurOverlay,
  UpgradePrompt,
  RestrictedContent,
  UpgradeDialog,
  FreemiumBanner,
} from '@/components/ui/freemium';
import { toast } from '@/hooks/use-toast';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

interface AssessmentResultsProps {
  assessmentId: string;
  onNavigateToMarketplace?: () => void;
  onStartNewAssessment?: () => void;
  className?: string;
}

const getSeverityColor = (severity: Severity) => {
  const colors = {
    CRITICAL: 'bg-red-600/20 text-red-400',
    HIGH: 'bg-orange-600/20 text-orange-400',
    MEDIUM: 'bg-yellow-600/20 text-yellow-400',
    LOW: 'bg-green-600/20 text-green-400',
  };
  return colors[severity] || 'bg-gray-600/20 text-gray-300';
};

const getRiskLevelColor = (riskLevel: RiskLevel) => {
  const colors = {
    CRITICAL: 'bg-red-600/20 text-red-400',
    HIGH: 'bg-orange-600/20 text-orange-400',
    MEDIUM: 'bg-yellow-600/20 text-yellow-400',
    LOW: 'bg-green-600/20 text-green-400',
  };
  return colors[riskLevel] || 'bg-gray-600/20 text-gray-300';
};

const getPriorityColor = (priority: Priority) => {
  const colors = {
    IMMEDIATE: 'bg-red-600/20 text-red-400',
    SHORT_TERM: 'bg-orange-600/20 text-orange-400',
    MEDIUM_TERM: 'bg-yellow-600/20 text-yellow-400',
    LONG_TERM: 'bg-green-600/20 text-green-400',
  };
  return colors[priority] || 'bg-gray-600/20 text-gray-300';
};

const AssessmentResults = ({
  assessmentId,
  onNavigateToMarketplace,
  onStartNewAssessment,
  className,
}: AssessmentResultsProps) => {
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch assessment results
  const {
    data: results,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.assessmentResults(assessmentId),
    queryFn: () => assessmentApi.getAssessmentResults(assessmentId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch real subscription data
  const { isPremium, isLoading: subscriptionLoading, subscription, isError: subscriptionError } = useSubscriptionCheck();

  // Log subscription data for debugging
  if (typeof window !== 'undefined') {
    console.log('Subscription check:', {
      subscription,
      isPremium,
      isLoading: subscriptionLoading,
      isError: subscriptionError,
      plan: subscription?.plan,
      status: subscription?.status
    });
  }

  // Derive freemium status from actual subscription
  // Default to PREMIUM access if subscription is still loading (assume premium during load)
  const freemiumStatus: FreemiumRestrictions = {
    isFreeTier: subscriptionLoading ? false : !isPremium,
    assessmentsUsed: 1,
    assessmentsLimit: isPremium || subscriptionLoading ? 999 : 1,
    canViewFullResults: isPremium || subscriptionLoading,
    canDownloadReports: isPremium || subscriptionLoading,
    canAccessMarketplace: isPremium || subscriptionLoading,
  };

  const handleUpgrade = (plan: 'monthly' | 'annual') => {
    toast({
      title: 'Upgrade Coming Soon',
      description: `${plan === 'annual' ? 'Annual' : 'Monthly'} subscriptions will be available soon!`,
    });
    setUpgradeDialogOpen(false);
  };

  const handleDownload = () => {
    if (!freemiumStatus.canDownloadReports) {
      setUpgradeDialogOpen(true);
      return;
    }

    // Implementation for download
    toast({
      title: 'Download Started',
      description: 'Your comprehensive assessment report is being generated.',
    });
  };

  const handleMarketplaceAccess = () => {
    if (!freemiumStatus.canAccessMarketplace) {
      setUpgradeDialogOpen(true);
      return;
    }

    onNavigateToMarketplace?.();
  };

  if (isLoading) {
    return (
      <div className={cn('max-w-6xl mx-auto space-y-6', className)}>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className={cn('max-w-6xl mx-auto', className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Results Unavailable</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load assessment results. Please try again.
            </p>
            <Button onClick={() => refetch()} data-testid="button-retry-results">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { assessment, gaps, risks, overallRiskScore, summary, recommendations, nextSteps } =
    results;

  return (
    <div className={cn('max-w-6xl mx-auto space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Assessment Results
              </CardTitle>
              <CardDescription>
                {assessment.template?.name} - Completed{' '}
                {new Date(assessment.completedAt!).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                data-testid="button-download-report"
              >
                <Download className="h-4 w-4 mr-1" />
                Download Report
              </Button>
              <Button onClick={onStartNewAssessment} data-testid="button-new-assessment">
                Start New Assessment
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Freemium Banner */}
      {freemiumStatus.isFreeTier && (
        <FreemiumBanner
          title="Upgrade for Complete Analysis"
          description="Get detailed risk analysis, vendor recommendations, and unlimited assessments"
          ctaText="Upgrade Now"
          onCTA={() => setUpgradeDialogOpen(true)}
        />
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Overall Risk Score</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{overallRiskScore}/100</div>
              <Progress value={overallRiskScore} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Critical Gaps</span>
            </div>
            <div className="text-2xl font-bold mt-2" data-testid="text-critical-gaps">
              {summary.criticalGaps}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium">High Risks</span>
            </div>
            <div className="text-2xl font-bold mt-2" data-testid="text-high-risks">
              {summary.highRisks}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Est. Cost</span>
            </div>
            <div className="text-2xl font-bold mt-2" data-testid="text-estimated-cost">
              {summary.estimatedCost}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="gaps" data-testid="tab-gaps">
            Gap Analysis
          </TabsTrigger>
          <TabsTrigger value="risks" data-testid="tab-risks">
            Risk Assessment
          </TabsTrigger>
          <TabsTrigger value="recommendations" data-testid="tab-recommendations">
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Assessment Overview</h4>
                  <p className="text-muted-foreground">
                    Your organization completed a comprehensive{' '}
                    {assessment.template?.name.toLowerCase()} assessment. The analysis identified{' '}
                    {summary.totalGaps} areas for improvement across multiple compliance domains.
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Key Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Gaps</span>
                        <Badge variant="secondary">{summary.totalGaps}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Critical Issues</span>
                        <Badge className="bg-red-600/20 text-red-400">{summary.criticalGaps}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Priority Level</span>
                        <Badge className={getPriorityColor(summary.priority)}>
                          {summary.priority.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Implementation Timeline</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Estimated Effort</span>
                        <Badge variant="outline">{summary.estimatedEffort}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Investment Range</span>
                        <Badge variant="outline">{summary.estimatedCost}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Immediate Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nextSteps.slice(0, 3).map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <Button
                onClick={handleMarketplaceAccess}
                className="w-full"
                data-testid="button-explore-solutions"
              >
                <Users className="h-4 w-4 mr-2" />
                Explore Vendor Solutions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <BlurOverlay
            isBlurred={!freemiumStatus.canViewFullResults}
            upgradeMessage="Upgrade to view detailed gap analysis"
            onUpgrade={() => setUpgradeDialogOpen(true)}
          >
            <div className="grid gap-4">
              {gaps.map((gap, index) => (
                <Card key={gap.id} data-testid={`gap-card-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{gap.title}</h4>
                        <Badge className="mt-1">{gap.category}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getSeverityColor(gap.severity)}>{gap.severity}</Badge>
                        <Badge className={getPriorityColor(gap.priority)}>
                          {gap.priority.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4">{gap.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">Estimated Impact</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Cost:</span>
                            <span>{gap.estimatedCost}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Effort:</span>
                            <span>{gap.estimatedEffort}</span>
                          </div>
                        </div>
                      </div>

                      {gap.recommendations && gap.recommendations.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Key Recommendations</h5>
                          <ul className="text-sm space-y-1">
                            {gap.recommendations.slice(0, 2).map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </BlurOverlay>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <BlurOverlay
            isBlurred={!freemiumStatus.canViewFullResults}
            upgradeMessage="Upgrade to view detailed risk assessment"
            onUpgrade={() => setUpgradeDialogOpen(true)}
          >
            <div className="grid gap-4">
              {risks.map((risk, index) => (
                <Card key={risk.id} data-testid={`risk-card-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{risk.title}</h4>
                        <Badge className="mt-1">{risk.category}</Badge>
                      </div>
                      <Badge className={getRiskLevelColor(risk.riskLevel)}>
                        {risk.riskLevel} RISK
                      </Badge>
                    </div>

                    <p className="text-muted-foreground mb-4">{risk.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">Risk Assessment</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Likelihood:</span>
                            <span className="capitalize">{risk.likelihood.toLowerCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Impact:</span>
                            <span className="capitalize">{risk.impact.toLowerCase()}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Mitigation Strategy</h5>
                        <p className="text-sm text-muted-foreground">{risk.mitigationStrategy}</p>
                      </div>
                    </div>

                    {risk.recommendedActions && risk.recommendedActions.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Recommended Actions</h5>
                        <ul className="text-sm space-y-1">
                          {risk.recommendedActions.slice(0, 3).map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </BlurOverlay>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Strategic Recommendations
              </CardTitle>
              <CardDescription>
                Prioritized actions to improve your compliance posture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-relaxed">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="text-center">
                <h4 className="font-medium mb-2">Ready to implement these recommendations?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with verified compliance experts and vendors
                </p>
                <Button onClick={handleMarketplaceAccess} data-testid="button-connect-vendors">
                  <Building className="h-4 w-4 mr-2" />
                  Connect with Vendors
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        isOpen={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        features={[
          'Unlimited assessments',
          'Detailed gap analysis',
          'Comprehensive risk reports',
          'Vendor marketplace access',
          'Priority support',
          'Custom compliance templates',
        ]}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default AssessmentResults;
