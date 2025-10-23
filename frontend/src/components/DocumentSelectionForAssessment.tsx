import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  File,
  Image,
  FileSpreadsheet,
  X,
  Shield,
  Target,
  PlayCircle,
  FileCheck,
  Plus,
  Brain,
  ArrowRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { documentApi, queryKeys } from '@/lib/api';
import { anonymousApi } from '@/lib/anonymousApi';
import { cn } from '@/lib/utils';

interface DocumentSelectionForAssessmentProps {
  organizationId: string | null;
  className?: string;
  onAnalysisComplete?: (results: any) => void;
  onNextStep?: () => void;
  onSelectionChange?: (selected: Set<string>) => void;
  onUploadingChange?: (uploading: boolean) => void;
  hideButtons?: boolean;
  isAnonymous?: boolean;
  anonymousSessionId?: string | null;
}

interface DocumentData {
  id: string;
  filename: string;
  size: number;
  uploadedAt?: string;
  createdAt?: string;
  documentType: string;
  analysisStatus?: string;
  mimeType?: string;
}

interface SelectedDocument extends DocumentData {
  selected: boolean;
}

const DocumentSelectionForAssessment: React.FC<DocumentSelectionForAssessmentProps> = ({
  organizationId,
  className,
  onAnalysisComplete,
  onNextStep,
  onSelectionChange,
  onUploadingChange,
  hideButtons = false,
  isAnonymous = false,
  anonymousSessionId = null,
}) => {
  const queryClient = useQueryClient();
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Fetch documents using React Query - organization documents
  const {
    data: orgDocuments = [],
    isLoading: isLoadingOrg,
    error: orgError,
    refetch: refetchOrg,
  } = useQuery({
    queryKey: organizationId
      ? queryKeys.organizationDocuments(organizationId)
      : ['documents', null],
    queryFn: () =>
      organizationId ? documentApi.getOrganizationDocuments(organizationId) : Promise.resolve([]),
    enabled: !!organizationId && !isAnonymous,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  // Anonymous documents query
  const {
    data: anonDocuments,
    isLoading: isLoadingAnon,
    error: anonError,
    refetch: refetchAnon,
  } = useQuery({
    queryKey: ['anonymous-documents', anonymousSessionId],
    queryFn: () => anonymousApi.getDocuments(anonymousSessionId || undefined),
    enabled: isAnonymous && !!anonymousSessionId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  // Computed values based on mode
  const documents = isAnonymous ? anonDocuments?.documents || [] : orgDocuments;
  const isLoading = isAnonymous ? isLoadingAnon : isLoadingOrg;
  const error = isAnonymous ? anonError : orgError;
  const refetch = isAnonymous ? refetchAnon : refetchOrg;

  // Handle document selection
  const handleDocumentSelect = (documentId: string, selected: boolean) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(documentId);
      } else {
        newSet.delete(documentId);
      }
      // Call parent callback with new selection
      if (onSelectionChange) {
        onSelectionChange(newSet);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    const newSet =
      selectedDocuments.size === documents.length
        ? new Set<string>()
        : new Set<string>(documents.map((doc: DocumentData) => doc.id));
    setSelectedDocuments(newSet);
    // Call parent callback with new selection
    if (onSelectionChange) {
      onSelectionChange(newSet);
    }
  };

  // Get document type for upload - must match backend enum values
  const getDocumentType = (mimeType: string): string => {
    // Map file types to compliance document categories
    if (mimeType.includes('pdf')) return 'POLICY'; // PDFs are often policies/procedures
    if (mimeType.includes('word') || mimeType.includes('document')) return 'COMPLIANCE_CERT'; // Word docs often certifications
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'AUDIT_REPORT'; // Spreadsheets often audit data
    if (mimeType.includes('image')) return 'OTHER'; // Images are general documents
    return 'OTHER'; // Default fallback
  };

  // File upload handler
  const handleFileUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    // Check if we have the required context for either mode
    if (!isAnonymous && !organizationId) return;
    if (isAnonymous && !anonymousSessionId) return;

    setIsUploading(true);
    if (onUploadingChange) {
      onUploadingChange(true);
    }

    try {
      // Step 1: Get presigned upload URL - use appropriate API based on mode
      let uploadUrlData;
      let docData;
      let uploadUrl;

      if (isAnonymous) {
        // Anonymous mode - use anonymous API
        uploadUrlData = await anonymousApi.generateUploadUrl({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          documentType: getDocumentType(file.type) as any,
        });
        uploadUrl = uploadUrlData.presignedUrl;
        docData = { id: uploadUrlData.documentId };
      } else {
        // Authenticated mode - use organization API
        uploadUrlData = await documentApi.getUploadUrl({
          organizationId: organizationId!,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          documentType: getDocumentType(file.type),
        });
        docData = uploadUrlData.document;
        uploadUrl = uploadUrlData.uploadUrl;
      }

      // Step 2: Upload file to object storage using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(
          `Failed to upload file to storage: ${uploadResponse.status} ${uploadResponse.statusText}`
        );
      }

      // Step 3: Auto-select the new document and refresh list
      if (isAnonymous) {
        // Invalidate anonymous documents query
        queryClient.invalidateQueries({
          queryKey: ['anonymous-documents', anonymousSessionId],
        });
      } else {
        // Invalidate organization documents query
        queryClient.invalidateQueries({
          queryKey: queryKeys.organizationDocuments(organizationId),
        });
      }

      // Auto-select the uploaded document
      setSelectedDocuments(prev => new Set([...prev, docData.id]));

      // Update parent selection callback
      if (onSelectionChange) {
        onSelectionChange(new Set([...selectedDocuments, docData.id]));
      }

      toast({
        title: 'Document Uploaded',
        description: `${file.name} uploaded and selected for risk assessment.`,
      });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (onUploadingChange) {
        onUploadingChange(false);
      }
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  // Get file icon based on filename and mimetype
  const getFileIcon = (filename: string, mimeType?: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const type = mimeType?.toLowerCase() || '';

    if (type.includes('pdf') || extension === 'pdf') {
      return <FileText className="h-4 w-4 text-red-400" />;
    }
    if (
      type.includes('word') ||
      type.includes('document') ||
      ['doc', 'docx'].includes(extension || '')
    ) {
      return <FileText className="h-4 w-4 text-blue-400" />;
    }
    if (
      type.includes('spreadsheet') ||
      type.includes('excel') ||
      ['xls', 'xlsx'].includes(extension || '')
    ) {
      return <FileSpreadsheet className="h-4 w-4 text-green-400" />;
    }
    if (type.includes('image') || ['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) {
      return <Image className="h-4 w-4 text-purple-400" />;
    }

    return <File className="h-4 w-4 text-gray-400" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recent';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalSelectedSize = () => {
    return documents
      .filter((doc: DocumentData) => selectedDocuments.has(doc.id))
      .reduce((total: number, doc: DocumentData) => total + doc.size, 0);
  };

  // Check if we have the required context for document processing
  const hasRequiredContext = isAnonymous ? !!anonymousSessionId : !!organizationId;

  if (!hasRequiredContext) {
    return (
      <div
        className={cn(
          'bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg transition-all duration-500',
          className
        )}
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Shield className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Document Selection
              </h3>
              <p className="text-sm text-gray-400">Choose documents for your risk assessment</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <p className="text-gray-400">
              Create your business profile first to enable document processing
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg transition-all duration-500',
          className
        )}
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg bg-gray-800" />
            <Skeleton className="h-6 w-64 bg-gray-800" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 bg-gray-800" />
              <Skeleton className="h-4 flex-1 bg-gray-800" />
              <Skeleton className="h-4 w-16 bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          'bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg transition-all duration-500',
          className
        )}
      >
        <div className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <div>
              <p className="text-lg font-medium text-white">Failed to Load Documents</p>
              <p className="text-sm text-gray-400 mt-1">Please try refreshing the page</p>
            </div>
            <Button
              onClick={() => refetch()}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white transition-colors"
              data-testid="button-retry-documents"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if documents are selected for completion indicator
  const hasSelectedDocuments = selectedDocuments.size > 0;

  return (
    <Card
      className={cn(
        'bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg transition-all duration-500',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-400" />
          <span className="text-white">Document Selection</span>
          {hasSelectedDocuments && <CheckCircle className="h-5 w-5 text-green-400 ml-1" />}
        </CardTitle>
        <CardDescription className="text-gray-400">
          Choose documents for your risk assessment analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Documents List */}
        {documents.length > 0 && (
          <div className="space-y-4">
            {/* Select All Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedDocuments.size === documents.length && documents.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="border-gray-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  data-testid="checkbox-select-all"
                />
                <span className="text-sm font-medium text-white">
                  Select All ({documents.length} documents)
                </span>
              </div>
              <span className="text-xs text-gray-400">
                Choose documents for risk assessment analysis
              </span>
            </div>

            {/* Documents Grid */}
            <div className="grid gap-3 max-h-64 overflow-y-auto">
              {documents.map((document: DocumentData) => (
                <div
                  key={document.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
                    selectedDocuments.has(document.id)
                      ? 'bg-orange-500/10 border-orange-500/30 shadow-sm'
                      : 'bg-gray-800/30 border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                  )}
                >
                  <Checkbox
                    checked={selectedDocuments.has(document.id)}
                    onCheckedChange={checked =>
                      handleDocumentSelect(document.id, checked as boolean)
                    }
                    className="border-gray-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    data-testid={`checkbox-document-${document.id}`}
                  />

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="p-1.5 bg-gray-700 rounded-md">
                      {getFileIcon(document.filename, document.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{document.filename}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{formatFileSize(document.size)}</span>
                        <span>•</span>
                        <span>{formatDate(document.createdAt || document.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-700/50 text-gray-300 border-gray-600"
                  >
                    {document.documentType}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 transition-all duration-300',
            dragActive
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-gray-600 hover:border-orange-500/50 hover:bg-orange-500/5'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            onChange={e => handleFileUpload(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            disabled={isUploading}
            data-testid="input-file-upload"
          />

          <div className="text-center">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
                <p className="text-sm font-medium text-white">Uploading document...</p>
                <p className="text-xs text-gray-400">Please wait while we upload your file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Plus className="h-6 w-6 text-purple-400" />
                </div>
                <p className="text-sm font-medium text-white">Add New Document</p>
                <p className="text-xs text-gray-400">Drag & drop files here or click to browse</p>
                <p className="text-xs text-gray-500">Supports PDF, Word, Excel, and image files</p>
              </div>
            )}
          </div>
        </div>

        {/* Proceed Button - Only show if not hideButtons */}
        {!hideButtons && (
          <div className="flex justify-center pt-6 border-t border-gray-700">
            <Button
              onClick={() => {
                if (onNextStep) {
                  onNextStep();
                }
              }}
              className="flex items-center gap-2 px-6 py-3 text-base font-medium bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl"
              data-testid="button-proceed-document-selection"
            >
              <ArrowRight className="h-5 w-5" />
              Proceed to Next Step
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentSelectionForAssessment;
