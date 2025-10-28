import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  File,
  Image,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { documentApi, queryKeys, createMutations } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DocumentStorageProps {
  organizationId: string | null;
  className?: string;
  selectionMode?: boolean;
  selectedDocuments?: string[];
  onSelectionChange?: (documentIds: string[]) => void;
  maxSelection?: number;
}

interface DocumentData {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  documentType: string;
  analysisStatus?: string;
  mimeType?: string;
  evidenceTier?: 'TIER_0' | 'TIER_1' | 'TIER_2';
  tierClassificationReason?: string;
  tierConfidenceScore?: number;
}

const DocumentStorage: React.FC<DocumentStorageProps> = ({
  organizationId,
  className,
  selectionMode = false,
  selectedDocuments = [],
  onSelectionChange,
  maxSelection = 5
}) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentData | null>(null);
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());

  // Fetch documents using React Query
  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: organizationId
      ? queryKeys.organizationDocuments(organizationId)
      : ['documents', null],
    queryFn: () =>
      organizationId
        ? documentApi.getOrganizationDocuments(organizationId)
        : Promise.resolve({ data: [] }),
    enabled: !!organizationId,
    staleTime: 30000, // Keep data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: apiData => {
      // Auto-refresh every 2 seconds if any document doesn't have a tier yet
      // Handle paginated response: { data: [...], total, page, limit, totalPages }
      const docs = apiData?.data || [];
      const hasProcessingDocs = docs.some((doc: DocumentData) => !doc.evidenceTier);
      return hasProcessingDocs ? 2000 : false;
    },
  });

  // Extract documents array from paginated response
  const documents = apiResponse?.data || [];

  // Handle document selection toggle
  const toggleDocumentSelection = (documentId: string) => {
    if (!onSelectionChange) return;

    const isSelected = selectedDocuments.includes(documentId);
    let newSelection: string[];

    if (isSelected) {
      newSelection = selectedDocuments.filter(id => id !== documentId);
    } else {
      if (selectedDocuments.length >= maxSelection) {
        toast({
          title: 'Selection limit reached',
          description: `You can select up to ${maxSelection} documents`,
          variant: 'destructive',
        });
        return;
      }
      newSelection = [...selectedDocuments, documentId];
    }

    onSelectionChange(newSelection);
  };

  // Delete document mutation with optimistic updates
  const deleteDocumentMutation = useMutation({
    mutationFn: documentApi.deleteDocument,

    // Optimistic update: Remove document from cache immediately
    onMutate: async (documentId: string) => {
      if (!organizationId) return;

      const queryKey = queryKeys.organizationDocuments(organizationId);

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value (paginated response structure)
      const previousData = queryClient.getQueryData<{
        data: DocumentData[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>(queryKey);

      // Optimistically update to remove the document from the paginated response
      queryClient.setQueryData<{
        data: DocumentData[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>(queryKey, old => {
        if (!old) return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        return {
          ...old,
          data: old.data.filter(doc => doc.id !== documentId),
          pagination: {
            ...old.pagination,
            total: old.pagination.total - 1,
          },
        };
      });

      // Close dialog immediately
      setDocumentToDelete(null);

      // Return a context object with the snapshotted value
      return { previousData, queryKey };
    },

    onSuccess: () => {
      // Show success toast
      toast({
        title: 'Document Deleted',
        description: 'Document has been successfully removed.',
      });
    },

    onError: (error: any, documentId: string, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }

      // Handle specific error cases
      const errorMessage = error.message || 'Failed to delete document. Please try again.';

      // Don't show error for 404 - document was already deleted
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        toast({
          title: 'Document Already Deleted',
          description: 'This document was already removed.',
        });
      } else {
        toast({
          title: 'Delete Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },

    onSettled: () => {
      // Always refetch after error or success to ensure cache is in sync with server
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.organizationDocuments(organizationId),
        });
      }
    },
  });

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      deleteDocumentMutation.mutate(documentToDelete.id);
    }
  };

  // File upload handler
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !organizationId) return;

    setIsUploading(true);

    const uploadPromises = [];
    const fileArray = Array.from(files);

    // Process all files in parallel
    for (const file of fileArray) {
      uploadPromises.push(uploadSingleFile(file));
    }

    try {
      const results = await Promise.allSettled(uploadPromises);

      // Count successes and failures
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      // Invalidate and refetch documents
      await queryClient.invalidateQueries({
        queryKey: queryKeys.organizationDocuments(organizationId),
      });

      // Show appropriate toast message
      if (succeeded > 0 && failed === 0) {
        toast({
          title: 'Upload Complete',
          description: `Successfully uploaded ${succeeded} document${succeeded !== 1 ? 's' : ''}. Processing tier classification...`,
        });
      } else if (succeeded > 0 && failed > 0) {
        toast({
          title: 'Partial Upload Success',
          description: `Uploaded ${succeeded} document${succeeded !== 1 ? 's' : ''}, ${failed} failed.`,
          variant: 'default',
        });
      } else if (failed > 0 && succeeded === 0) {
        toast({
          title: 'Upload Failed',
          description: `Failed to upload ${failed} document${failed !== 1 ? 's' : ''}.`,
          variant: 'destructive',
        });
      }

      // Refresh documents after a delay to catch the tier classification
      setTimeout(async () => {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.organizationDocuments(organizationId),
        });
      }, 3000);
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to upload a single file
  const uploadSingleFile = async (file: File): Promise<void> => {
    try {
      // Correct CSV MIME type if needed
      let mimeType = file.type;
      if (
        file.name.toLowerCase().endsWith('.csv') &&
        (!file.type || file.type === 'application/octet-stream')
      ) {
        mimeType = 'text/csv';
      }

      // Step 1: Get presigned upload URL
      const uploadUrlData = await documentApi.getUploadUrl({
        organizationId: organizationId!,
        filename: file.name,
        mimeType: mimeType,
        size: file.size,
        documentType: getDocumentType(mimeType),
      });

      const { document: docData, uploadUrl } = uploadUrlData;

      // Step 2: Upload file to object storage using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': mimeType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload ${file.name}: ${uploadResponse.status}`);
      }

      // Step 3: Confirm upload and trigger analysis
      await documentApi.confirmUpload(docData.id);
    } catch (error: any) {
      console.error(`Error uploading ${file.name}:`, error);
      throw error;
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [organizationId]
  );

  // Document type classification based on filename and content
  const getDocumentClassification = (document: DocumentData): string => {
    const filename = document.filename.toLowerCase();

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

    // Default classification
    return 'Document';
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
  const getDocumentTier = (document: DocumentData): 'TIER_0' | 'TIER_1' | 'TIER_2' | undefined => {
    // Use the AI-determined tier from backend
    // The tier is classified using GPT-4 when available, or rule-based fallback
    return document.evidenceTier;
  };

  // Utility functions
  const getDocumentType = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return 'POLICY';
    if (mimeType.includes('image')) return 'CERTIFICATE';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'REPORT';
    return 'POLICY';
  };

  const getFileIcon = (filename: string, mimeType?: string) => {
    if (mimeType?.includes('image')) return <Image className="h-4 w-4 text-gray-400" />;
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
      return <FileSpreadsheet className="h-4 w-4 text-gray-400" />;
    if (filename.endsWith('.pdf')) return <FileText className="h-4 w-4 text-gray-400" />;
    return <File className="h-4 w-4 text-gray-400" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  // If no organization ID, show message
  if (!organizationId) {
    return (
      <Card
        className={cn(
          'bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-500',
          className
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Upload className="h-5 w-5 text-blue-400" />
            </div>
            Document Storage
          </CardTitle>
          <CardDescription className="text-gray-400">
            Upload and manage your organization documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg bg-gray-800/30">
            <p className="text-sm text-gray-500">
              Please save your business profile first to upload documents
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-500',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Upload className="h-5 w-5 text-blue-400" />
          </div>
          Document Storage
        </CardTitle>
        <CardDescription className="text-gray-400">
          Upload and manage your organization documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200',
            isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-blue-300'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploading) {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png';
              input.multiple = true; // Enable multiple file selection
              input.onchange = e => handleFileUpload((e.target as HTMLInputElement).files);
              input.click();
            }
          }}
          data-testid="document-upload-area"
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Uploading documents...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, Word, Excel, CSV, Images (max 10MB) - Multiple files supported
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Uploaded Documents</h3>
            {documents.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">Failed to load documents. Please try again.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-auto"
                data-testid="button-retry-documents"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Documents */}
          {!isLoading && !error && documents.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No documents uploaded yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Upload your first document to get started
              </p>
            </div>
          )}

          {!isLoading && !error && documents.length > 0 && (
            <div className="space-y-2" data-testid="documents-list">
              {documents.map((document: DocumentData) => {
                const classification = getDocumentClassification(document);
                const tier = getDocumentTier(document);
                const tierBadge = getEvidenceTierBadge(tier);
                return (
                  <div
                    key={document.id}
                    className={cn(
                      "flex items-center justify-between p-3 border border-gray-700 rounded-lg hover:bg-gray-800/50 hover:border-cyan-600/50 transition-all duration-200",
                      selectionMode && selectedDocuments.includes(document.id) && "bg-cyan-900/20 border-cyan-600"
                    )}
                    data-testid={`document-${document.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {selectionMode && (
                        <Checkbox
                          checked={selectedDocuments.includes(document.id)}
                          onCheckedChange={() => toggleDocumentSelection(document.id)}
                          className="flex-shrink-0"
                        />
                      )}
                      <div className="flex-shrink-0 p-1.5 bg-gray-800 rounded-md">
                        {getFileIcon(document.filename, document.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-100 truncate">
                            {document.filename}
                          </p>
                          {getStatusIcon(document.analysisStatus)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{formatFileSize(document.size)}</span>
                          <span>•</span>
                          <span>{formatDate(document.createdAt)}</span>
                        </div>
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
                      </div>
                    </div>
                    {!selectionMode && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setDocumentToDelete(document)}
                          disabled={deleteDocumentMutation.isPending || isUploading}
                          data-testid={`button-delete-${document.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
          <AlertDialogContent data-testid="delete-confirmation-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{documentToDelete?.filename}"? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteDocumentMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete"
              >
                {deleteDocumentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default DocumentStorage;
