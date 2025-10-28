/**
 * RFP Form Modal - Create and edit RFPs
 * Features: Auto-fill, vendor selection, document upload, validation
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useCreateRFP } from '@/hooks/useCreateRFP';
import { useStrategicRoadmap } from '@/hooks/useStrategicRoadmap';
import {
  Sparkles,
  Upload,
  X,
  FileText,
  Loader2,
  Building,
  Target,
  ClipboardList,
  Clock,
  DollarSign,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Form validation schema
const rfpFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  objectives: z.string().optional(),
  requirements: z.string().min(1, 'Requirements are required'),
  timeline: z.string().optional(),
  budget: z.string().optional(),
  vendorIds: z.array(z.string()).min(1, 'At least one vendor must be selected'),
  documents: z.array(z.string()).max(5, 'Maximum 5 documents allowed').optional(),
});

type RFPFormData = z.infer<typeof rfpFormSchema>;

interface RFPFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  preSelectedVendorIds?: string[];
}

interface Vendor {
  id: string;
  companyName: string;
  categories: string[];
  logo?: string;
}

export function RFPFormModal({
  open,
  onOpenChange,
  organizationId,
  preSelectedVendorIds = [],
}: RFPFormModalProps) {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);

  const createRfpMutation = useCreateRFP();
  const { data: roadmapData, isLoading: roadmapLoading } = useStrategicRoadmap(organizationId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<RFPFormData>({
    resolver: zodResolver(rfpFormSchema),
    defaultValues: {
      title: '',
      objectives: '',
      requirements: '',
      timeline: '',
      budget: '',
      vendorIds: preSelectedVendorIds,
      documents: [],
    },
  });

  const selectedVendorIds = watch('vendorIds') || [];

  // Fetch vendors on mount
  useEffect(() => {
    if (open) {
      fetchVendors();
    }
  }, [open]);

  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/v1/vendors?limit=100&status=APPROVED', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }

      const data = await response.json();
      setVendors(data.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Failed to load vendors',
        description: 'Could not fetch vendor list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleAutoFill = () => {
    if (!roadmapData) {
      toast({
        title: 'No strategic data available',
        description: 'Complete an assessment first to enable auto-fill.',
        variant: 'destructive',
      });
      return;
    }

    setAutoFilling(true);

    // Auto-fill from strategic roadmap
    if (roadmapData.formatted) {
      if (roadmapData.formatted.companyOverview) {
        setValue('objectives', roadmapData.formatted.companyOverview);
      }
      if (roadmapData.formatted.suggestedRequirements) {
        setValue('requirements', roadmapData.formatted.suggestedRequirements);
      }
    }

    toast({
      title: 'Auto-fill complete',
      description: 'Strategic context has been populated. Review and edit as needed.',
    });

    setTimeout(() => setAutoFilling(false), 500);
  };

  const toggleVendor = (vendorId: string) => {
    const current = selectedVendorIds;
    const updated = current.includes(vendorId)
      ? current.filter(id => id !== vendorId)
      : [...current, vendorId];
    setValue('vendorIds', updated);
  };

  const onSubmit = async (data: RFPFormData) => {
    try {
      await createRfpMutation.mutateAsync({
        organizationId,
        ...data,
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Create Request for Proposal</span>
          </DialogTitle>
          <DialogDescription>
            Create a detailed RFP to send to vendors. Use auto-fill to populate with your strategic context.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Auto-fill Button */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoFill}
              disabled={roadmapLoading || autoFilling || !roadmapData}
              className="text-primary"
            >
              {autoFilling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Auto-filling...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Auto-Fill from Strategic Roadmap
                </>
              )}
            </Button>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>RFP Title *</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., SOC 2 Compliance Implementation Project"
              {...register('title')}
              className={cn(errors.title && 'border-destructive')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Objectives */}
          <div className="space-y-2">
            <Label htmlFor="objectives" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Project Objectives</span>
            </Label>
            <Textarea
              id="objectives"
              placeholder="Describe the goals and outcomes you want to achieve..."
              rows={4}
              {...register('objectives')}
              className={cn('resize-none', autoFilling && 'border-primary')}
            />
            <p className="text-xs text-gray-500">
              Auto-populated from your organization profile and assessment results
            </p>
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements" className="flex items-center space-x-2">
              <ClipboardList className="h-4 w-4" />
              <span>Technical Requirements *</span>
            </Label>
            <Textarea
              id="requirements"
              placeholder="List the specific technical requirements, features, and capabilities needed..."
              rows={5}
              {...register('requirements')}
              className={cn('resize-none', errors.requirements && 'border-destructive', autoFilling && 'border-primary')}
            />
            {errors.requirements && (
              <p className="text-sm text-destructive">{errors.requirements.message}</p>
            )}
          </div>

          {/* Timeline and Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeline" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Timeline</span>
              </Label>
              <Select onValueChange={(value) => setValue('timeline', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="< 3 months">Less than 3 months</SelectItem>
                  <SelectItem value="3-6 months">3-6 months</SelectItem>
                  <SelectItem value="6-12 months">6-12 months</SelectItem>
                  <SelectItem value="> 12 months">More than 12 months</SelectItem>
                  <SelectItem value="Flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Budget Range</span>
              </Label>
              <Select onValueChange={(value) => setValue('budget', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="< €50K">Less than €50K</SelectItem>
                  <SelectItem value="€50K - €100K">€50K - €100K</SelectItem>
                  <SelectItem value="€100K - €500K">€100K - €500K</SelectItem>
                  <SelectItem value="€500K - €1M">€500K - €1M</SelectItem>
                  <SelectItem value="> €1M">More than €1M</SelectItem>
                  <SelectItem value="Not specified">Not specified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vendor Selection */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Select Vendors * ({selectedVendorIds.length} selected)</span>
              </span>
            </Label>

            {loadingVendors ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
                {vendors.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No vendors available
                  </p>
                ) : (
                  vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => toggleVendor(vendor.id)}
                    >
                      <Checkbox
                        checked={selectedVendorIds.includes(vendor.id)}
                        onCheckedChange={() => toggleVendor(vendor.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{vendor.companyName}</p>
                        {vendor.categories && vendor.categories.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {vendor.categories.slice(0, 3).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {errors.vendorIds && (
              <p className="text-sm text-destructive">{errors.vendorIds.message}</p>
            )}
          </div>

          {/* Document Upload - Placeholder */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Supporting Documents (Optional)</span>
            </Label>
            <div className="border-2 border-dashed rounded-md p-8 text-center text-gray-500">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Document upload coming soon</p>
              <p className="text-xs text-gray-400">Max 5 files, 10MB each (PDF, DOCX, XLSX)</p>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="flex space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createRfpMutation.isPending}>
              {isSubmitting || createRfpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create RFP Draft'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
