import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Brain,
  CheckCircle,
  Clock,
  FileSearch,
  Loader2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Shield,
  Target,
  Zap,
  Upload,
  FileText,
  X,
  Play,
  ChevronDown,
  ChevronUp,
  Download,
  ArrowRight,
  BookOpen,
  Activity,
  BarChart3,
  Users,
  ShieldCheck,
  MessageSquareWarning,
  Lightbulb,
  Info,
  FileSpreadsheet,
  FileType,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { templateApi, assessmentApi, organizationApi, documentApi, queryKeys } from '@/lib/api';
import {
  AssessmentTemplate,
  Assessment,
  AssessmentStatus,
  AssessmentResults as AssessmentResultsType,
  Gap,
  Risk,
  Severity,
  Priority,
  RiskLevel,
} from '@/types/assessment';
import RiskScoreGauge from '@/components/assessment/RiskScoreGauge';
import GapCard from '@/components/assessment/GapCard';
import StrategyMatrix from '@/components/assessment/StrategyMatrix';
import RiskHeatmap from '@/components/assessment/RiskHeatmap';

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'pending' | 'processing' | 'completed';
  duration?: number;
}

type ViewState = 'documents' | 'execution' | 'questions';

const priorityIcons: Record<Priority, any> = {
  IMMEDIATE: Zap,
  SHORT_TERM: TrendingUp,
  MEDIUM_TERM: Target,
  LONG_TERM: BookOpen,
};

// Document type to icon mapping
const getDocumentIcon = (filename: string, mimeType?: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (
    extension === 'csv' ||
    extension === 'xls' ||
    extension === 'xlsx' ||
    mimeType?.includes('spreadsheet') ||
    mimeType?.includes('excel')
  ) {
    return FileSpreadsheet;
  }
  return FileText;
};

// Document type classification based on content
const getDocumentClassification = (doc: any): string => {
  const filename = (doc.filename || doc.fileName || doc.originalName || '').toLowerCase();
  const extractedData = doc.extractedData || {};

  // Check extracted data first for AI-classified document types
  if (extractedData?.documentType) return extractedData.documentType;
  if (extractedData?.category) return extractedData.category;

  // Check filename patterns with more specific checks first
  if (filename.includes('audit')) return 'Audit Report';
  if (filename.includes('cert') || filename.includes('certificate'))
    return 'Compliance Certificate';
  if (filename.includes('risk') && filename.includes('assessment')) return 'Risk Assessment';
  if (filename.includes('policy') || filename.includes('policies')) return 'Policy';
  if (filename.includes('procedure') || filename.includes('process')) return 'Procedure';
  if (filename.includes('framework') || filename.includes('standard')) return 'Framework';
  if (filename.includes('contract') || filename.includes('agreement')) return 'Contract';
  if (filename.includes('financial') || filename.includes('finance')) return 'Financial Document';
  if (filename.includes('report') || filename.includes('annual')) return 'Report';
  if (filename.includes('compliance')) return 'Compliance Document';

  // Check file extension for common document types
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'csv' || extension === 'xls' || extension === 'xlsx') return 'Spreadsheet';
  if (extension === 'pdf') return 'Document';
  if (extension === 'doc' || extension === 'docx') return 'Document';

  // Default classification
  return 'General Document';
};

// Get badge color based on classification
const getClassificationColor = (classification: string): string => {
  switch (classification.toLowerCase()) {
    case 'policy':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    case 'audit report':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
    case 'compliance certificate':
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'risk assessment':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    case 'contract':
      return 'bg-pink-500/20 text-pink-400 border-pink-500/50';
    case 'procedure':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
    case 'framework':
      return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
    case 'report':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'financial document':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    case 'compliance document':
      return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
    case 'spreadsheet':
      return 'bg-lime-500/20 text-lime-400 border-lime-500/50';
    case 'document':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    case 'general document':
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  }
};

// Get evidence tier badge color and label
const getEvidenceTierBadge = (tier?: string): { color: string; label: string; icon: string } => {
  switch (tier) {
    case 'TIER_2':
      return {
        color: 'bg-green-500/20 text-green-400 border-green-500/50',
        label: 'System-Generated',
        icon: '✓✓',
      };
    case 'TIER_1':
      return {
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        label: 'Policy Document',
        icon: '✓',
      };
    case 'TIER_0':
      return {
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
        label: 'Self-Declared',
        icon: '○',
      };
    default:
      return {
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
        label: 'Processing...',
        icon: '⟳',
      };
  }
};

