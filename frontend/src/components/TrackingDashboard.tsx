import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Shield,
  AlertCircle,
  Send,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { assessmentApi, rfpApi, queryKeys } from '@/lib/api';
import { AssessmentStatus } from '@/types/assessment';

const TrackingDashboard: React.FC = () => {
  // Fetch assessments
  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: queryKeys.assessments,
    queryFn: assessmentApi.getAssessments,
  });

  // Fetch RFPs
  const { data: rfps = [], isLoading: rfpsLoading } = useQuery({
    queryKey: ['rfps'],
    queryFn: () => rfpApi.getRFPs(),
  });

  // Get latest completed assessment
  const completedAssessments = assessments.filter((a: any) => a.status === 'COMPLETED');
  const latestAssessment = completedAssessments.length > 0
    ? completedAssessments.sort((a: any, b: any) =>
        new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime()
      )[0]
    : null;

  // Fetch latest assessment results if available
  const { data: latestResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['assessmentResults', latestAssessment?.id],
    queryFn: () => assessmentApi.getAssessmentResults(latestAssessment!.id),
    enabled: !!latestAssessment?.id,
  });

  // Calculate stats
  const rfpsSentCount = rfps.filter((rfp: any) => rfp.status === 'SENT').length;
  const openRisksCount = latestResults?.risks?.filter((r: any) =>
    r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL'
  ).length || 0;
  const latestScore = latestAssessment?.riskScore || latestResults?.overallRiskScore || 0;
  const assessmentCount = completedAssessments.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress':
      case 'assessed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending':
      case 'identified':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'mitigated':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-800/50 text-gray-400 border-gray-700';
    }
  };


  return (
    <div className="space-y-6">
      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border border-gray-800 p-1 h-auto">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-gray-400 hover:text-gray-300 transition-all duration-300"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="assessments"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-gray-400 hover:text-gray-300 transition-all duration-300"
          >
            Assessment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                    <Send className="h-5 w-5 text-blue-400" />
                  </div>
                  <CardTitle className="text-sm font-medium text-gray-300">RFPs Sent</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {rfpsLoading ? (
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-white">{rfpsSentCount}</div>
                    <p className="text-sm text-gray-500 mt-1">
                      {rfps.length} total RFPs
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <CardTitle className="text-sm font-medium text-gray-300">High/Critical Risks</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {resultsLoading ? (
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-white">{openRisksCount}</div>
                    <p className="text-sm text-gray-500 mt-1">
                      {latestResults?.risks?.length || 0} total risks identified
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                    <Activity className="h-5 w-5 text-green-400" />
                  </div>
                  <CardTitle className="text-sm font-medium text-gray-300">Latest Score</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {assessmentsLoading || resultsLoading ? (
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                ) : latestScore > 0 ? (
                  <>
                    <div className="text-3xl font-bold text-white">{Math.round(latestScore)}%</div>
                    <p className="text-sm text-gray-400 mt-1">
                      Risk compliance score
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-500">No data</div>
                    <p className="text-sm text-gray-500 mt-1">
                      Complete an assessment
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  </div>
                  <CardTitle className="text-sm font-medium text-gray-300">Assessments</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {assessmentsLoading ? (
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-white">{assessmentCount}</div>
                    <p className="text-sm text-gray-500 mt-1">
                      {latestAssessment ? `Last: ${new Date(latestAssessment.completedAt || latestAssessment.updatedAt).toLocaleDateString()}` : 'No assessments yet'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          {assessmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
            </div>
          ) : completedAssessments.length === 0 ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="py-12">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">
                    No Assessment History
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Complete your first assessment to see your compliance history and track progress over time.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedAssessments.map((assessment: any, index: number) => {
                const completionDate = new Date(assessment.completedAt || assessment.updatedAt);
                const previousAssessment = index < completedAssessments.length - 1
                  ? completedAssessments[index + 1]
                  : null;
                const previousScore = previousAssessment?.riskScore || 0;
                const currentScore = assessment.riskScore || 0;

                return (
                  <Card
                    key={assessment.id}
                    className="bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-300"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg text-white">
                            {assessment.template?.name || 'Assessment'}
                          </CardTitle>
                          <CardDescription className="text-gray-400 flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {completionDate.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            {currentScore > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  Risk Score: {Math.round(currentScore)}%
                                </span>
                                {previousScore > 0 && (
                                  <span
                                    className={cn(
                                      'inline-flex items-center text-sm',
                                      currentScore > previousScore
                                        ? 'text-green-400'
                                        : currentScore < previousScore
                                        ? 'text-red-400'
                                        : 'text-gray-400'
                                    )}
                                  >
                                    {currentScore > previousScore ? (
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                    ) : currentScore < previousScore ? (
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                    ) : null}
                                    {currentScore > previousScore ? '+' : ''}
                                    {Math.round(currentScore - previousScore)}%
                                  </span>
                                )}
                              </>
                            )}
                          </CardDescription>
                        </div>
                        <Badge
                          className={cn(
                            'border',
                            assessment.status === 'COMPLETED'
                              ? getStatusColor('completed')
                              : assessment.status === 'IN_PROGRESS'
                              ? getStatusColor('in-progress')
                              : assessment.status === 'FAILED'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : getStatusColor('pending')
                          )}
                        >
                          {assessment.status === 'COMPLETED' ? 'Completed' :
                           assessment.status === 'IN_PROGRESS' ? 'In Progress' :
                           assessment.status === 'FAILED' ? 'Failed' :
                           assessment.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                          <div className="font-medium text-sm text-gray-400">Risk Score</div>
                          <div className="text-2xl font-bold text-white mt-1">
                            {currentScore > 0 ? `${Math.round(currentScore)}%` : 'N/A'}
                          </div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                          <div className="font-medium text-sm text-gray-400">Credits Used</div>
                          <div className="text-2xl font-bold text-white mt-1">
                            {assessment.creditsUsed || 0}
                          </div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                          <div className="font-medium text-sm text-gray-400">Template</div>
                          <div className="text-sm font-medium text-white mt-1 truncate">
                            {assessment.template?.category || 'N/A'}
                          </div>
                        </div>
                      </div>
                      {assessment.id && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/assessment/results/${assessment.id}`}
                            className="border-cyan-600/50 text-cyan-400 hover:bg-cyan-600/10"
                          >
                            View Details
                            <Activity className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrackingDashboard;
