import { useState, useMemo } from 'react';
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
  Filter,
  Download,
  Eye,
  TrendingUp,
  Users,
  Mail,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building,
  Package,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeads, useLeadAnalytics, LeadType, LeadStatus } from '@/hooks/useLeads';
import { LeadDetailsModal } from '@/components/admin/LeadDetailsModal';
import { adminLeadsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'NEW', label: 'New', color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
  { value: 'CONVERTED', label: 'Converted', color: 'bg-green-500/10 text-green-300 border-green-500/30' },
  { value: 'LOST', label: 'Lost', color: 'bg-red-500/10 text-red-300 border-red-500/30' },
];

export default function LeadsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<LeadType>('ALL');
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<{ id: string; type: 'PREMIUM' | 'BASIC' } | null>(null);

  const limit = 20;

  // Fetch leads with filters
  const { data: leadsData, isLoading, isError, refetch } = useLeads({
    type: typeFilter,
    status: statusFilter.length > 0 ? statusFilter : undefined,
    page: currentPage,
    limit,
  });

  // Fetch analytics
  const { data: analytics } = useLeadAnalytics();

  // Filter leads by search term (client-side)
  const filteredLeads = useMemo(() => {
    if (!leadsData?.leads) return [];

    if (!searchTerm) return leadsData.leads;

    const term = searchTerm.toLowerCase();
    return leadsData.leads.filter(
      (lead) =>
        lead.organizationName?.toLowerCase().includes(term) ||
        lead.userName?.toLowerCase().includes(term) ||
        lead.vendorName?.toLowerCase().includes(term) ||
        lead.rfpTitle?.toLowerCase().includes(term)
    );
  }, [leadsData?.leads, searchTerm]);

  const handleStatusToggle = (status: LeadStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setCurrentPage(1); // Reset to first page
  };

  const handleExport = async () => {
    try {
      await adminLeadsApi.exportLeads({
        type: typeFilter,
        status: statusFilter.length > 0 ? statusFilter : undefined,
      });

      toast({
        title: 'Export successful',
        description: 'Leads have been exported to CSV',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export leads',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = LEAD_STATUSES.find((s) => s.value === status);
    if (!statusInfo) return null;

    return (
      <Badge variant="outline" className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === 'PREMIUM') {
      return (
        <Badge className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white border-0">
          Premium
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-gray-500 text-gray-300">
        Basic
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-card/50 to-card/80 backdrop-blur-sm border-cyan-500/20">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Lead Management</h2>
              <p className="text-gray-200">
                Manage and track all vendor leads from RFPs and contact forms
              </p>
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total Leads</p>
                  <p className="text-2xl font-bold text-white mt-1">{analytics.totalLeads}</p>
                </div>
                <Users className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Premium RFPs</p>
                  <p className="text-2xl font-bold text-white mt-1">{analytics.premiumLeads}</p>
                </div>
                <FileText className="h-8 w-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Basic Contacts</p>
                  <p className="text-2xl font-bold text-white mt-1">{analytics.basicLeads}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Conversion Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {analytics.conversionRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search */}
            <div className="md:col-span-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="md:col-span-3">
              <Select value={typeFilter} onValueChange={(value) => {
                setTypeFilter(value as LeadType);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="PREMIUM">Premium RFPs</SelectItem>
                  <SelectItem value="BASIC">Basic Contacts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filters */}
            <div className="md:col-span-5 flex flex-wrap gap-2">
              {LEAD_STATUSES.map((status) => (
                <Button
                  key={status.value}
                  size="sm"
                  variant={statusFilter.includes(status.value) ? 'default' : 'outline'}
                  onClick={() => handleStatusToggle(status.value)}
                  className={statusFilter.includes(status.value) ? status.color.replace('/10', '') : ''}
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Card className="border-destructive">
          <CardContent className="p-12 text-center">
            <p className="text-red-400">Failed to load leads</p>
            <Button onClick={() => refetch()} className="mt-4">
              <Loader2 className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && filteredLeads.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No leads found</h3>
            <p className="text-gray-300">
              Try adjusting your search criteria or filters
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && filteredLeads.length > 0 && (
        <>
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        {getTypeBadge(lead.type)}
                        {getStatusBadge(lead.status)}
                      </div>

                      {/* Main Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-cyan-400" />
                          <div>
                            <p className="text-xs text-gray-400">Organization</p>
                            <p className="text-sm font-medium text-white">
                              {lead.organizationName || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-pink-400" />
                          <div>
                            <p className="text-xs text-gray-400">Vendor</p>
                            <p className="text-sm font-medium text-white">{lead.vendorName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <div>
                            <p className="text-xs text-gray-400">Created</p>
                            <p className="text-sm font-medium text-white">
                              {formatDate(lead.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* RFP Title or Contact Type */}
                      {lead.type === 'PREMIUM' && lead.rfpTitle && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">RFP:</span>
                          <span>{lead.rfpTitle}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLead({ id: lead.id, type: lead.type })}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {leadsData && leadsData.totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    Showing {(currentPage - 1) * limit + 1} to{' '}
                    {Math.min(currentPage * limit, leadsData.total)} of {leadsData.total} leads
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-300">
                      Page {currentPage} of {leadsData.totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === leadsData.totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(leadsData.totalPages, prev + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Lead Details Modal */}
      {selectedLead && (
        <LeadDetailsModal
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
          leadId={selectedLead.id}
          leadType={selectedLead.type}
        />
      )}
    </div>
  );
}