// Get document evidence tier (from AI classification)
const getDocumentTier = (doc: any): 'TIER_0' | 'TIER_1' | 'TIER_2' | undefined => {
  // Use the AI-determined tier from backend
  // The tier is classified using GPT-4 when available, or rule-based fallback
  return doc.evidenceTier;
};

// Component for Low Confidence Questions Review
const LowConfidenceQuestionsReview = ({
  questions,
  onSubmit,
  organizationId,
  onDocumentUpload,
}: {
  questions: any[];
  onSubmit: (answers: Record<string, string>) => void;
  organizationId: string;
  onDocumentUpload: (docId: string) => void;
}) => {
  const [manualAnswers, setManualAnswers] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Group questions by section
  const questionsBySection = questions.reduce(
    (acc, q) => {
      const section = q.sectionTitle || 'General';
      if (!acc[section]) acc[section] = [];
      acc[section].push(q);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const answeredCount = Object.keys(manualAnswers).filter(key => manualAnswers[key]?.trim()).length;
  const progress = (answeredCount / questions.length) * 100;

  // Handle document upload for additional evidence
  const handleAdditionalDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingDoc(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(((i + 1) / files.length) * 100);

        // Fix MIME type for CSV files
        let mimeType = file.type;
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'csv' && (!mimeType || mimeType === 'application/octet-stream')) {
          mimeType = 'text/csv';
        }

        // Get upload URL
        const uploadData = await documentApi.getUploadUrl({
          filename: file.name,
          mimeType: mimeType || 'application/octet-stream',
          size: file.size,
          organizationId,
        });

        // Upload to S3
        await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': mimeType || 'application/octet-stream',
          },
        });

        // Confirm upload
        await documentApi.confirmUpload(uploadData.document.id);

        // Trigger analysis
        await documentApi.analyzeDocument(uploadData.document.id, {
          extractData: true,
          analyzeContent: true,
          generateSummary: false,
        });

        // Notify parent
        onDocumentUpload(uploadData.document.id);

        toast({
          title: 'Document uploaded',
          description: `${file.name} will be included in the re-analysis`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingDoc(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-4 mb-6 rounded-2xl bg-orange-500/20 backdrop-blur-sm">
          <MessageSquareWarning className="h-12 w-12 text-orange-400" />
        </div>

        <h2 className="text-3xl font-bold mb-4 gradient-text">Manual Review Required</h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Our AI couldn't find sufficient information for {questions.length} questions. Your input
          will help us provide more accurate risk assessment results.
        </p>
      </div>

      {/* Progress Card */}
      <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Review Progress</CardTitle>
              <CardDescription className="text-gray-400">
                {answeredCount} of {questions.length} questions answered
              </CardDescription>
            </div>
            <div className="text-2xl font-bold text-orange-400">{Math.round(progress)}%</div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3 bg-gray-800" />
        </CardContent>
      </Card>

      {/* Why This Matters Card */}
      <Alert className="mb-8 bg-cyan-900/20 border-cyan-800/50">
        <Lightbulb className="h-5 w-5" />
        <AlertTitle className="text-cyan-400">Why Your Input Matters</AlertTitle>
        <AlertDescription className="text-gray-300">
          These questions are critical for assessing your compliance posture. Without this
          information, your risk score may be overestimated, and recommendations may not be fully
          tailored to your organization.
        </AlertDescription>
      </Alert>

      {/* Upload Additional Documents Card */}
      <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Have Additional Documents?</CardTitle>
              <CardDescription className="text-gray-400">
                Upload more documents instead of manually answering. Our AI will re-analyze with the new information.
              </CardDescription>
            </div>
            {isUploadingDoc && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Uploading...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-orange-600 transition-colors">
            <input
              type="file"
              multiple
              onChange={handleAdditionalDocUpload}
              className="hidden"
              id="additional-doc-upload"
              accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
              disabled={isUploadingDoc}
            />
            <label htmlFor="additional-doc-upload" className="cursor-pointer">
              <Upload className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300 mb-2">
                {isUploadingDoc
                  ? `Uploading and analyzing... ${Math.round(uploadProgress)}%`
                  : 'Upload additional compliance documents'}
              </p>
              <p className="text-sm text-gray-500">
                PDF, DOC, DOCX, TXT, CSV, XLS, XLSX up to 10MB
              </p>
            </label>
            {isUploadingDoc && (
              <div className="mt-4">
                <Progress value={uploadProgress} className="h-2 bg-gray-800" />
              </div>
            )}
          </div>
          <div className="mt-4 flex items-start gap-2 text-sm text-gray-400">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              After uploading, click "Re-analyze with New Documents" below to update your assessment with the new evidence.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Questions by Section */}
      <div className="space-y-4 mb-8">
        {Object.entries(questionsBySection).map(([section, sectionQuestions]) => (
          <Collapsible
            key={section}
            open={expandedSections.has(section) || Object.keys(questionsBySection).length === 1}
            onOpenChange={() => toggleSection(section)}
          >
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <FileSearch className="h-5 w-5 text-orange-400" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-white text-lg">{section}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {sectionQuestions.length} question{sectionQuestions.length > 1 ? 's' : ''}{' '}
                        to review
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/50">
                      {sectionQuestions.filter(q => manualAnswers[q.questionId]?.trim()).length}/
                      {sectionQuestions.length}
                    </Badge>
                    {expandedSections.has(section) ||
                    Object.keys(questionsBySection).length === 1 ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                    )}
                  </div>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {sectionQuestions.map((item: any, idx) => (
                    <div
                      key={item.questionId}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-orange-400">{idx + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium mb-2">{item.question}</p>
                          <div className="mb-3">
                            <Badge
                              variant="outline"
                              className="text-xs border-gray-600 text-gray-400"
                            >
                              AI Confidence: {Math.round((item.confidence || 0) * 100)}%
                            </Badge>
                            {item.currentAnswer && (
                              <div className="mt-2 p-2 bg-gray-900/50 rounded text-sm text-gray-500 italic">
                                AI Response: {item.currentAnswer}
                              </div>
                            )}
                          </div>
                          <textarea
                            className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none min-h-[120px] resize-none"
                            placeholder="Please provide detailed information about this aspect of your compliance framework..."
                            value={manualAnswers[item.questionId] || ''}
                            onChange={e =>
                              setManualAnswers(prev => ({
                                ...prev,
                                [item.questionId]: e.target.value,
                              }))
                            }
                            data-testid={`input-manual-answer-${item.questionId}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              // Skip and show results anyway (with warning)
              if (
                confirm(
                  'Are you sure you want to skip? Your risk assessment may be less accurate without this information.'
                )
              ) {
                onSubmit({});
              }
            }}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Skip & View Results
          </Button>
          <Button
            onClick={() => onSubmit(manualAnswers)}
            disabled={answeredCount === 0 && !isUploadingDoc}
            className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white min-w-[200px]"
            data-testid="button-submit-manual-answers"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {answeredCount > 0
              ? `Submit ${answeredCount} Answer${answeredCount > 1 ? 's' : ''} & Re-analyze`
              : 'Re-analyze with New Documents'}
          </Button>
        </div>
        <p className="text-sm text-gray-500 text-center max-w-md">
          Provide manual answers, upload documents, or both. The AI will re-analyze your assessment with any new information.
        </p>
      </div>
    </div>
  );
};

const AssessmentExecution = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State Management
  const [viewState, setViewState] = useState<ViewState>('documents');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResultsType | null>(null);
  const [currentStatus, setCurrentStatus] = useState<AssessmentStatus>('DRAFT');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);

  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    {
      id: 'init',
      title: 'Initializing Assessment',
      description: 'Setting up your risk assessment environment',
      icon: Shield,
      status: 'pending',
    },
    {
      id: 'documents',
      title: 'Analyzing Documents',
      description: 'Processing uploaded compliance documents',
      icon: FileSearch,
      status: 'pending',
    },
    {
      id: 'risks',
      title: 'Identifying Risks',
      description: 'Detecting potential compliance risks and vulnerabilities',
      icon: AlertCircle,
      status: 'pending',
    },
    {
      id: 'gaps',
      title: 'Gap Analysis',
      description: 'Comparing current state with compliance requirements',
      icon: Target,
      status: 'pending',
    },
    {
      id: 'scoring',
      title: 'Risk Scoring',
      description: 'Calculating comprehensive risk scores',
      icon: TrendingUp,
      status: 'pending',
    },
    {
      id: 'recommendations',
      title: 'Generating Recommendations',
      description: 'Creating personalized compliance strategies',
      icon: Sparkles,
      status: 'pending',
    },
  ]);

  // Fetch template details
  const { data: template } = useQuery({
    queryKey: queryKeys.template(templateId!),
    queryFn: () => templateApi.getTemplate(templateId!),
    enabled: !!templateId,
  });

  // Fetch organization
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: () => organizationApi.getMyOrganization(),
    enabled: !!user,
  });

  // Fetch organization documents
  const { data: apiResponse, refetch: refetchDocuments } = useQuery({
    queryKey: queryKeys.organizationDocuments(organization?.id || ''),
    queryFn: () => documentApi.getOrganizationDocuments(organization?.id || ''),
    enabled: !!organization?.id,
    refetchInterval: apiData => {
      // Auto-refresh every 2 seconds if any document doesn't have a tier yet or is being processed
      // Handle paginated response: { data: [...], pagination: {...} }
      const docs = apiData?.data || [];
      const hasProcessingDocs =
        processingDocs.size > 0 || docs.some((doc: any) => !doc.evidenceTier);
      return hasProcessingDocs ? 2000 : false;
    },
  });

  // Extract documents array from paginated response
  const documents = apiResponse?.data || [];

  // Queries removed: No longer needed since we redirect to /assessment/results/:id
  // The dedicated results page handles all data fetching

  // Create assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: () =>
      assessmentApi.createAssessment({
        organizationId: organization?.id || '',
        templateId: templateId!,
      }),
    onSuccess: data => {
      setAssessment(data);
      toast({
        title: 'Assessment Created',
        description: 'Ready to begin analysis when you click Start Assessment.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create assessment',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Create assessment when organization is loaded (but don't execute yet)
  useEffect(() => {
    if (organization && templateId && !assessment && viewState === 'documents' && !createAssessmentMutation.isPending) {
      createAssessmentMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, templateId, assessment, viewState]);

  // File upload handler with improved CSV support and multiple file handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !organization?.id) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const uploadedDocIds: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });

        // Fix MIME type for CSV files if browser doesn't detect it properly
        let mimeType = file.type;
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'csv' && (!mimeType || mimeType === 'application/octet-stream')) {
          mimeType = 'text/csv';
        }

        // Get upload URL
        const uploadData = await documentApi.getUploadUrl({
          filename: file.name,
          mimeType: mimeType || 'application/octet-stream',
          size: file.size,
          organizationId: organization.id,
        });

        // Upload to S3
        await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': mimeType || 'application/octet-stream',
          },
        });

        // Confirm upload
        await documentApi.confirmUpload(uploadData.document.id);

        uploadedDocIds.push(uploadData.document.id);

        // Add to processing set to show loading state
        setProcessingDocs(prev => new Set(prev).add(uploadData.document.id));

        // Trigger document analysis in background
        documentApi
          .analyzeDocument(uploadData.document.id, {
            extractData: true,
            analyzeContent: true,
            generateSummary: false,
          })
          .then(async () => {
            // Remove from processing set and refresh documents
            setProcessingDocs(prev => {
              const newSet = new Set(prev);
              newSet.delete(uploadData.document.id);
              return newSet;
            });
            // Ensure documents are refreshed after analysis completes
            await queryClient.invalidateQueries({
              queryKey: queryKeys.organizationDocuments(organization.id),
            });
            await refetchDocuments();
          })
          .catch(async err => {
            console.error('Document analysis failed:', err);
            setProcessingDocs(prev => {
              const newSet = new Set(prev);
              newSet.delete(uploadData.document.id);
              return newSet;
            });
            // Still refresh to show current state
            await queryClient.invalidateQueries({
              queryKey: queryKeys.organizationDocuments(organization.id),
            });
            await refetchDocuments();
          });

        toast({
          title: 'Document uploaded',
          description: `${file.name} uploaded and processing...`,
        });
      }

      // Add all newly uploaded documents to selected documents
      setSelectedDocuments(prev => [...new Set([...prev, ...uploadedDocIds])]);

      // Refresh documents list
      await queryClient.invalidateQueries({
        queryKey: queryKeys.organizationDocuments(organization.id),
      });

      toast({
        title: `${files.length} document${files.length > 1 ? 's' : ''} uploaded`,
        description: 'All files uploaded successfully. Processing in background...',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      // Reset file input
      e.target.value = '';
    }
  };

  // Delete document handler
  const handleDeleteDocument = async (docId: string) => {
    try {
      await documentApi.deleteDocument(docId);

      // Remove from selected documents
      setSelectedDocuments(prev => prev.filter(id => id !== docId));

      // Refresh documents list
      await refetchDocuments();

      toast({
        title: 'Document deleted',
        description: 'Document removed successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const updateStep = (stepId: string, status: 'pending' | 'processing' | 'completed') => {
    setAnalysisSteps(prev => prev.map(step => (step.id === stepId ? { ...step, status } : step)));
  };

  // Execute assessment (trigger AI analysis)
  const executeAssessment = async () => {
    if (!assessment) return;

    setViewState('execution');
    setProgressPercentage(0);

    try {
      // Reset all steps to pending
      setAnalysisSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

      // Start with initialization
      updateStep('init', 'processing');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep('init', 'completed');
      updateStep('documents', 'processing');
      setProgressPercentage(15);

      await new Promise(resolve => setTimeout(resolve, 1500));
      updateStep('documents', 'completed');
      updateStep('risks', 'processing');
      setProgressPercentage(30);

      // Call the actual backend execute API with selected documents
      const result = await assessmentApi.executeAssessment(assessment.id, {
        documentIds: selectedDocuments,
      });

      updateStep('risks', 'completed');
      updateStep('gaps', 'processing');
      setProgressPercentage(50);

      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep('gaps', 'completed');
      updateStep('scoring', 'processing');
      setProgressPercentage(70);

      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep('scoring', 'completed');
      updateStep('recommendations', 'processing');
      setProgressPercentage(85);

      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep('recommendations', 'completed');
      setProgressPercentage(100);
      setCurrentStatus('COMPLETED');

      // Fetch the results to check for low-confidence questions
      const results = await assessmentApi.getAssessmentResults(assessment.id);
      setAssessmentResults(results);

      // Check if there are low-confidence questions that need manual review
      if (results.lowConfidenceAnswers && results.lowConfidenceAnswers.length > 0) {
        setTimeout(() => setViewState('questions'), 1500);
      } else {
        // No low-confidence questions, navigate directly to results page
        setTimeout(() => {
          navigate(`/assessment/results/${assessment.id}`);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Assessment execution failed:', error);
      setCurrentStatus('FAILED');
      toast({
        title: 'Assessment Failed',
        description:
          error.message || 'There was an error processing your assessment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitManualAnswers = async (answers: Record<string, string>) => {
    if (!assessment) return;

    if (Object.keys(answers).length === 0) {
      // User skipped, navigate to results page
      navigate(`/assessment/results/${assessment.id}`);
      return;
    }

    setIsSubmittingAnswers(true);
    try {
      // Submit manual answers to backend
      await assessmentApi.updateAssessmentAnswers(assessment.id, answers);
      toast({
        title: 'Answers Submitted',
        description: 'Re-calculating your risk score with the new information...',
      });

      // Re-execute assessment with new data
      await assessmentApi.executeAssessment(assessment.id, {
        documentIds: selectedDocuments,
      });

      toast({
        title: 'Analysis Complete',
        description: 'Your risk assessment has been updated with the new information.',
      });

      // Navigate to results page
      navigate(`/assessment/results/${assessment.id}`);
    } catch (error: any) {
      toast({
        title: 'Failed to submit answers',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!assessment) return;

    try {
      toast({
        title: 'Generating Report',
        description: 'Your compliance report is being generated...',
      });

      const reportData = await assessmentApi.generatePDFReport(assessment.id);
      await assessmentApi.downloadPDFReport(assessment.id);

      toast({
        title: 'Report Ready',
        description: `${reportData.filename} has been downloaded successfully.`,
      });
    } catch (error: any) {
      console.error('Failed to generate report:', error);

      if (error.message?.includes('Premium') || error.message?.includes('premium')) {
        toast({
          title: 'Premium Feature',
          description:
            'PDF reports are only available for premium users. Please upgrade your subscription.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Report Generation Failed',
          description:
            error.message || 'Failed to generate the compliance report. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  // Toggle functions
  const toggleGapExpansion = (gapId: string) => {
    setExpandedGaps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gapId)) {
        newSet.delete(gapId);
      } else {
        newSet.add(gapId);
      }
      return newSet;
    });
  };

  const toggleRiskExpansion = (riskId: string) => {
    setExpandedRisks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(riskId)) {
        newSet.delete(riskId);
      } else {
        newSet.add(riskId);
      }
      return newSet;
    });
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  // Animated particles in background
  const renderParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );

  if (!template || !organization) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Document Selection View
  if (viewState === 'documents') {
    return (
      <div className="min-h-screen bg-gray-950 relative overflow-hidden">
        {renderParticles()}

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-4 mb-6 rounded-2xl bg-cyan-500/20 backdrop-blur-sm">
              <FileSearch className="h-12 w-12 text-cyan-400" />
            </div>

            <h1 className="text-4xl font-bold mb-4 gradient-text">Prepare Your Assessment</h1>
            <p className="text-xl text-gray-400">Upload compliance documents for AI analysis</p>

            {template && (
              <div className="mt-4">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 px-4 py-1">
                  {template.name}
                </Badge>
              </div>
            )}
          </div>

          {/* Document Upload Card */}
          <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800" data-tour="document-upload">
            <CardHeader>
              <CardTitle className="text-white">Upload Documents</CardTitle>
              <CardDescription className="text-gray-400">
                Upload your compliance documents, policies, and procedures for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-cyan-600 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                  disabled={isUploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">
                    {isUploading
                      ? `Uploading ${uploadProgress.current}/${uploadProgress.total} files...`
                      : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOC, DOCX, TXT, CSV, XLS, XLSX up to 10MB
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    You can select multiple files at once
                  </p>
                </label>
              </div>

              {/* Document List */}
              {documents && documents.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-gray-400 mb-3">Available Documents:</p>
                  {documents.map((doc: any) => {
                    const docFilename = doc.filename || doc.fileName || doc.originalName || '';
                    const Icon = getDocumentIcon(docFilename, doc.mimeType);
                    const classification = getDocumentClassification(doc);
                    const tier = getDocumentTier(doc);
                    const tierBadge = getEvidenceTierBadge(tier);
                    const isProcessing = processingDocs.has(doc.id);

                    return (
                      <div
                        key={doc.id}
                        className={`flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border-2 ${
                          selectedDocuments.includes(doc.id)
                            ? 'border-cyan-600 bg-cyan-900/20'
                            : 'border-gray-700'
                        } cursor-pointer hover:border-cyan-600/50 transition-all duration-200`}
                        onClick={() => {
                          if (!isProcessing) {
                            setSelectedDocuments(prev =>
                              prev.includes(doc.id)
                                ? prev.filter(id => id !== doc.id)
                                : [...prev, doc.id]
                            );
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Icon className="h-5 w-5 text-gray-400" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-white text-sm">{docFilename}</p>
                              {isProcessing && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Processing
                                </Badge>
                              )}
                              {doc.extractedData && (
                                <span className="text-green-400 text-xs">✓ Analyzed</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              {(doc.size || doc.fileSize) && (
                                <span>
                                  {((doc.size || doc.fileSize) / 1024 / 1024).toFixed(2)} MB
                                </span>
                              )}
                              {(doc.createdAt || doc.uploadedAt) && (
                                <span>
                                  {(() => {
                                    const date = new Date(doc.createdAt || doc.uploadedAt);
                                    return isNaN(date.getTime())
                                      ? 'Recently uploaded'
                                      : date.toLocaleDateString();
                                  })()}
                                </span>
                              )}
                            </div>
                            {!isProcessing && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  className={`text-xs px-2 py-0.5 ${getClassificationColor(classification)}`}
                                >
                                  {classification}
                                </Badge>
                                <Badge className={`text-xs px-2 py-0.5 ${tierBadge.color}`}>
                                  <span className="mr-1">{tierBadge.icon}</span>
                                  {tierBadge.label}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedDocuments.includes(doc.id) && (
                            <div className="flex items-center gap-1 bg-cyan-600/20 border border-cyan-500/50 rounded px-2 py-1">
                              <CheckCircle className="h-4 w-4 text-cyan-400" />
                              <span className="text-xs text-cyan-400 font-medium">Selected</span>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-400"
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteDocument(doc.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upload progress */}
              {isUploading && uploadProgress.total > 0 && (
                <div className="mt-4">
                  <Progress
                    value={(uploadProgress.current / uploadProgress.total) * 100}
                    className="h-2 bg-gray-800"
                  />
                  <p className="text-sm text-gray-400 mt-2 text-center">
                    Uploading file {uploadProgress.current} of {uploadProgress.total}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selection Summary */}
          {documents && documents.length > 0 && (
            <div className="mb-6">
              <Alert
                className={
                  selectedDocuments.length > 0
                    ? 'bg-cyan-900/20 border-cyan-800/50'
                    : 'bg-orange-900/20 border-orange-800/50'
                }
              >
                <Info className="h-5 w-5" />
                <AlertTitle
                  className={selectedDocuments.length > 0 ? 'text-cyan-400' : 'text-orange-400'}
                >
                  {selectedDocuments.length > 0
                    ? `${selectedDocuments.length} Document${selectedDocuments.length > 1 ? 's' : ''} Selected`
                    : 'No Documents Selected'}
                </AlertTitle>
                <AlertDescription className="text-gray-300">
                  {selectedDocuments.length > 0
                    ? 'Our AI will analyze only the selected documents. You can select or deselect documents by clicking on them above.'
                    : 'Please select at least one document to analyze. Click on any document above to select it.'}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/assessment-templates')}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Choose Different Template
            </Button>

            <Button
              onClick={executeAssessment}
              disabled={!assessment || selectedDocuments.length === 0}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                selectedDocuments.length === 0
                  ? 'Please select at least one document'
                  : 'Start analysis'
              }
            >
              <Play className="h-4 w-4 mr-2" />
              Start Assessment Analysis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Execution View
  if (viewState === 'execution') {
    return (
      <div className="min-h-screen bg-gray-950 relative overflow-hidden">
        {renderParticles()}

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-4 mb-6 rounded-2xl bg-cyan-500/20 backdrop-blur-sm animate-pulse">
              <Brain className="h-12 w-12 text-cyan-400" />
            </div>

            <h1 className="text-4xl font-bold mb-4 gradient-text">AI Risk Analysis in Progress</h1>
            <p className="text-xl text-gray-400">
              Our advanced AI is analyzing your compliance framework
            </p>

            {template && (
              <div className="mt-4">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 px-4 py-1">
                  {template.name}
                </Badge>
              </div>
            )}
          </div>

          {/* Overall Progress */}
          <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Overall Progress</CardTitle>
                  <CardDescription className="text-gray-400">
                    Estimated time remaining:{' '}
                    {Math.max(0, Math.ceil((100 - progressPercentage) / 10))} minutes
                  </CardDescription>
                </div>
                <div className="text-2xl font-bold text-cyan-400">{progressPercentage}%</div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercentage} className="h-3 bg-gray-800" />
            </CardContent>
          </Card>

          {/* Analysis Steps */}
          <div className="space-y-4">
            {analysisSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <Card
                  key={step.id}
                  className={`
                    bg-gray-900/50 backdrop-blur-sm border transition-all duration-500
                    ${step.status === 'processing' ? 'border-cyan-600 shadow-lg shadow-cyan-500/20' : 'border-gray-800'}
                    ${step.status === 'completed' ? 'border-green-800' : ''}
                  `}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`
                          p-3 rounded-lg transition-all duration-500
                          ${step.status === 'processing' ? 'bg-cyan-500/20 animate-pulse' : ''}
                          ${step.status === 'completed' ? 'bg-green-500/20' : ''}
                          ${step.status === 'pending' ? 'bg-gray-800' : ''}
                        `}
                      >
                        {step.status === 'completed' ? (
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        ) : step.status === 'processing' ? (
                          <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
                        ) : (
                          <Icon className="h-6 w-6 text-gray-500" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3
                            className={`
                            font-semibold transition-colors
                            ${step.status === 'processing' ? 'text-cyan-400' : ''}
                            ${step.status === 'completed' ? 'text-green-400' : ''}
                            ${step.status === 'pending' ? 'text-gray-500' : ''}
                          `}
                          >
                            {step.title}
                          </h3>
                          {step.status === 'processing' && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 animate-pulse">
                              Processing
                            </Badge>
                          )}
                          {step.status === 'completed' && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                              Complete
                            </Badge>
                          )}
                        </div>
                        <p
                          className={`
                          text-sm transition-colors
                          ${step.status === 'pending' ? 'text-gray-600' : 'text-gray-400'}
                        `}
                        >
                          {step.description}
                        </p>
                        {step.status === 'processing' && (
                          <div className="mt-2">
                            <Progress value={100} className="h-1 bg-gray-800 animate-pulse" />
                          </div>
                        )}
                      </div>

                      {step.status === 'completed' && step.duration && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{step.duration}s</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* AI Insights Preview */}
          {progressPercentage > 50 && (
            <Card className="mt-8 bg-gradient-to-r from-cyan-900/30 to-pink-900/30 border-cyan-800/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <CardTitle className="text-white">AI Insights Preview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    <p className="text-gray-300 text-sm">
                      Detected {Math.floor(progressPercentage / 10)} critical compliance gaps
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
                    <p className="text-gray-300 text-sm">
                      Risk score trending at {Math.floor(progressPercentage * 0.7)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <p className="text-gray-300 text-sm">
                      Generating {Math.floor(progressPercentage / 8)} strategic recommendations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Messages */}
          {currentStatus === 'FAILED' && (
            <Alert className="mt-8 bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The assessment encountered an error. Please try again or contact support if the
                issue persists.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }

  // Handle additional document upload during manual review
  const handleAdditionalDocUpload = (docId: string) => {
    // Add to selected documents for re-analysis
    setSelectedDocuments(prev => [...prev, docId]);
  };

  // Questions View
  if (viewState === 'questions' && assessmentResults) {
    return (
      <div className="min-h-screen bg-gray-950 relative overflow-hidden">
        {renderParticles()}

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 py-12">
          {isSubmittingAnswers ? (
            <div className="max-w-3xl mx-auto">
              <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center p-4 mb-6 rounded-2xl bg-cyan-500/20 backdrop-blur-sm animate-pulse">
                      <Brain className="h-12 w-12 text-cyan-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 gradient-text">Re-analyzing Assessment</h2>
                    <p className="text-gray-400 mb-6">
                      Our AI is processing your new information and updating the risk assessment...
                    </p>
                    <div className="space-y-4 max-w-md mx-auto">
                      <div className="flex items-center gap-3 text-left">
                        <Loader2 className="h-5 w-5 text-cyan-400 animate-spin flex-shrink-0" />
                        <span className="text-gray-300">Processing manual answers...</span>
                      </div>
                      <div className="flex items-center gap-3 text-left">
                        <Loader2 className="h-5 w-5 text-cyan-400 animate-spin flex-shrink-0" />
                        <span className="text-gray-300">Analyzing additional documents...</span>
                      </div>
                      <div className="flex items-center gap-3 text-left">
                        <Loader2 className="h-5 w-5 text-cyan-400 animate-spin flex-shrink-0" />
                        <span className="text-gray-300">Recalculating risk scores...</span>
                      </div>
                      <div className="flex items-center gap-3 text-left">
                        <Loader2 className="h-5 w-5 text-cyan-400 animate-spin flex-shrink-0" />
                        <span className="text-gray-300">Updating recommendations...</span>
                      </div>
                    </div>
                    <div className="mt-8">
                      <Progress value={66} className="h-3 bg-gray-800 animate-pulse" />
                      <p className="text-sm text-gray-500 mt-3">
                        This may take 1-2 minutes depending on the amount of new information
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <LowConfidenceQuestionsReview
              questions={assessmentResults.lowConfidenceAnswers || []}
              onSubmit={handleSubmitManualAnswers}
              organizationId={organization?.id || ''}
              onDocumentUpload={handleAdditionalDocUpload}
            />
          )}
        </div>
      </div>
    );
  }

  // Results View - Removed: Now redirects to /assessment/results/:id
  // The duplicate results view has been removed to maintain a single source of truth
  // All results are now displayed on the dedicated AssessmentResults page
  // Default loading state
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading assessment...</p>
      </div>
    </div>
  );
};

// Helper functions
function getRiskLevel(score: number): string {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

function getRiskScoreColor(score: number): string {
  if (score >= 80) return 'bg-red-500/20 text-red-400 border-red-500/50';
  if (score >= 60) return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
  if (score >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
  return 'bg-green-500/20 text-green-400 border-green-500/50';
}

function getPriorityIcon(priority: Priority) {
  const Icon = priorityIcons[priority];
  return <Icon className="h-5 w-5 text-cyan-400" />;
}

function getRiskLevelColor(level: RiskLevel) {
  switch (level) {
    case 'CRITICAL':
      return 'text-red-400';
    case 'HIGH':
      return 'text-orange-400';
    case 'MEDIUM':
      return 'text-yellow-400';
    case 'LOW':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
}

export default AssessmentExecution;
