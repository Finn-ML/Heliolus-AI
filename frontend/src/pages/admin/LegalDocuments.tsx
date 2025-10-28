import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { legalDocumentsApi, LegalDocument } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Trash, CheckCircle, Loader2, Clock } from 'lucide-react';

export default function LegalDocuments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'PRIVACY_POLICY' | 'TERMS_OF_SERVICE'>('PRIVACY_POLICY');
  const [version, setVersion] = useState('1.0');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch privacy policy documents
  const { data: privacyPolicies, isLoading: loadingPrivacy } = useQuery({
    queryKey: ['legal-documents', 'PRIVACY_POLICY'],
    queryFn: async () => {
      const response = await legalDocumentsApi.list('PRIVACY_POLICY');
      return response.data || [];
    },
  });

  // Fetch terms of service documents
  const { data: termsOfService, isLoading: loadingTerms } = useQuery({
    queryKey: ['legal-documents', 'TERMS_OF_SERVICE'],
    queryFn: async () => {
      const response = await legalDocumentsApi.list('TERMS_OF_SERVICE');
      return response.data || [];
    },
  });

  // Upload mutation
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a PDF file',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: 'Error',
        description: 'Only PDF files are allowed',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Get presigned URL
      const uploadResponse = await legalDocumentsApi.upload({
        type: uploadType,
        filename: selectedFile.name,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
        version,
      });

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || 'Failed to get upload URL');
      }

      // Step 2: Upload to S3
      await legalDocumentsApi.uploadToS3(
        uploadResponse.data.uploadUrl,
        uploadResponse.data.fields,
        selectedFile
      );

      toast({
        title: 'Success',
        description: `${uploadType === 'PRIVACY_POLICY' ? 'Privacy Policy' : 'Terms of Service'} uploaded successfully`,
      });

      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['legal-documents', uploadType] });

      // Reset form
      setSelectedFile(null);
      setVersion('1.0');
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => legalDocumentsApi.delete(documentId),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete document',
        variant: 'destructive',
      });
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: (documentId: string) => legalDocumentsApi.activate(documentId),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Document version activated',
      });
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to activate document',
        variant: 'destructive',
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDocumentTable = (documents: LegalDocument[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!documents || documents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No documents uploaded yet</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Filename</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">{doc.filename}</TableCell>
              <TableCell>{doc.version}</TableCell>
              <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
              <TableCell>
                {doc.isActive ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell>{formatDate(doc.createdAt)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {!doc.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => activateMutation.mutate(doc.id)}
                      disabled={activateMutation.isPending}
                    >
                      Activate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setDocumentToDelete(doc.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Legal Documents</h1>
            <p className="text-muted-foreground mt-2">
              Manage Privacy Policy and Terms of Service PDFs
            </p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        <Tabs defaultValue="privacy" className="space-y-4">
          <TabsList>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
          </TabsList>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Policy Documents</CardTitle>
                <CardDescription>
                  Manage different versions of your Privacy Policy. Only one version can be active at a time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderDocumentTable(privacyPolicies, loadingPrivacy)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle>Terms of Service Documents</CardTitle>
                <CardDescription>
                  Manage different versions of your Terms of Service. Only one version can be active at a time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderDocumentTable(termsOfService, loadingTerms)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Legal Document</DialogTitle>
            <DialogDescription>
              Upload a new PDF for Privacy Policy or Terms of Service. The new version will automatically become active.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as 'PRIVACY_POLICY' | 'TERMS_OF_SERVICE')}
              >
                <option value="PRIVACY_POLICY">Privacy Policy</option>
                <option value="TERMS_OF_SERVICE">Terms of Service</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">PDF File</Label>
              <Input
                id="file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this legal document. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => documentToDelete && deleteMutation.mutate(documentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
