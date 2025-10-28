import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Calendar,
  Building,
  DollarSign,
  Clock,
  FileText,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Paperclip,
  Send,
  Plus,
  Loader2,
} from 'lucide-react';
import { useRFPs } from '@/hooks/useRFPs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

// Backend RFP interface (from API)
interface RFP {
  id: string;
  title: string;
  userId: string;
  organizationId: string;
  objectives?: string;
  requirements?: string;
  timeline?: string;
  budget?: string;
  documents?: string[];
  vendorIds: string[];
  status: 'DRAFT' | 'SENT' | 'FAILED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  leadStatus?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  organization?: { id: string; name: string };
  contacts?: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

const RfpTrackingRefactored = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRfp, setSelectedRfp] = useState<RFP | null>(null);
  const { toast } = useToast();

  // Fetch RFPs from backend
  const { data: rfps = [], isLoading, isError, error, refetch } = useRFPs();

  // Filter RFPs based on search and status
  const filteredRfps = useMemo(() => {
    let filtered = rfps;

    if (searchTerm) {
      filtered = filtered.filter(
        (rfp: RFP) =>
          rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfp.organization?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((rfp: RFP) => rfp.status === statusFilter);
    }

    return filtered;
  }, [rfps, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="secondary" className="text-gray-600 border-gray-300">
            Draft
          </Badge>
        );
      case 'SENT':
        return (
          <Badge variant="default" className="text-primary border-primary bg-primary/10">
            Sent
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive" className="text-red-600 border-red-300">
            Failed
          </Badge>
        );
      case 'ACTIVE':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            Active
          </Badge>
        );
      case 'CLOSED':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-400">
            Closed
          </Badge>
        );
      case 'ARCHIVED':
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-300">
            Archived
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="h-4 w-4 text-gray-600" />;
      case 'SENT':
        return <Send className="h-4 w-4 text-primary" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'CLOSED':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'ARCHIVED':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-primary" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const exportToCSV = () => {
    if (filteredRfps.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no RFPs matching your filters.',
        variant: 'destructive',
      });
      return;
    }

    const csvData = filteredRfps.map((rfp: RFP) => ({
      'RFP Title': rfp.title,
      Organization: rfp.organization?.name || 'N/A',
      Status: rfp.status,
      Budget: rfp.budget || 'Not specified',
      Timeline: rfp.timeline || 'Not specified',
      Vendors: rfp.vendorIds.length,
      'Created Date': formatDate(rfp.createdAt),
      'Sent Date': rfp.sentAt ? formatDate(rfp.sentAt) : 'Not sent',
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rfps-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: `Exported ${filteredRfps.length} RFPs to CSV.`,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="p-12 text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load RFPs</h3>
            <p className="text-gray-600 mb-4">
              {(error as any)?.message || 'An error occurred while fetching your RFPs.'}
            </p>
            <Button onClick={() => refetch()}>
              <Loader2 className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-card/50 to-card/80 backdrop-blur-sm border-cyan-500/20">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">RFP Management</h2>
              <p className="text-gray-200">
                Manage and track your {rfps.length} Request for Proposal{rfps.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={exportToCSV} variant="outline" disabled={filteredRfps.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create RFP
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by RFP title or organization..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RFP List */}
      {filteredRfps.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {rfps.length === 0 ? 'No RFPs Created Yet' : 'No RFPs Match Your Filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {rfps.length === 0
                ? 'Create your first RFP to send to vendors and track proposals.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {rfps.length === 0 && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First RFP
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRfps.map((rfp: RFP) => (
            <Card key={rfp.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Building className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{rfp.title}</h3>
                        <p className="text-sm text-gray-600">{rfp.organization?.name || 'Organization'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{rfp.budget || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{rfp.timeline || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{formatDate(rfp.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {rfp.vendorIds.length} vendor{rfp.vendorIds.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(rfp.status)}
                      {getStatusBadge(rfp.status)}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedRfp(rfp)}>
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                      {rfp.status === 'DRAFT' && (
                        <Button size="sm">
                          <Send className="mr-1 h-4 w-4" />
                          Send
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* RFP Detail Modal */}
      {selectedRfp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-6 w-6 text-primary" />
                    <span>{selectedRfp.title}</span>
                  </CardTitle>
                  <CardDescription>
                    Created on {formatDate(selectedRfp.createdAt)}
                    {selectedRfp.sentAt && ` • Sent on ${formatDate(selectedRfp.sentAt)}`}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRfp(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                {getStatusIcon(selectedRfp.status)}
                {getStatusBadge(selectedRfp.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Budget Range</h4>
                  <p className="text-gray-600">{selectedRfp.budget || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Timeline</h4>
                  <p className="text-gray-600">{selectedRfp.timeline || 'Not specified'}</p>
                </div>
              </div>

              {selectedRfp.objectives && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Objectives</h4>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedRfp.objectives}
                  </p>
                </div>
              )}

              {selectedRfp.requirements && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedRfp.requirements}
                  </p>
                </div>
              )}

              {selectedRfp.documents && selectedRfp.documents.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Attached Documents</h4>
                  <div className="space-y-1">
                    {selectedRfp.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                      >
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700 flex-1">{doc.split('/').pop()}</span>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Vendors ({selectedRfp.vendorIds.length})</h4>
                <p className="text-sm text-gray-600">
                  RFP sent to {selectedRfp.vendorIds.length} vendor{selectedRfp.vendorIds.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                {selectedRfp.status === 'DRAFT' && (
                  <Button className="flex-1">
                    <Send className="mr-2 h-4 w-4" />
                    Send RFP
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedRfp(null)} className="flex-1">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RfpTrackingRefactored;
