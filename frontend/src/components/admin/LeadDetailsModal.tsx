import { useState } from 'react';
import { X, User, Building, Calendar, Mail, MessageCircle, FileText, Package, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useLead } from '@/hooks/useLeads';
import { useUpdateLeadStatus } from '@/hooks/useUpdateLeadStatus';
import { LeadStatus } from '@/hooks/useLeads';

interface LeadDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadType: 'PREMIUM' | 'BASIC';
}

const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'NEW', label: 'New', color: 'bg-blue-500' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'bg-purple-500' },
  { value: 'CONVERTED', label: 'Converted', color: 'bg-green-500' },
  { value: 'LOST', label: 'Lost', color: 'bg-red-500' },
];

const CONTACT_TYPE_LABELS: Record<string, string> = {
  DEMO_REQUEST: 'Demo Request',
  INFO_REQUEST: 'Information Request',
  RFP: 'RFP Submission',
  PRICING: 'Pricing Inquiry',
  GENERAL: 'General Inquiry',
};

export function LeadDetailsModal({ open, onOpenChange, leadId, leadType }: LeadDetailsModalProps) {
  const { data: lead, isLoading, isError } = useLead(leadId, leadType, open);
  const updateStatusMutation = useUpdateLeadStatus();
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null);

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !lead) return;

    try {
      await updateStatusMutation.mutateAsync({
        leadId,
        leadType,
        status: selectedStatus,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
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

  const getStatusBadge = (status: string) => {
    const statusInfo = LEAD_STATUSES.find(s => s.value === status);
    if (!statusInfo) return null;

    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === 'PREMIUM') {
      return <Badge className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white">Premium RFP</Badge>;
    }
    return <Badge variant="outline" className="border-gray-500 text-gray-300">Basic Contact</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead Details</DialogTitle>
          <DialogDescription>
            View and manage lead information
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {isError && (
          <div className="text-center py-8">
            <p className="text-red-400">Failed to load lead details</p>
          </div>
        )}

        {lead && !isLoading && !isError && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getTypeBadge(lead.type)}
                {getStatusBadge(lead.status)}
              </div>
              <div className="text-sm text-gray-400">
                ID: {lead.id.slice(0, 8)}...
              </div>
            </div>

            <Separator />

            {/* Organization & User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Building className="h-4 w-4 text-cyan-400" />
                  Organization
                </div>
                <p className="text-white pl-6">{lead.companyName || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <User className="h-4 w-4 text-cyan-400" />
                  User
                </div>
                <p className="text-white pl-6">{lead.userName || 'N/A'}</p>
              </div>
            </div>

            <Separator />

            {/* Vendor Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Package className="h-4 w-4 text-cyan-400" />
                Vendor
              </div>
              <p className="text-white pl-6">{lead.vendors?.[0]?.name || 'Unknown Vendor'}</p>
            </div>

            <Separator />

            {/* Lead Type Specific Info */}
            {lead.type === 'PREMIUM' && lead.rfpTitle && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <FileText className="h-4 w-4 text-cyan-400" />
                    RFP Title
                  </div>
                  <p className="text-white pl-6">{lead.rfpTitle}</p>
                </div>
                <Separator />
              </>
            )}

            {lead.type === 'BASIC' && (
              <>
                {lead.contactType && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <MessageCircle className="h-4 w-4 text-cyan-400" />
                        Contact Type
                      </div>
                      <p className="text-white pl-6">
                        {CONTACT_TYPE_LABELS[lead.contactType] || lead.contactType}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {lead.message && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Mail className="h-4 w-4 text-cyan-400" />
                        Message
                      </div>
                      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mt-2">
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{lead.message}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
              </>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  Submission Date
                </div>
                <p className="text-white pl-6 text-sm">{formatDate(lead.submissionDate)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  Email
                </div>
                <p className="text-white pl-6 text-sm">{lead.userEmail || 'N/A'}</p>
              </div>
            </div>

            <Separator />

            {/* Status Update */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                Update Status
              </div>
              <Select
                value={selectedStatus || lead.status}
                onValueChange={(value) => setSelectedStatus(value as LeadStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
            disabled={updateStatusMutation.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button
            onClick={handleStatusUpdate}
            disabled={!selectedStatus || selectedStatus === lead?.status || updateStatusMutation.isPending}
            className="flex-1"
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
