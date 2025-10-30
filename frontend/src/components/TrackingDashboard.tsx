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

interface Assessment {
  id: string;
  date: string;
  overallScore: number;
  previousScore?: number;
  risks: { category: string; score: number; previousScore?: number }[];
  status: 'completed' | 'in-progress';
  businessProfile: any;
}

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

  const [assessments] = useState<Assessment[]>([
    {
      id: '1',
      date: '2024-01-15',
      overallScore: 82,
      previousScore: 75,
      status: 'completed',
      businessProfile: { name: 'Current Assessment' },
      risks: [
        { category: 'AML', score: 85, previousScore: 78 },
        { category: 'KYC', score: 80, previousScore: 72 },
        { category: 'Data Privacy', score: 79, previousScore: 75 },
        { category: 'Sanctions', score: 88, previousScore: 85 },
      ],
    },
    {
      id: '2',
      date: '2024-01-01',
      overallScore: 75,
      previousScore: 68,
      status: 'completed',
      businessProfile: { name: 'Previous Assessment' },
      risks: [
        { category: 'AML', score: 78, previousScore: 70 },
        { category: 'KYC', score: 72, previousScore: 65 },
        { category: 'Data Privacy', score: 75, previousScore: 68 },
        { category: 'Sanctions', score: 85, previousScore: 82 },
      ],
    },
  ]);

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
          <div className="space-y-4">
            {assessments.map((assessment, index) => (
              <Card
                key={assessment.id}
                className="bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">
                        Assessment - {assessment.date}
                      </CardTitle>
                      <CardDescription className="text-gray-400 flex items-center gap-2 mt-1">
                        <span>Overall Score: {assessment.overallScore}%</span>
                        {assessment.previousScore && (
                          <span
                            className={cn(
                              'inline-flex items-center text-sm',
                              assessment.overallScore > assessment.previousScore
                                ? 'text-green-400'
                                : 'text-red-400'
                            )}
                          >
                            {assessment.overallScore > assessment.previousScore ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {assessment.overallScore > assessment.previousScore ? '+' : ''}
                            {assessment.overallScore - assessment.previousScore}%
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className={cn('border', getStatusColor(assessment.status))}>
                      {assessment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {assessment.risks.map(risk => (
                      <div
                        key={risk.category}
                        className="text-center p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                      >
                        <div className="font-medium text-sm text-gray-400">{risk.category}</div>
                        <div className="text-2xl font-bold text-white mt-1">{risk.score}%</div>
                        {risk.previousScore && (
                          <div
                            className={cn(
                              'text-xs flex items-center justify-center mt-1',
                              risk.score > risk.previousScore ? 'text-green-400' : 'text-red-400'
                            )}
                          >
                            {risk.score > risk.previousScore ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {risk.score > risk.previousScore ? '+' : ''}
                            {risk.score - risk.previousScore}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrackingDashboard;
