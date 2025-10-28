/**
 * RFP Form Modal - Create and edit RFPs
 * Features: Auto-fill from assessments, vendor match scoring, document upload, validation
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useCreateRFP } from '@/hooks/useCreateRFP';
import { assessmentApi, queryKeys } from '@/lib/api';
import DocumentStorage from '@/components/DocumentStorage';
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
  CheckCircle2,
  Star,
  Calendar,
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
  matchScore?: number;
  matchQuality?: string;
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
  const [showAssessmentSelector, setShowAssessmentSelector] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

  const createRfpMutation = useCreateRFP();

  // Fetch user's completed assessments for auto-fill
  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: queryKeys.assessments,
    queryFn: assessmentApi.getAssessments,
    enabled: open,
  });

  // Filter to completed assessments only
  const completedAssessments = assessments?.filter(
    (a: any) => a.status === 'COMPLETED' || a.status === 'IN_PROGRESS'
  ) || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    getValues,
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

  const watchedVendorIds = watch('vendorIds');
  const selectedVendorIds = Array.isArray(watchedVendorIds) ? watchedVendorIds : [];
  const watchedDocuments = watch('documents');
  const selectedDocuments = Array.isArray(watchedDocuments) ? watchedDocuments : [];
  const timeline = watch('timeline');
  const budget = watch('budget');

  // Fetch vendors on mount or when assessment changes
  useEffect(() => {
    if (open) {
      fetchVendors();
    }
  }, [open, selectedAssessment]);

  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const token = localStorage.getItem('token');

      // If assessment is selected, fetch vendor matches with scores
      if (selectedAssessment?.id) {
        try {
          const matchesResponse = await fetch(`/v1/assessments/${selectedAssessment.id}/vendor-matches-v2?threshold=0&limit=100`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (matchesResponse.ok) {
            const matchesData = await matchesResponse.json();
            const matches = matchesData.data?.matches || [];

            // Transform matches to vendor format with scores
            const vendorsWithScores = matches.map((match: any) => ({
              id: match.vendor.id,
              companyName: match.vendor.companyName,
              categories: match.vendor.categories || [],
              logo: match.vendor.logo,
              matchScore: match.totalScore,
              matchQuality: match.matchQuality,
            }));

            // Sort by match score descending
            vendorsWithScores.sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0));

            setVendors(vendorsWithScores);

            // Pre-select top 3 vendors
            if (vendorsWithScores.length > 0 && selectedVendorIds.length === 0) {
              const topVendors = vendorsWithScores.slice(0, 3).map((v: any) => v.id);
              setValue('vendorIds', topVendors);
            }

            setLoadingVendors(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching vendor matches:', error);
          // Fall through to fetch all vendors
        }
      }

      // Fallback: Fetch all vendors without scores
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

  const handleAutoFillClick = () => {
    // Show assessment selector if no assessment selected
    if (!selectedAssessment) {
      if (completedAssessments.length === 0) {
        toast({
          title: 'No assessments available',
          description: 'Complete an assessment first to enable auto-fill.',
          variant: 'destructive',
        });
        return;
      }
      setShowAssessmentSelector(true);
      return;
    }

    // Perform auto-fill with selected assessment
    handleAutoFill();
  };

  const handleAutoFill = async () => {
    if (!selectedAssessment) return;

    setAutoFilling(true);

    try {
      // Fetch assessment results
      const results = await assessmentApi.getAssessmentResults(selectedAssessment.id);

      // Generate title
      const templateName = selectedAssessment.template?.name || 'Compliance';
      setValue('title', `RFP for ${templateName} Solutions`);

      // Generate objectives from assessment context
      // Note: riskScore is stored as 0-100, we display as 0-10
      const riskScoreDisplay = results.overallRiskScore != null
        ? (results.overallRiskScore / 10).toFixed(1)
        : 'N/A';

      const objectives = `
We are seeking solutions to address compliance requirements identified in our ${templateName} assessment.

Assessment Summary:
- Overall Risk Score: ${riskScoreDisplay}/10
- Total Gaps Identified: ${results.gaps?.length || 0}
- Critical Gaps: ${results.gaps?.filter((g: any) => g.severity === 'CRITICAL').length || 0}
- Assessment Date: ${new Date(selectedAssessment.completedAt || selectedAssessment.createdAt).toLocaleDateString()}

Our objective is to implement solutions that address these compliance gaps and improve our overall compliance posture.
      `.trim();
      setValue('objectives', objectives);

      // Get professionally formatted requirements from backend AI service
      if (results.gaps && results.gaps.length > 0) {
        try {
          const token = localStorage.getItem('token');
          const rfpRequirementsResponse = await fetch(
            `/v1/assessments/${selectedAssessment.id}/rfp-requirements`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (rfpRequirementsResponse.ok) {
            const rfpData = await rfpRequirementsResponse.json();
            const formattedRequirements = rfpData.data?.formattedRequirements;

            if (formattedRequirements) {
              setValue('requirements', `Based on our ${templateName} assessment, we require solutions that address the following compliance gaps:\n\n${formattedRequirements}`);
            } else {
              // Fallback to basic formatting
              setValue('requirements', `Based on our assessment, we identified ${results.gaps.length} compliance gaps that require solutions. Please refer to the objectives section for details.`);
            }
          } else {
            // Fallback to basic formatting
            setValue('requirements', `Based on our assessment, we identified ${results.gaps.length} compliance gaps across key areas:\n\n${results.gaps.slice(0, 5).map((g: any, i: number) => `${i + 1}. ${g.title || 'Compliance gap'} (${g.severity || 'MEDIUM'} severity)`).join('\n')}`);
          }
        } catch (error) {
          console.error('Error fetching formatted requirements:', error);
          // Fallback to basic formatting
          setValue('requirements', `Based on our assessment, we identified ${results.gaps.length} compliance gaps that require vendor solutions.`);
        }
      }

      // Fetch strategy matrix for timeline and budget
      try {
        const token = localStorage.getItem('token');
        const strategyMatrixResponse = await fetch(
          `/v1/assessments/${selectedAssessment.id}/strategy-matrix`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (strategyMatrixResponse.ok) {
          const strategyData = await strategyMatrixResponse.json();
          const matrix = strategyData.data;

          // Determine timeline based on which bucket has the most gaps
          const buckets = [
            { name: 'immediate', timeline: '< 3 months', gaps: matrix.immediate?.gapCount || 0 },
            { name: 'nearTerm', timeline: '3-6 months', gaps: matrix.nearTerm?.gapCount || 0 },
            { name: 'strategic', timeline: '6-12 months', gaps: matrix.strategic?.gapCount || 0 },
          ];

          const primaryBucket = buckets.reduce((max, bucket) =>
            bucket.gaps > max.gaps ? bucket : max
          );

          setValue('timeline', primaryBucket.timeline);

          // Calculate total budget from all buckets
          const totalBudget = {
            immediate: matrix.immediate?.estimatedCostRange || '€0',
            nearTerm: matrix.nearTerm?.estimatedCostRange || '€0',
            strategic: matrix.strategic?.estimatedCostRange || '€0',
          };

          // Extract and sum budget values (rough estimate from ranges)
          const extractBudgetMidpoint = (range: string): number => {
            const match = range.match(/€(\d+)K-€(\d+)K/);
            if (match) {
              const lower = parseInt(match[1]);
              const upper = parseInt(match[2]);
              return (lower + upper) / 2;
            }
            const singleMatch = range.match(/€(\d+)K/);
            if (singleMatch) {
              return parseInt(singleMatch[1]);
            }
            return 0;
          };

          const totalEstimate =
            extractBudgetMidpoint(totalBudget.immediate) +
            extractBudgetMidpoint(totalBudget.nearTerm) +
            extractBudgetMidpoint(totalBudget.strategic);

          // Map to budget ranges
          if (totalEstimate > 500) {
            setValue('budget', '> €1M');
          } else if (totalEstimate > 250) {
            setValue('budget', '€500K - €1M');
          } else if (totalEstimate > 100) {
            setValue('budget', '€100K - €500K');
          } else if (totalEstimate > 50) {
            setValue('budget', '€50K - €100K');
          } else if (totalEstimate > 0) {
            setValue('budget', '< €50K');
          } else {
            setValue('budget', 'Not specified');
          }
        } else {
          // Fallback to basic logic if strategy matrix fails
          const criticalCount = results.gaps?.filter((g: any) => g.severity === 'CRITICAL').length || 0;
          if (criticalCount > 5) {
            setValue('timeline', '< 3 months');
            setValue('budget', '€100K - €500K');
          } else if (criticalCount > 0) {
            setValue('timeline', '3-6 months');
            setValue('budget', '€50K - €100K');
          } else {
            setValue('timeline', '6-12 months');
            setValue('budget', '< €50K');
          }
        }
      } catch (error) {
        console.error('Error fetching strategy matrix:', error);
        // Fallback to basic logic
        const criticalCount = results.gaps?.filter((g: any) => g.severity === 'CRITICAL').length || 0;
        if (criticalCount > 5) {
          setValue('timeline', '< 3 months');
          setValue('budget', '€100K - €500K');
        } else if (criticalCount > 0) {
          setValue('timeline', '3-6 months');
          setValue('budget', '€50K - €100K');
        } else {
          setValue('timeline', '6-12 months');
          setValue('budget', '< €50K');
        }
      }

      toast({
        title: 'Auto-fill complete',
        description: `Populated from "${selectedAssessment.template?.name}" assessment with ${results.gaps?.length || 0} gaps identified.`,
      });
    } catch (error) {
      console.error('Error auto-filling from assessment:', error);
      toast({
        title: 'Auto-fill failed',
        description: 'Could not load assessment data. Please fill manually.',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => setAutoFilling(false), 500);
    }
  };

  const selectAssessment = (assessment: any) => {
    setSelectedAssessment(assessment);
    setShowAssessmentSelector(false);
    // Trigger auto-fill after selection
    setTimeout(() => handleAutoFill(), 100);
  };

  const toggleVendor = useCallback((vendorId: string) => {
    const current = getValues('vendorIds') || [];
    const updated = current.includes(vendorId)
      ? current.filter(id => id !== vendorId)
      : [...current, vendorId];
    setValue('vendorIds', updated);
  }, [getValues, setValue]);

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
          {/* Assessment Selection and Auto-fill */}
          <div className="space-y-2">
            {selectedAssessment ? (
              <div className="flex items-center justify-between p-3 bg-cyan-900/20 border border-cyan-600/30 rounded-md">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm text-gray-300">
                    Using: <span className="font-medium text-white">{selectedAssessment.template?.name}</span>
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {selectedAssessment.gaps?.length || 0} gaps
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAutoFillClick}
                    disabled={autoFilling}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    {autoFilling ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-3 w-3" />
                        Re-fill
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAssessment(null)}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoFillClick}
                  disabled={assessmentsLoading || autoFilling}
                  className="text-primary"
                >
                  {assessmentsLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Auto-Fill from Assessment
                    </>
                  )}
                </Button>
              </div>
            )}
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
              <Select value={timeline} onValueChange={(value) => setValue('timeline', value)}>
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
              <Select value={budget} onValueChange={(value) => setValue('budget', value)}>
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
              {selectedAssessment && vendors.some(v => v.matchScore) && (
                <span className="text-xs text-cyan-400 flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Sorted by match score
                </span>
              )}
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
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                    >
                      <Checkbox
                        checked={selectedVendorIds.includes(vendor.id)}
                        onCheckedChange={() => toggleVendor(vendor.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{vendor.companyName}</p>
                          {vendor.matchScore !== undefined && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                vendor.matchScore >= 80 ? "bg-green-900/30 text-green-400 border-green-600" :
                                vendor.matchScore >= 60 ? "bg-cyan-900/30 text-cyan-400 border-cyan-600" :
                                vendor.matchScore >= 40 ? "bg-yellow-900/30 text-yellow-400 border-yellow-600" :
                                "bg-gray-700/30 text-gray-400 border-gray-600"
                              )}
                            >
                              {vendor.matchScore.toFixed(0)}% match
                            </Badge>
                          )}
                        </div>
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

          {/* Document Selection */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Select Documents to Attach (Optional)</span>
              </span>
              {selectedDocuments.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedDocuments.length} selected
                </Badge>
              )}
            </Label>
            <p className="text-xs text-gray-400">
              Select up to 5 documents to attach to vendor emails
            </p>
            <DocumentStorage
              organizationId={organizationId}
              className="border rounded-md"
              selectionMode={true}
              selectedDocuments={selectedDocuments}
              onSelectionChange={(documentIds) => setValue('documents', documentIds)}
              maxSelection={5}
            />
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

      {/* Assessment Selector Dialog */}
      <Dialog open={showAssessmentSelector} onOpenChange={setShowAssessmentSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Assessment</DialogTitle>
            <DialogDescription>
              Choose an assessment to auto-fill your RFP with compliance gaps and requirements
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {completedAssessments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No completed assessments available</p>
                <p className="text-sm text-gray-500 mt-1">
                  Complete an assessment first to enable auto-fill
                </p>
              </div>
            ) : (
              completedAssessments.map((assessment: any) => (
                <div
                  key={assessment.id}
                  onClick={() => selectAssessment(assessment)}
                  className="p-4 border rounded-lg hover:bg-cyan-900/10 hover:border-cyan-600/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">
                        {assessment.template?.name || 'Untitled Assessment'}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(assessment.completedAt || assessment.createdAt).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {assessment.status}
                        </Badge>
                      </div>
                      {assessment.gaps && (
                        <p className="text-sm text-gray-500 mt-2">
                          {assessment.gaps.length} gaps identified
                          {assessment.gaps.filter((g: any) => g.severity === 'CRITICAL').length > 0 && (
                            <span className="text-red-400 ml-2">
                              ({assessment.gaps.filter((g: any) => g.severity === 'CRITICAL').length} critical)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssessmentSelector(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
