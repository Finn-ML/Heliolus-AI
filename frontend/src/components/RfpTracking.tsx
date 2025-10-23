import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface SentRfp {
  id: string;
  vendor: {
    name: string;
    logo: string;
  };
  projectName: string;
  budget: string;
  timeline: string;
  requirements: string;
  additionalInfo: string;
  attachedFiles: string[];
  submittedAt: string;
  status: 'Sent' | 'Under Review' | 'Proposal Received' | 'Rejected' | 'Accepted';
}

const RfpTracking = () => {
  const [sentRfps, setSentRfps] = useState<SentRfp[]>([]);
  const [filteredRfps, setFilteredRfps] = useState<SentRfp[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRfp, setSelectedRfp] = useState<SentRfp | null>(null);

  // Load RFPs from localStorage on component mount
  useEffect(() => {
    const storedRfps = JSON.parse(localStorage.getItem('sentRfps') || '[]');

    // Add some sample statuses for demonstration
    const rfpsWithStatus = storedRfps.map((rfp: SentRfp, index: number) => ({
      ...rfp,
      status:
        index % 4 === 0
          ? 'Proposal Received'
          : index % 3 === 0
            ? 'Under Review'
            : index % 5 === 0
              ? 'Rejected'
              : 'Sent',
    }));

    setSentRfps(rfpsWithStatus);
    setFilteredRfps(rfpsWithStatus);
  }, []);

  // Filter RFPs based on search and status
  useEffect(() => {
    let filtered = sentRfps;

    if (searchTerm) {
      filtered = filtered.filter(
        rfp =>
          rfp.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfp.vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(rfp => rfp.status === statusFilter);
    }

    setFilteredRfps(filtered);
  }, [searchTerm, statusFilter, sentRfps]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sent':
        return (
          <Badge variant="secondary" className="text-primary border-primary">
            Sent
          </Badge>
        );
      case 'Under Review':
        return (
          <Badge variant="outline" className="text-secondary border-secondary">
            Under Review
          </Badge>
        );
      case 'Proposal Received':
        return (
          <Badge variant="default" className="text-primary border-primary bg-primary/10">
            Proposal Received
          </Badge>
        );
      case 'Accepted':
        return (
          <Badge variant="default" className="text-primary bg-primary/20">
            Accepted
          </Badge>
        );
      case 'Rejected':
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
      case 'Sent':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'Under Review':
        return <AlertCircle className="h-4 w-4 text-secondary" />;
      case 'Proposal Received':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'Accepted':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
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
    const csvData = filteredRfps.map(rfp => ({
      'Project Name': rfp.projectName,
      Vendor: rfp.vendor.name,
      Budget: rfp.budget,
      Timeline: rfp.timeline,
      Status: rfp.status,
      'Submitted Date': formatDate(rfp.submittedAt),
      'Attached Files': rfp.attachedFiles.length,
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-card/50 to-card/80 backdrop-blur-sm border-cyan-500/20">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">RFP Tracking Dashboard</h2>
              <p className="text-gray-200">
                Monitor the status of your {sentRfps.length} sent Request for Proposals
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
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Proposal Received">Proposal Received</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
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
              {sentRfps.length === 0 ? 'No RFPs Sent Yet' : 'No RFPs Match Your Filters'}
            </h3>
            <p className="text-gray-600">
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
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{rfp.vendor.logo}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{rfp.projectName}</h3>
                        <p className="text-sm text-gray-600">to {rfp.vendor.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{rfp.budget}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{rfp.timeline}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{formatDate(rfp.submittedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {rfp.attachedFiles.length} files
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
                      {rfp.status === 'Proposal Received' && (
                        <Button size="sm">
                          <MessageSquare className="mr-1 h-4 w-4" />
                          Review
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
                    <span className="text-2xl">{selectedRfp.vendor.logo}</span>
                    <span>{selectedRfp.projectName}</span>
                  </CardTitle>
                  <CardDescription>
                    RFP sent to {selectedRfp.vendor.name} on {formatDate(selectedRfp.submittedAt)}
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
                  <p className="text-gray-600">{selectedRfp.budget}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Timeline</h4>
                  <p className="text-gray-600">{selectedRfp.timeline}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{selectedRfp.requirements}</p>
              </div>

              {selectedRfp.additionalInfo && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedRfp.additionalInfo}
                  </p>
                </div>
              )}

              {selectedRfp.attachedFiles.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Attached Files</h4>
                  <div className="space-y-1">
                    {selectedRfp.attachedFiles.map((filename, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                      >
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{filename}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                {selectedRfp.status === 'Proposal Received' && (
                  <Button className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download Proposal
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
