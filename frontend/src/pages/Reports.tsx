import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { assessmentApi, queryKeys, createMutations } from '@/lib/api';

interface Report {
  id: string;
  title: string;
  type: 'assessment' | 'gap-analysis' | 'vendor-comparison' | 'compliance-status';
  generatedDate: string;
  status: 'completed' | 'generating' | 'failed' | 'complete-priorities';
  description: string;
  tags: string[];
  riskScore?: number;
  gapCount?: number;
  riskCount?: number;
}

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch assessments from API
  const { data: assessments, isLoading, refetch } = useQuery({
    queryKey: queryKeys.assessments,
    queryFn: assessmentApi.getAssessments,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the data at all
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (assessmentId: string) => assessmentApi.deleteAssessment(assessmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
    },
  });

  // Refetch assessments when window gains focus or component mounts
  useEffect(() => {
    // Immediate refetch on mount to ensure fresh data
    refetch();

    const handleFocus = () => {
      refetch();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  // Convert assessments to reports format and filter out failed/draft assessments
  const reports: Report[] = React.useMemo(() => {
    if (!assessments) return [];

    return assessments
      .filter((assessment: any) => {
        // Only include COMPLETED and IN_PROGRESS assessments (exclude FAILED and DRAFT)
        return assessment.status === 'COMPLETED' || assessment.status === 'IN_PROGRESS';
      })
      .map((assessment: any) => {
        const isCompleted = assessment.status === 'COMPLETED';
        // Ensure hasPriorities is properly evaluated as a boolean - handle all cases
        const hasPriorities = Boolean(assessment.hasPriorities);
        const gapCount = assessment.gaps?.length || 0;
        const riskCount = assessment.risks?.length || 0;

        // Determine status based on completion and priorities
        let status: 'completed' | 'generating' | 'complete-priorities' | 'failed';
        if (assessment.status === 'IN_PROGRESS') {
          status = 'generating';
        } else if (isCompleted && hasPriorities) {
          // Assessment is completed AND priorities questionnaire is done
          status = 'completed';
        } else if (isCompleted && !hasPriorities) {
          // Assessment is completed but priorities questionnaire needs to be done
          status = 'complete-priorities';
        } else {
          status = 'generating';
        }

        // Debug for our specific assessment
        if (assessment.id === 'cmh3fju610001phrlckdz3aa2') {
          console.log('[Reports] Mapping assessment cmh3fju610001phrlckdz3aa2:', {
            isCompleted,
            hasPriorities,
            'Boolean(assessment.hasPriorities)': Boolean(assessment.hasPriorities),
            'assessment.hasPriorities raw': assessment.hasPriorities,
            mappedStatus: status,
          });
        }

        return {
          id: assessment.id,
          title: assessment.template?.name || 'Assessment Report',
          type: 'assessment' as const,
          generatedDate: assessment.completedAt || assessment.updatedAt,
          status,
          description: `Risk Score: ${assessment.riskScore || 'Pending'} | ${gapCount} gaps identified | ${riskCount} risks analyzed`,
          tags: [
            assessment.template?.category || 'Compliance',
            assessment.riskScore > 70
              ? 'High Risk'
              : assessment.riskScore > 40
                ? 'Medium Risk'
                : 'Low Risk',
            gapCount > 10 ? 'High Priority' : 'Standard',
          ].filter(Boolean),
          riskScore: assessment.riskScore,
          gapCount,
          riskCount,
        };
      });
  }, [assessments]);

  const filteredReports = reports.filter(report => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <BarChart3 className="h-4 w-4" />;
      case 'gap-analysis':
        return <TrendingUp className="h-4 w-4" />;
      case 'vendor-comparison':
        return <PieChart className="h-4 w-4" />;
      case 'compliance-status':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'complete-priorities':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'generating':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'complete-priorities':
        return <AlertTriangle className="h-4 w-4" />;
      case 'generating':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'complete-priorities':
        return 'Complete Priorities';
      case 'generating':
        return 'Generating';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const handleViewReport = (report: Report) => {
    // Navigate to assessment results page
    navigate(`/assessment/results/${report.id}`);
  };

  const handleDownloadReport = async (report: Report) => {
    try {
      await assessmentApi.downloadPDFReport(report.id);
    } catch (error) {
      console.error('Failed to download report:', error);
      // Could add a toast notification here
    }
  };

  const handleDeleteReport = async (report: Report) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${report.title}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(report.id);
      } catch (error) {
        console.error('Failed to delete report:', error);
        // Could add a toast notification here
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports</h1>
          <p className="text-muted-foreground">
            View, download, and manage all your compliance and assessment reports
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="flex gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="gap-analysis">Gap Analysis</SelectItem>
                <SelectItem value="vendor-comparison">Vendor Comparison</SelectItem>
                <SelectItem value="compliance-status">Compliance Status</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map(report => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getReportIcon(report.type)}
                        <div>
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(report.status)}>
                              {getStatusIcon(report.status)}
                              <span className="ml-1">{getStatusText(report.status)}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <CardDescription className="mb-4">{report.description}</CardDescription>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4" />
                      {new Date(report.generatedDate).toLocaleDateString()}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {report.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs bg-gray-800/50 text-gray-300 border-gray-600 hover:bg-gray-700/50"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewReport(report)}
                        disabled={report.status === 'generating'}
                        data-testid={`button-view-${report.id}`}
                        title={report.status === 'generating' ? 'Report is generating' : 'View report'}
                      >
                        {report.status === 'generating' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 md:mr-2 animate-spin" />
                            <span>Generating</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1 md:mr-2" />
                            <span>View</span>
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadReport(report)}
                        disabled={report.status !== 'completed'}
                        data-testid={`button-download-${report.id}`}
                        title="Download report"
                      >
                        <Download className="h-4 w-4 mr-1 md:mr-2" />
                        <span>Download</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteReport(report)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${report.id}`}
                        title="Delete report"
                      >
                        <Trash2 className="h-4 w-4 mr-1 md:mr-2" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-4">
              {filteredReports.map(report => (
                <Card key={report.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        {getReportIcon(report.type)}
                        <div className="flex-1">
                          <h3 className="font-semibold">{report.title}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge className={getStatusColor(report.status)}>
                              {getStatusIcon(report.status)}
                              <span className="ml-1">{getStatusText(report.status)}</span>
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {new Date(report.generatedDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReport(report)}
                          disabled={report.status === 'generating'}
                          data-testid={`button-view-list-${report.id}`}
                          title={report.status === 'generating' ? 'Report is generating' : 'View report'}
                        >
                          {report.status === 'generating' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 md:mr-2 animate-spin" />
                              <span>Generating</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1 md:mr-2" />
                              <span>View</span>
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownloadReport(report)}
                          disabled={report.status !== 'completed'}
                          data-testid={`button-download-list-${report.id}`}
                          title="Download report"
                        >
                          <Download className="h-4 w-4 mr-1 md:mr-2" />
                          <span>Download</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteReport(report)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-list-${report.id}`}
                          title="Delete report"
                        >
                          <Trash2 className="h-4 w-4 mr-1 md:mr-2" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports found</h3>
            <p className="text-muted-foreground">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Generate your first report by completing an assessment'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
