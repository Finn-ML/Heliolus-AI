import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, CheckCircle, Loader2, Edit, Shield, DollarSign, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { anonymousApi } from '@/lib/anonymousApi';
import { organizationApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface RiskProfileCardProps {
  hideButtons?: boolean;
  isAnonymous?: boolean;
  onRiskProfileSaved?: (saved: boolean) => void;
  onRiskProfileSaving?: (saving: boolean) => void;
}

interface RiskProfileData {
  financialCrimeRisk: string;
  riskAppetite: string;
  complianceBudget: string;
  regulatoryRequirements: string;
  painPoints: string;
}

const RiskProfileCard: React.FC<RiskProfileCardProps> = ({
  hideButtons = false,
  isAnonymous = false,
  onRiskProfileSaved,
  onRiskProfileSaving,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<RiskProfileData>({
    financialCrimeRisk: '',
    riskAppetite: '',
    complianceBudget: '',
    regulatoryRequirements: '',
    painPoints: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof RiskProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Load existing risk profile data on component mount
  const { data: existingProfile } = useQuery({
    queryKey: isAnonymous ? ['anonymous-profile'] : ['organization', 'my'],
    queryFn: isAnonymous
      ? () => anonymousApi.getProfile()
      : () => organizationApi.getMyOrganization(),
    enabled: true,
  });

  // Update form data when profile loads
  useEffect(() => {
    if (existingProfile) {
      const profile = (existingProfile as any)?.profile || (existingProfile as any);
      if (profile) {
        setFormData({
          financialCrimeRisk: profile.financialCrimeRisk || '',
          riskAppetite: profile.riskAppetite || '',
          complianceBudget: profile.complianceBudget || '',
          regulatoryRequirements: profile.regulatoryRequirements || '',
          painPoints: profile.painPoints || '',
        });

        // Check if we have any risk profile data
        const hasRiskData = Boolean(
          profile.financialCrimeRisk ||
            profile.riskAppetite ||
            profile.complianceBudget ||
            profile.regulatoryRequirements ||
            profile.painPoints
        );

        // If we have risk data, show view mode; otherwise show edit mode
        setIsEditing(!hasRiskData);
      } else {
        // Profile exists but no data, show edit mode
        setIsEditing(true);
      }

      // Store sessionId for anonymous users
      if (isAnonymous && (existingProfile as any)?.sessionId) {
        setSessionId((existingProfile as any).sessionId);
      }
    } else {
      // No profile data exists, show edit mode
      setIsEditing(true);
    }
  }, [existingProfile, isAnonymous]);

  // Save risk profile mutation
  const saveRiskProfileMutation = useMutation({
    mutationFn: async (riskData: RiskProfileData) => {
      if (isAnonymous) {
        // For anonymous users, send only the risk profile fields to avoid validation conflicts
        // Don't merge with existing profile to avoid invalid riskProfile enum values
        return await anonymousApi.saveProfile(riskData, sessionId || undefined);
      } else {
        // For authenticated users, send only the risk profile fields (not the entire org object)
        const currentOrg = existingProfile as any;
        const orgId = currentOrg?.id;
        if (!orgId) {
          throw new Error('Organization ID not found');
        }
        // Send only the fields that should be updated, not read-only fields like id, createdAt
        return await organizationApi.updateOrganization(orgId, riskData);
      }
    },
    onMutate: () => {
      setIsSaving(true);
      onRiskProfileSaving?.(true);
    },
    onSuccess: response => {
      // Update form data with the response to keep UI consistent with backend
      if (response && typeof response === 'object') {
        const updatedProfile = (response as any)?.profile || response;
        if (updatedProfile) {
          setFormData({
            financialCrimeRisk: updatedProfile.financialCrimeRisk || '',
            riskAppetite: updatedProfile.riskAppetite || '',
            complianceBudget: updatedProfile.complianceBudget || '',
            regulatoryRequirements: updatedProfile.regulatoryRequirements || '',
            painPoints: updatedProfile.painPoints || '',
          });
        }
      }

      // Switch to view mode after successful save
      setIsEditing(false);

      // Invalidate and refetch the profile data
      if (isAnonymous) {
        queryClient.invalidateQueries({ queryKey: ['anonymous-profile'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['organization', 'my'] });
      }

      onRiskProfileSaved?.(true);
      toast({
        title: 'Risk Profile Saved',
        description: 'Your financial crime risk assessment has been saved successfully.',
      });
    },
    onError: (error: any) => {
      onRiskProfileSaved?.(false);
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save risk profile. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSaving(false);
      onRiskProfileSaving?.(false);
    },
  });

  const saveRiskProfile = () => {
    saveRiskProfileMutation.mutate(formData);
  };

  // Helper function to format display values
  const formatValue = (value: string, type: 'risk' | 'appetite' | 'budget' | 'text' = 'text') => {
    if (!value) return 'Not specified';

    switch (type) {
      case 'risk':
        return value === 'low'
          ? 'Low Risk'
          : value === 'medium'
            ? 'Medium Risk'
            : value === 'high'
              ? 'High Risk'
              : value;
      case 'appetite':
        return value === 'conservative'
          ? 'Conservative'
          : value === 'moderate'
            ? 'Moderate'
            : value === 'aggressive'
              ? 'Aggressive'
              : value;
      case 'budget':
        return value === 'under-100k'
          ? 'Under $100K'
          : value === '100k-500k'
            ? '$100K - $500K'
            : value === '500k-1m'
              ? '$500K - $1M'
              : value === 'over-1m'
                ? 'Over $1M'
                : value;
      default:
        return value;
    }
  };

  // Check if risk profile is complete
  const hasRiskData = Boolean(
    formData.financialCrimeRisk ||
      formData.riskAppetite ||
      formData.complianceBudget ||
      formData.regulatoryRequirements ||
      formData.painPoints
  );

  return (
    <Card className="bg-gray-800/80 border-gray-700 transition-all duration-500 hover:border-orange-600/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            <span className="text-white">Financial Crime Risk Profile</span>
            {hasRiskData && !isEditing && <CheckCircle className="h-5 w-5 text-green-400 ml-1" />}
          </div>
          {!hideButtons && !isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              data-testid="button-edit-risk-profile"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          // Edit mode - show form fields
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Financial Crime Risk Level</Label>
                <RadioGroup
                  value={formData.financialCrimeRisk}
                  onValueChange={value => handleInputChange('financialCrimeRisk', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="risk-low" />
                    <Label htmlFor="risk-low" className="text-gray-300">
                      Low Risk
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="risk-medium" />
                    <Label htmlFor="risk-medium" className="text-gray-300">
                      Medium Risk
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="risk-high" />
                    <Label htmlFor="risk-high" className="text-gray-300">
                      High Risk
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskAppetite" className="text-gray-200">
                  Risk Appetite
                </Label>
                <Select
                  value={formData.riskAppetite}
                  onValueChange={value => handleInputChange('riskAppetite', value)}
                >
                  <SelectTrigger id="riskAppetite" data-testid="select-risk-appetite">
                    <SelectValue placeholder="Select risk appetite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complianceBudget" className="text-gray-200">
                  Annual Compliance Budget
                </Label>
                <Select
                  value={formData.complianceBudget}
                  onValueChange={value => handleInputChange('complianceBudget', value)}
                >
                  <SelectTrigger id="complianceBudget" data-testid="select-budget">
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-100k">Under $100K</SelectItem>
                    <SelectItem value="100k-500k">$100K - $500K</SelectItem>
                    <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                    <SelectItem value="over-1m">Over $1M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="regulatoryRequirements" className="text-gray-200">
                Regulatory Requirements
              </Label>
              <Textarea
                id="regulatoryRequirements"
                data-testid="textarea-regulatory"
                value={formData.regulatoryRequirements}
                onChange={e => handleInputChange('regulatoryRequirements', e.target.value)}
                placeholder="List applicable regulations (e.g., AML/BSA, GDPR, SOX, PCI DSS)..."
                rows={3}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-600 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="painPoints" className="text-gray-200">
                Current Compliance Challenges
              </Label>
              <Textarea
                id="painPoints"
                data-testid="textarea-pain-points"
                value={formData.painPoints}
                onChange={e => handleInputChange('painPoints', e.target.value)}
                placeholder="Describe your main compliance pain points and challenges..."
                rows={3}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-600 transition-colors"
              />
            </div>
          </>
        ) : (
          // View mode - display formatted data
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-300 mb-1">Financial Crime Risk Level</p>
                <p className="text-white font-semibold" data-testid="text-risk-level">
                  {formatValue(formData.financialCrimeRisk, 'risk')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-300 mb-1">Risk Appetite</p>
                <p className="text-white font-semibold" data-testid="text-risk-appetite">
                  {formatValue(formData.riskAppetite, 'appetite')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-300 mb-1">Annual Compliance Budget</p>
                <p className="text-white font-semibold" data-testid="text-budget">
                  {formatValue(formData.complianceBudget, 'budget')}
                </p>
              </div>
            </div>

            {formData.regulatoryRequirements && (
              <div className="col-span-full">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300 mb-1">
                      Regulatory Requirements
                    </p>
                    <p className="text-white" data-testid="text-regulatory">
                      {formData.regulatoryRequirements}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {formData.painPoints && (
              <div className="col-span-full">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300 mb-1">
                      Current Compliance Challenges
                    </p>
                    <p className="text-white" data-testid="text-pain-points">
                      {formData.painPoints}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!hideButtons && isEditing && (
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-600">
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              data-testid="button-cancel-risk-profile"
            >
              Cancel
            </Button>
            <Button
              onClick={saveRiskProfile}
              disabled={isSaving}
              className="bg-orange-600 hover:bg-orange-700 text-white transition-colors"
              data-testid="button-save-risk-profile"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Save Risk Profile
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskProfileCard;
