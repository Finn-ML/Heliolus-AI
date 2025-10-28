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
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Paperclip,
  Loader2,
} from 'lucide-react';
import { useRFPs } from '@/hooks/useRFPs';

interface RfpVendor {
  id: string;
  companyName: string;
  logo: string | null;
  primaryProduct: string | null;
}

interface SentRfp {
  id: string;
  title: string;
  objectives: string;
  requirements: string;
  timeline: string | null;
  budget: string | null;
  status: string;
  leadStatus: string | null;
  vendorIds: string[];
  vendors: RfpVendor[];
  documents: string[];
  createdAt: string;
  sentAt: string | null;
}

const RfpTracking = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRfp, setSelectedRfp] = useState<any | null>(null);

  // Fetch RFPs from API
  const { data: rfpsData, isLoading, error } = useRFPs();
  const sentRfps = rfpsData || [];

  // Filter RFPs based on search and status (memoized to prevent infinite loops)
  const filteredRfps = useMemo(() => {
    let filtered = sentRfps;

    if (searchTerm) {
      filtered = filtered.filter(
        rfp =>
          rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfp.vendors.some(v => v.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(rfp => rfp.status === statusFilter);
    }

    return filtered;
  }, [searchTerm, statusFilter, sentRfps]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            Draft
          </Badge>
        );
      case 'SENT':
        return (
          <Badge variant="secondary" className="text-primary border-primary">
            Sent
          </Badge>
        );
      case 'IN_REVIEW':
        return (
          <Badge variant="outline" className="text-secondary border-secondary">
            In Review
          </Badge>
        );
      case 'PROPOSAL_RECEIVED':
        return (
          <Badge variant="default" className="text-primary border-primary bg-primary/10">
            Proposal Received
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge variant="default" className="text-primary bg-primary/20">
            Accepted
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="text-red-600 border-red-300">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'SENT':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'IN_REVIEW':
        return <AlertCircle className="h-4 w-4 text-secondary" />;
      case 'PROPOSAL_RECEIVED':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
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
    const csvData = filteredRfps.map(rfp => ({
      'Project Name': rfp.title,
      Vendors: rfp.vendors.map(v => v.companyName).join('; '),
      Budget: rfp.budget || 'N/A',
      Timeline: rfp.timeline || 'N/A',
      Status: rfp.status,
      'Created Date': formatDate(rfp.createdAt),
      'Sent Date': rfp.sentAt ? formatDate(rfp.sentAt) : 'Not sent',
      'Attached Files': rfp.documents.length,
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rfp-tracking.csv';
    link.click();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your RFPs...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load RFPs</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </div>
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
              <h2 className="text-2xl font-bold text-foreground mb-2">RFP Tracking Dashboard</h2>
              <p className="text-muted-foreground">
                Monitor the status of your {sentRfps.length} RFPs
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={exportToCSV} variant="outline" disabled={filteredRfps.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
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
                  placeholder="Search by project name or vendor..."
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
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="PROPOSAL_RECEIVED">Proposal Received</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
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
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {sentRfps.length === 0 ? 'No RFPs Sent Yet' : 'No RFPs Match Your Filters'}
            </h3>
            <p className="text-muted-foreground">
              {sentRfps.length === 0
                ? 'Start by comparing vendors and sending your first RFP.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRfps.map(rfp => (
            <Card key={rfp.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{rfp.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        {rfp.vendors.map((vendor) => (
                          <div key={vendor.id} className="flex items-center space-x-2 bg-muted px-3 py-1 rounded-full">
                            {vendor.logo && (
                              <img src={vendor.logo} alt={vendor.companyName} className="w-4 h-4 rounded" />
                            )}
                            <span className="text-sm text-foreground">{vendor.companyName}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{rfp.budget || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{rfp.timeline || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{formatDate(rfp.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {rfp.documents.length} file{rfp.documents.length !== 1 ? 's' : ''}
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
                      {rfp.status === 'SENT' && (
                        <Button size="sm">
                          <MessageSquare className="mr-1 h-4 w-4" />
                          Track
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
          <Card className="bg-card rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedRfp.title}</CardTitle>
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

              <div>
                <h4 className="font-medium text-foreground mb-2">Vendors</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRfp.vendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-center space-x-2 bg-muted px-3 py-2 rounded">
                      {vendor.logo && (
                        <img src={vendor.logo} alt={vendor.companyName} className="w-6 h-6 rounded" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{vendor.companyName}</p>
                        {vendor.primaryProduct && (
                          <p className="text-xs text-muted-foreground">{vendor.primaryProduct}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Budget Range</h4>
                  <p className="text-muted-foreground">{selectedRfp.budget || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Timeline</h4>
                  <p className="text-muted-foreground">{selectedRfp.timeline || 'Not specified'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">Objectives</h4>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{selectedRfp.objectives}</p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">Requirements</h4>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{selectedRfp.requirements}</p>
              </div>

              {selectedRfp.documents.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Attached Documents</h4>
                  <div className="space-y-1">
                    {selectedRfp.documents.map((docId, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-2 bg-muted rounded"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Document {index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                {selectedRfp.status === 'DRAFT' && (
                  <Button className="flex-1">
                    Send to Vendors
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

export default RfpTracking;
