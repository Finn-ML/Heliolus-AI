import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  DollarSign,
  Globe,
  AlertTriangle,
  Link,
  Loader2,
  Leaf,
  Shield,
  CheckCircle,
  X,
  Edit,
  MapPin,
  Briefcase,
  Calendar,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { organizationApi, queryKeys, createMutations } from '@/lib/api';
import { anonymousApi } from '@/lib/anonymousApi';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useWebsiteExtraction, getConfidenceColor, formatConfidence } from '@/hooks/useWebsiteExtraction';

interface BusinessProfileProps {
  onProfileComplete: (profile: any) => void;
  onNextStep?: () => void;
  onPreviousStep?: () => void;
  onProfileSaved?: (saved: boolean) => void;
  onProfileSaving?: (saving: boolean) => void;
  hideButtons?: boolean;
  isAnonymous?: boolean;
}

const BusinessProfile: React.FC<BusinessProfileProps> = ({
  onProfileComplete,
  onNextStep,
  onPreviousStep,
  onProfileSaved,
  onProfileSaving,
  hideButtons = false,
  isAnonymous = false,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    annualRevenue: '',
    geography: '',
    businessModel: '',
    customerTypes: '',
    complianceTeamSize: '',
    currentMaturityLevel: '',
    riskAppetite: '',
    regulatoryRequirements: '',
    description: '',
    companyWebsite: '',
    financialCrimeRisk: '',
    complianceBudget: '',
    currentSolutions: '',
    painPoints: '',
    regulatoryJurisdictions: '',
  });

  const [maturityAssessment, setMaturityAssessment] = useState(null);
  const [websiteAnalysis, setWebsiteAnalysis] = useState(null);

  // Website extraction hook (Story 2.3)
  const { extract: extractWebsite, isExtracting, extractionResult } = useWebsiteExtraction({
    onSuccess: (result) => {
      console.log('[BusinessProfile] Extraction success, result:', result);
      setWebsiteAnalysis(result);

      // Auto-fill form fields with extracted data
      // Backend now sends FieldResult structure: { value, confidence, sources, needsReview }
      if (result.extractedData) {
        const extractedData = result.extractedData;
        console.log('[BusinessProfile] Extracted data keys:', Object.keys(extractedData));

        setFormData(prev => ({
          ...prev,
          companyName: extractedData.name?.value || prev.companyName,
          industry: extractedData.industry?.value || prev.industry,
          companySize: extractedData.size?.value?.toLowerCase() || prev.companySize,
          description: extractedData.description?.value || prev.description,
          annualRevenue: extractedData.annualRevenue?.value?.toLowerCase().replace(/_/g, '-') || prev.annualRevenue,
          complianceTeamSize: extractedData.complianceTeamSize?.value?.toLowerCase().replace(/_/g, '-') || prev.complianceTeamSize,
          geography: extractedData.geography?.value?.toLowerCase() || prev.geography,
        }));

        console.log('[BusinessProfile] Form data updated with extracted values');
      }
    },
  });

  // Fetch organization data using React Query (authenticated users)
  const {
    data: organization,
    isLoading: isLoadingOrg,
    error: orgError,
    refetch: refetchOrg,
  } = useQuery({
    queryKey: queryKeys.myOrganization,
    queryFn: organizationApi.getMyOrganization,
    enabled: !!user?.id && !isAnonymous,
    staleTime: 30000, // Keep data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Fetch anonymous profile data (anonymous users)
  const {
    data: anonymousProfile,
    isLoading: isLoadingAnon,
    error: anonError,
    refetch: refetchAnon,
  } = useQuery({
    queryKey: ['anonymous-profile'],
    queryFn: () => anonymousApi.getProfile(),
    enabled: isAnonymous,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Computed values based on mode
  const isLoading = isAnonymous ? isLoadingAnon : isLoadingOrg;
  const error = isAnonymous ? anonError : orgError;
  const refetch = isAnonymous ? refetchAnon : refetchOrg;
  const profileData = isAnonymous ? (anonymousProfile as any)?.profile : organization;

  // Mapping functions to convert backend enum values to frontend values
  const mapAnnualRevenueFromDB = (value: string) => {
    switch (value) {
      case 'UNDER_1M':
        return 'under-1m';
      case 'FROM_1M_10M':
        return '1m-10m';
      case 'FROM_10M_100M':
        return '10m-100m';
      case 'OVER_100M':
        return 'over-100m';
      default:
        return '';
    }
  };

  const mapComplianceTeamSizeFromDB = (value: string) => {
    switch (value) {
      case 'NONE':
        return 'none';
      case 'ONE_TWO':
        return '1-2';
      case 'THREE_TEN':
        return '3-10';
      case 'OVER_TEN':
        return 'over-10';
      default:
        return '';
    }
  };

  const mapGeographyFromDB = (value: string) => {
    switch (value) {
      case 'US':
        return 'us';
      case 'EU':
        return 'eu';
      case 'UK':
        return 'uk';
      case 'APAC':
        return 'apac';
      case 'GLOBAL':
        return 'global';
      default:
        return '';
    }
  };

  // Update form data when profile data changes
  React.useEffect(() => {
    if (profileData) {
      const newData = isAnonymous
        ? {
            // Anonymous profile mapping
            companyName: profileData.name || '',
            industry: profileData.industry || '',
            companySize: profileData.size?.toLowerCase() || '',
            description: profileData.description || '',
            companyWebsite: profileData.website || '',
            annualRevenue: mapAnnualRevenueFromDB(profileData.annualRevenue) || '',
            complianceTeamSize: mapComplianceTeamSizeFromDB(profileData.complianceTeamSize) || '',
            geography: mapGeographyFromDB(profileData.geography) || '',
            riskAppetite: profileData.riskAppetite || '',
            regulatoryRequirements: profileData.regulatoryRequirements || '',
            financialCrimeRisk: profileData.financialCrimeRisk || '',
            complianceBudget: profileData.complianceBudget || '',
            painPoints: profileData.painPoints || '',
            // Legacy/unused fields
            businessModel: '',
            customerTypes: '',
            currentMaturityLevel: '',
            currentSolutions: '',
            regulatoryJurisdictions: '',
          }
        : {
            // Organization profile mapping (authenticated users)
            companyName: profileData.name || '',
            industry: profileData.industry || '',
            companySize: profileData.size?.toLowerCase() || '',
            description: profileData.description || '',
            companyWebsite: profileData.website || '',
            annualRevenue: mapAnnualRevenueFromDB(profileData.annualRevenue) || '',
            complianceTeamSize: mapComplianceTeamSizeFromDB(profileData.complianceTeamSize) || '',
            geography: mapGeographyFromDB(profileData.geography) || '',
            // Legacy/unused fields (kept for UI compatibility)
            businessModel: '',
            customerTypes: '',
            currentMaturityLevel: '',
            riskAppetite: '',
            regulatoryRequirements: '',
            financialCrimeRisk: '',
            complianceBudget: '',
            currentSolutions: '',
            painPoints: '',
            regulatoryJurisdictions: '',
          };
      setFormData(newData);

      // Report that profile is saved when loaded
      if (onProfileSaved) {
        onProfileSaved(true);
      }

      // If profile exists, default to view mode for all users (authenticated and anonymous)
      if (!isEditing) {
        // Only set to view mode if not already editing
        setIsEditing(false);
      }
    } else if (!isLoading && !error) {
      // No profile exists, show edit mode
      setIsEditing(true);
      // Report that profile is not saved
      if (onProfileSaved) {
        onProfileSaved(false);
      }
    }
  }, [profileData, isLoading, error, onProfileSaved, isAnonymous]);

  // Create/Update organization mutations
  const updateOrganizationMutation = useMutation({
    ...createMutations(queryClient).updateOrganization(organization?.id || ''),
    onSuccess: result => {
      // Immediately update local state with the saved data
      if (result) {
        const updatedData = {
          companyName: result.name || '',
          industry: result.industry || '',
          companySize: result.size?.toLowerCase() || '',
          description: result.description || '',
          companyWebsite: result.website || '',
          annualRevenue: mapAnnualRevenueFromDB(result.annualRevenue) || '',
          complianceTeamSize: mapComplianceTeamSizeFromDB(result.complianceTeamSize) || '',
          geography: mapGeographyFromDB(result.geography) || '',
          // Legacy/unused fields (kept for UI compatibility)
          businessModel: '',
          customerTypes: '',
          currentMaturityLevel: '',
          riskAppetite: '',
          regulatoryRequirements: '',
          financialCrimeRisk: '',
          complianceBudget: '',
          currentSolutions: '',
          painPoints: '',
          regulatoryJurisdictions: '',
        };
        setFormData(updatedData);
      }

      setIsEditing(false);
      if (onProfileSaved) {
        onProfileSaved(true);
      }
      toast({
        title: 'Profile Saved',
        description: 'Your business profile has been saved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save business profile. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Anonymous profile mutations
  const updateAnonymousProfileMutation = useMutation({
    mutationFn: anonymousApi.updateProfile,
    onSuccess: result => {
      // Update cached data and invalidate to force refresh
      queryClient.setQueryData(['anonymous-profile'], (oldData: any) => ({
        ...oldData,
        profile: result.profile,
      }));

      // Force invalidation to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['anonymous-profile'] });

      // Update local form data immediately
      const updatedFormData = {
        companyName: result.profile.name || '',
        industry: result.profile.industry || '',
        companySize: result.profile.size?.toLowerCase() || '',
        description: result.profile.description || '',
        companyWebsite: result.profile.website || '',
        annualRevenue: mapAnnualRevenueFromDB(result.profile.annualRevenue) || '',
        complianceTeamSize: mapComplianceTeamSizeFromDB(result.profile.complianceTeamSize) || '',
        geography: mapGeographyFromDB(result.profile.geography) || '',
        riskAppetite: result.profile.riskAppetite || '',
        regulatoryRequirements: result.profile.regulatoryRequirements || '',
        financialCrimeRisk: result.profile.financialCrimeRisk || '',
        complianceBudget: result.profile.complianceBudget || '',
        painPoints: result.profile.painPoints || '',
        // Legacy/unused fields
        businessModel: '',
        customerTypes: '',
        currentMaturityLevel: '',
        currentSolutions: '',
        regulatoryJurisdictions: '',
      };
      setFormData(updatedFormData);

      setIsEditing(false);
      if (onProfileSaved) {
        onProfileSaved(true);
      }
      toast({
        title: 'Profile Saved',
        description: 'Your business profile has been saved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save business profile. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const createOrganizationMutation = useMutation({
    ...createMutations(queryClient).createOrganization,
    onSuccess: result => {
      // If backend returns a new token with organizationId, update localStorage
      if (result.token) {
        localStorage.setItem('token', result.token);
        console.log('[BusinessProfile] Updated token with organizationId');
      }

      // Immediately update local state with the created/returned data
      if (result) {
        const updatedData = {
          companyName: result.name || '',
          industry: result.industry || '',
          companySize: result.size?.toLowerCase() || '',
          description: result.description || '',
          companyWebsite: result.website || '',
          annualRevenue: mapAnnualRevenueFromDB(result.annualRevenue) || '',
          complianceTeamSize: mapComplianceTeamSizeFromDB(result.complianceTeamSize) || '',
          geography: mapGeographyFromDB(result.geography) || '',
          // Legacy/unused fields (kept for UI compatibility)
          businessModel: '',
          customerTypes: '',
          currentMaturityLevel: '',
          riskAppetite: '',
          regulatoryRequirements: '',
          financialCrimeRisk: '',
          complianceBudget: '',
          currentSolutions: '',
          painPoints: '',
          regulatoryJurisdictions: '',
        };
        setFormData(updatedData);
      }

      setIsEditing(false);
      if (onProfileSaved) {
        onProfileSaved(true);
      }

      // Handle both create and "already exists" cases
      const isExisting = result?.message?.includes('already exists');
      toast({
        title: isExisting ? 'Profile Retrieved' : 'Profile Created',
        description: isExisting
          ? 'Found and loaded your existing organization profile.'
          : 'Your business profile has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Create Failed',
        description: error.message || 'Failed to create business profile. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const analyzeWebsite = async () => {
    if (!formData.companyWebsite) {
      toast({
        title: 'Website URL Required',
        description: 'Please enter a company website URL to analyze.',
        variant: 'destructive',
      });
      return;
    }

    if (!organization?.id) {
      toast({
        title: 'Save Profile First',
        description: 'Please save your business profile before analyzing the website.',
        variant: 'destructive',
      });
      return;
    }

    // Use the new extraction hook (Story 2.3)
    await extractWebsite(organization.id, formData.companyWebsite);
  };

  const saveBusinessProfile = async () => {
    setSavingProfile(true);
    if (onProfileSaving) {
      onProfileSaving(true);
    }

    try {
      // Validate required fields
      if (!formData.companyName || !formData.geography) {
        toast({
          title: 'Required Fields Missing',
          description: 'Please fill in Company Name and Geography.',
          variant: 'destructive',
        });
        setSavingProfile(false);
        if (onProfileSaving) {
          onProfileSaving(false);
        }
        return;
      }

      // Mapping functions to convert frontend values to backend enum values (shared)
      const mapAnnualRevenue = (value: string) => {
        switch (value) {
          case 'under-1m':
            return 'UNDER_1M';
          case '1m-10m':
            return 'FROM_1M_10M';
          case '10m-100m':
            return 'FROM_10M_100M';
          case 'over-100m':
            return 'OVER_100M';
          default:
            return undefined;
        }
      };

      const mapComplianceTeamSize = (value: string) => {
        switch (value) {
          case 'none':
            return 'NONE';
          case '1-2':
            return 'ONE_TWO';
          case '3-10':
            return 'THREE_TEN';
          case 'over-10':
            return 'OVER_TEN';
          default:
            return undefined;
        }
      };

      const mapGeography = (value: string) => {
        switch (value) {
          case 'us':
            return 'US';
          case 'eu':
            return 'EU';
          case 'uk':
            return 'UK';
          case 'apac':
            return 'APAC';
          case 'global':
            return 'GLOBAL';
          default:
            return undefined;
        }
      };

      // Map geography to 2-letter country code for CREATE operation
      const mapGeographyToCountry = (value: string): string => {
        switch (value) {
          case 'us':
            return 'US';
          case 'uk':
            return 'GB'; // United Kingdom
          case 'eu':
            return 'DE'; // Default to Germany for EU
          case 'apac':
            return 'SG'; // Default to Singapore for APAC
          case 'global':
            return 'US'; // Default to US for Global
          default:
            return 'US'; // Fallback to US
        }
      };

      if (isAnonymous) {
        // Anonymous mode - use anonymous API
        const anonymousProfileData = {
          name: formData.companyName,
          industry: formData.industry,
          size: formData.companySize?.toUpperCase() as
            | 'STARTUP'
            | 'SMB'
            | 'MIDMARKET'
            | 'ENTERPRISE',
          description: formData.description,
          website: formData.companyWebsite,
          annualRevenue: mapAnnualRevenue(formData.annualRevenue) as
            | 'UNDER_1M'
            | 'FROM_1M_10M'
            | 'FROM_10M_100M'
            | 'OVER_100M',
          complianceTeamSize: mapComplianceTeamSize(formData.complianceTeamSize) as
            | 'NONE'
            | 'ONE_TWO'
            | 'THREE_TEN'
            | 'OVER_TEN',
          geography: mapGeography(formData.geography) as 'US' | 'EU' | 'UK' | 'APAC' | 'GLOBAL',
          riskAppetite: formData.riskAppetite,
          complianceBudget: formData.complianceBudget,
          financialCrimeRisk: formData.financialCrimeRisk,
          regulatoryRequirements: formData.regulatoryRequirements,
          painPoints: formData.painPoints,
        };

        await updateAnonymousProfileMutation.mutateAsync(anonymousProfileData);
      } else {
        // Authenticated mode - use organization API
        // Map company size to backend enum values
        const mapCompanySize = (value: string): string | undefined => {
          switch (value) {
            case 'startup':
              return 'STARTUP';
            case 'scaleup':
              return 'SMB'; // Map scaleup to SMB
            case 'smb':
              return 'SMB';
            case 'midmarket':
              return 'MIDMARKET';
            case 'enterprise':
              return 'ENTERPRISE';
            default:
              return undefined;
          }
        };

        if (organization?.id) {
          // Update existing organization - use geography field
          const updateData = {
            name: formData.companyName,
            website:
              formData.companyWebsite && formData.companyWebsite.trim()
                ? formData.companyWebsite.startsWith('http')
                  ? formData.companyWebsite.trim()
                  : `https://${formData.companyWebsite.trim()}`
                : undefined,
            industry: formData.industry || undefined,
            size: mapCompanySize(formData.companySize),
            description: formData.description || undefined,
            annualRevenue: mapAnnualRevenue(formData.annualRevenue),
            complianceTeamSize: mapComplianceTeamSize(formData.complianceTeamSize),
            geography: mapGeography(formData.geography),
          };
          updateOrganizationMutation.mutate(updateData);
        } else {
          // Create new organization - needs country field (required)
          const createData = {
            name: formData.companyName,
            website:
              formData.companyWebsite && formData.companyWebsite.trim()
                ? formData.companyWebsite.startsWith('http')
                  ? formData.companyWebsite.trim()
                  : `https://${formData.companyWebsite.trim()}`
                : undefined,
            industry: formData.industry || undefined,
            size: mapCompanySize(formData.companySize),
            country: mapGeographyToCountry(formData.geography), // Required 2-letter country code
            region: undefined, // Optional region field
            description: formData.description || undefined,
          };
          createOrganizationMutation.mutate(createData);
        }
      }
    } catch (error: any) {
      console.error('Error preparing save:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to prepare save operation.',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
      if (onProfileSaving) {
        onProfileSaving(false);
      }
    }
  };

  const assessMaturityLevel = () => {
    let score = 0;
    let recommendedLevel = '';
    let recommendations = [];

    // Enhanced scoring logic focused on Financial Crime risk factors
    if (formData.companySize === 'startup') score += 1;
    else if (formData.companySize === 'scaleup') score += 2;
    else if (formData.companySize === 'enterprise') score += 3;

    if (formData.annualRevenue === 'under-1m') score += 1;
    else if (formData.annualRevenue === '1m-10m') score += 2;
    else if (formData.annualRevenue === '10m-100m') score += 3;
    else if (formData.annualRevenue === 'over-100m') score += 4;

    if (formData.complianceTeamSize === 'none') score += 0;
    else if (formData.complianceTeamSize === '1-2') score += 1;
    else if (formData.complianceTeamSize === '3-10') score += 2;
    else if (formData.complianceTeamSize === 'over-10') score += 3;

    // Financial Crime Risk scoring
    if (formData.financialCrimeRisk === 'high') score += 2;
    else if (formData.financialCrimeRisk === 'medium') score += 1;

    // Determine comprehensive maturity level and recommendations
    if (score <= 4) {
      recommendedLevel = 'Basic Compliance (Startup Level)';
      recommendations = [
        'Implement basic KYC procedures and customer screening',
        'Establish foundational transaction monitoring',
        'Create compliance policies framework',
        'Set up regulatory reporting processes',
      ];
    } else if (score <= 8) {
      recommendedLevel = 'Intermediate Compliance (Scale-up Level)';
      recommendations = [
        'Enhanced due diligence and risk-based customer screening',
        'Automated transaction monitoring with rule optimization',
        'Advanced sanctions screening and name matching',
        'Real-time regulatory reporting capabilities',
        'Compliance training and awareness programs',
      ];
    } else {
      recommendedLevel = 'Advanced Compliance (Enterprise Level)';
      recommendations = [
        'AI-powered transaction monitoring and anomaly detection',
        'Integrated GRC platform with real-time dashboards',
        'Predictive compliance risk analytics',
        'Automated regulatory change management',
        'Board-level compliance reporting and governance',
      ];
    }

    setMaturityAssessment({
      score,
      level: recommendedLevel,
      recommendations,
    });

    toast({
      title: 'Maturity Assessment Complete',
      description: `Your recommended compliance level: ${recommendedLevel}`,
    });
  };

  // Loading component
  const LoadingProfile = () => (
    <Card className="bg-gray-900/50 border-gray-800 transition-all duration-500">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg bg-gray-800" />
            <div>
              <Skeleton className="h-6 w-48 mb-1 bg-gray-800" />
              <Skeleton className="h-4 w-32 bg-gray-800" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 bg-gray-800" />
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-6 w-6 rounded-md mt-0.5 bg-gray-800" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1 bg-gray-800" />
                <Skeleton className="h-4 w-32 bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Error component
  const ErrorProfile = () => (
    <Card className="bg-gray-900/50 border-gray-800 transition-all duration-500">
      <CardContent className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
          <div>
            <p className="text-lg font-medium text-white">Failed to Load Profile</p>
            <p className="text-sm text-gray-400 mt-1">Please try refreshing the page</p>
          </div>
          <Button
            onClick={() => refetch()}
            className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
            data-testid="button-retry-profile"
          >
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Profile display component for view mode
  const ProfileDisplay = () => (
    <Card className="bg-gray-800/80 border-gray-700 transition-all duration-500 hover:border-cyan-600/50 group shadow-lg">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
              <Building2 className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">
                {organization?.name || formData.companyName || 'Your Company'}
              </CardTitle>
              <CardDescription className="text-sm text-gray-300">Business Profile</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 border-gray-600 text-white transition-colors"
            data-testid="button-edit-profile"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Company Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3 group/item min-w-0">
            <div className="p-1.5 bg-green-500/20 rounded-md mt-0.5 transition-colors group-hover/item:bg-green-500/30 flex-shrink-0">
              <Globe className="h-4 w-4 text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 mb-1">Website</p>
              <p className="text-sm text-gray-300 font-medium break-all">
                {formData.companyWebsite || 'Not provided'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 group/item min-w-0">
            <div className="p-1.5 bg-purple-500/20 rounded-md mt-0.5 transition-colors group-hover/item:bg-purple-500/30 flex-shrink-0">
              <Briefcase className="h-4 w-4 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 mb-1">Industry</p>
              <p className="text-sm text-gray-300 font-medium break-words">
                {formData.industry
                  ? formData.industry.charAt(0).toUpperCase() + formData.industry.slice(1)
                  : 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 group/item min-w-0">
            <div className="p-1.5 bg-orange-500/20 rounded-md mt-0.5 transition-colors group-hover/item:bg-orange-500/30 flex-shrink-0">
              <Users className="h-4 w-4 text-orange-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 mb-1">Company Size</p>
              <p className="text-sm text-gray-300 font-medium break-words">
                {formData.companySize
                  ? formData.companySize.charAt(0).toUpperCase() + formData.companySize.slice(1)
                  : 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 group/item min-w-0">
            <div className="p-1.5 bg-red-500/20 rounded-md mt-0.5 transition-colors group-hover/item:bg-red-500/30 flex-shrink-0">
              <MapPin className="h-4 w-4 text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 mb-1">Geography</p>
              <p className="text-sm text-gray-300 font-medium break-words">
                {formData.geography
                  ? formData.geography === 'uk'
                    ? 'UK'
                    : formData.geography === 'us'
                      ? 'US'
                      : formData.geography === 'eu'
                        ? 'EU'
                        : formData.geography.charAt(0).toUpperCase() + formData.geography.slice(1)
                  : 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 group/item min-w-0">
            <div className="p-1.5 bg-blue-500/20 rounded-md mt-0.5 transition-colors group-hover/item:bg-blue-500/30 flex-shrink-0">
              <DollarSign className="h-4 w-4 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 mb-1">Annual Revenue</p>
              <p className="text-sm text-gray-300 font-medium break-words">
                {formData.annualRevenue || 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 group/item min-w-0">
            <div className="p-1.5 bg-yellow-500/20 rounded-md mt-0.5 transition-colors group-hover/item:bg-yellow-500/30 flex-shrink-0">
              <Users className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 mb-1">Team Size</p>
              <p className="text-sm text-gray-300 font-medium break-words">
                {formData.complianceTeamSize || 'Not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {formData.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-200 mb-2">Description</h4>
            <p className="text-sm text-gray-300 leading-relaxed font-medium">
              {formData.description}
            </p>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="border-t border-gray-600 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm font-medium text-gray-200">Profile Complete</span>
            </div>
            <Badge className="bg-green-500/30 text-green-300 border border-green-500/40 font-medium">
              Ready for Assessment
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Compute derived values
  const hasProfile = isAnonymous ? !!anonymousProfile?.profile : !!organization;

  return (
    <div className="space-y-6">
      {hasProfile && !isEditing ? (
        <ProfileDisplay />
      ) : (
        <Card className="bg-gray-900/50 border-gray-800 transition-all duration-500 hover:border-cyan-600/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-400" />
              <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                {hasProfile ? 'Edit Business Profile' : 'Business Profile Setup'}
              </span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              {hasProfile
                ? 'Update your organization details'
                : 'Tell us about your organization to receive tailored compliance recommendations'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  data-testid="input-company-name"
                  value={formData.companyName}
                  onChange={e => handleInputChange('companyName', e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={value => handleInputChange('industry', value)}
                >
                  <SelectTrigger id="industry" data-testid="select-industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fintech">Fintech</SelectItem>
                    <SelectItem value="banking">Banking</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    <SelectItem value="payments">Payments</SelectItem>
                    <SelectItem value="lending">Lending</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size *</Label>
                <Select
                  value={formData.companySize}
                  onValueChange={value => handleInputChange('companySize', value)}
                >
                  <SelectTrigger id="companySize" data-testid="select-company-size">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup (1-50)</SelectItem>
                    <SelectItem value="smb">SMB (51-500)</SelectItem>
                    <SelectItem value="midmarket">Mid-Market (501-5000)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (5000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualRevenue">Annual Revenue</Label>
                <Select
                  value={formData.annualRevenue}
                  onValueChange={value => handleInputChange('annualRevenue', value)}
                >
                  <SelectTrigger id="annualRevenue" data-testid="select-revenue">
                    <SelectValue placeholder="Select revenue range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-1m">Under $1M</SelectItem>
                    <SelectItem value="1m-10m">$1M - $10M</SelectItem>
                    <SelectItem value="10m-100m">$10M - $100M</SelectItem>
                    <SelectItem value="over-100m">Over $100M</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geography">Geography *</Label>
                <Select
                  value={formData.geography}
                  onValueChange={value => handleInputChange('geography', value)}
                >
                  <SelectTrigger id="geography" data-testid="select-geography">
                    <SelectValue placeholder="Select primary region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="eu">European Union</SelectItem>
                    <SelectItem value="apac">Asia Pacific</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complianceTeamSize">Compliance Team Size</Label>
                <Select
                  value={formData.complianceTeamSize}
                  onValueChange={value => handleInputChange('complianceTeamSize', value)}
                >
                  <SelectTrigger id="complianceTeamSize" data-testid="select-team-size">
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No dedicated team</SelectItem>
                    <SelectItem value="1-2">1-2 people</SelectItem>
                    <SelectItem value="3-10">3-10 people</SelectItem>
                    <SelectItem value="over-10">Over 10 people</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyWebsite" className="text-gray-300">
                Company Website
              </Label>
              <div className="flex gap-2">
                <Input
                  id="companyWebsite"
                  data-testid="input-website"
                  type="url"
                  value={formData.companyWebsite}
                  onChange={e => handleInputChange('companyWebsite', e.target.value)}
                  placeholder="https://www.yourcompany.com"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-600 transition-colors"
                />
                <Button
                  onClick={analyzeWebsite}
                  disabled={isExtracting || !formData.companyWebsite}
                  variant="outline"
                  data-testid="button-analyze-website"
                  title="Analyze website with AI to auto-fill profile fields"
                >
                  {isExtracting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4" />
                  )}
                  {isExtracting ? 'Analyzing...' : 'Analyze'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                data-testid="textarea-description"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Describe your business model, products, and services..."
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              {hasProfile && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={savingProfile}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
              <Button
                onClick={saveBusinessProfile}
                disabled={savingProfile || !formData.companyName || !formData.industry}
                data-testid="button-save-profile"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {hasProfile ? 'Update Profile' : 'Save Profile'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional sections - Only show in edit mode or when no profile exists */}
      {(isEditing || !hasProfile) && (
        <>
          {/* Maturity Assessment Results */}
          {maturityAssessment && (
            <Card className="bg-gray-900/50 border-gray-800 transition-all duration-500 hover:border-cyan-600/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                    Compliance Maturity Assessment
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Based on your profile, here's your recommended compliance approach
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-lg border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-400">Maturity Score</span>
                    <Badge className="text-lg px-3 py-1 bg-green-500/20 text-green-400 border-green-500/30">
                      {maturityAssessment.score}/15
                    </Badge>
                  </div>
                  <p className="font-semibold text-white mb-1">{maturityAssessment.level}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Recommended Actions</Label>
                  <ul className="space-y-2">
                    {maturityAssessment.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Website Analysis Results */}
          {websiteAnalysis && (
            <Card className="bg-gray-900/50 border-gray-800 transition-all duration-500 hover:border-cyan-600/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-cyan-400" />
                  <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                    Website Analysis Insights
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Extracted compliance information from your website
                </CardDescription>
              </CardHeader>
              <CardContent>
                {websiteAnalysis.gaps && websiteAnalysis.gaps.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Identified Compliance Gaps</Label>
                    <div className="space-y-2">
                      {websiteAnalysis.gaps.map((gap, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                        >
                          <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                          <span className="text-sm text-gray-300">{gap}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Navigation Buttons - Only show if not hideButtons */}
      {!hideButtons && (
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex justify-between items-center">
            {/* Back Button */}
            {onPreviousStep && (
              <Button
                variant="outline"
                onClick={onPreviousStep}
                className="flex items-center gap-2 text-gray-300 border-gray-700 hover:bg-gray-800"
                data-testid="button-previous-step"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}

            {/* Spacer when no back button */}
            {!onPreviousStep && <div></div>}

            {/* Continue Button - Only show when profile exists */}
            {organization?.id && onNextStep && (
              <Button
                size="lg"
                onClick={() => {
                  // Notify parent component that profile is complete before advancing
                  onProfileComplete(formData);
                  onNextStep();
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-8 py-3 shadow-lg"
                data-testid="button-continue-assessment"
              >
                Continue to Risk Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Status Messages */}
          {!organization?.id && (
            <div className="mt-4 text-center">
              <p
                className="text-sm text-yellow-400 flex items-center justify-center gap-2"
                data-testid="text-status-profile-required"
              >
                <AlertTriangle className="h-4 w-4" />
                Save your business profile to continue
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Main return statement with loading states
  if (isLoading) {
    return <LoadingProfile />;
  }

  if (error) {
    return <ErrorProfile />;
  }

  // Show editing form if explicitly editing or no organization exists
  if (isEditing || !organization) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-900/50 border-gray-800 transition-all duration-500 hover:border-cyan-600/50" data-tour="business-profile-form">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Building2 className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                  {organization ? 'Edit Business Profile' : 'Create Business Profile'}
                </CardTitle>
                <CardDescription className="text-sm text-gray-400">
                  {organization ? 'Update your company information' : 'Tell us about your company'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Company Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-300">
                  Company Name *
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={e => handleInputChange('companyName', e.target.value)}
                  placeholder="Enter your company name"
                  className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-600 transition-colors"
                  data-testid="input-company-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyWebsite" className="text-sm font-medium text-gray-300">
                  Company Website
                </Label>
                <div className="flex">
                  <Input
                    id="companyWebsite"
                    value={formData.companyWebsite}
                    onChange={e => handleInputChange('companyWebsite', e.target.value)}
                    placeholder="www.example.com"
                    className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-600 transition-colors"
                    data-testid="input-company-website"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={analyzeWebsite}
                    disabled={isExtracting || !formData.companyWebsite}
                    className="ml-2 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border-gray-700 text-white transition-colors"
                    data-testid="button-analyze-website"
                    title="Analyze website with AI to auto-fill profile fields"
                  >
                    {isExtracting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link className="h-4 w-4" />
                    )}
                    {isExtracting ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Core Business Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-sm font-medium text-gray-300">
                  Industry
                </Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={e => handleInputChange('industry', e.target.value)}
                  placeholder="e.g., Financial Services"
                  className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-600 transition-colors"
                  data-testid="input-industry"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize" className="text-sm font-medium text-gray-300">
                  Company Size
                </Label>
                <Select
                  value={formData.companySize}
                  onValueChange={value => handleInputChange('companySize', value)}
                >
                  <SelectTrigger
                    data-testid="select-company-size"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 focus:border-cyan-600 transition-colors"
                  >
                    <SelectValue placeholder="Select company size" className="text-gray-500" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="startup" className="text-gray-300 hover:bg-gray-700">
                      Startup (1-50 employees)
                    </SelectItem>
                    <SelectItem value="scaleup" className="text-gray-300 hover:bg-gray-700">
                      Scale-up (51-250 employees)
                    </SelectItem>
                    <SelectItem value="enterprise" className="text-gray-300 hover:bg-gray-700">
                      Enterprise (250+ employees)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geography" className="text-sm font-medium text-gray-300">
                  Geography *
                </Label>
                <Select
                  value={formData.geography}
                  onValueChange={value => handleInputChange('geography', value)}
                >
                  <SelectTrigger
                    data-testid="select-geography"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 focus:border-cyan-600 transition-colors"
                  >
                    <SelectValue placeholder="Select primary geography" className="text-gray-500" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="us" className="text-gray-300 hover:bg-gray-700">
                      United States
                    </SelectItem>
                    <SelectItem value="eu" className="text-gray-300 hover:bg-gray-700">
                      European Union
                    </SelectItem>
                    <SelectItem value="uk" className="text-gray-300 hover:bg-gray-700">
                      United Kingdom
                    </SelectItem>
                    <SelectItem value="apac" className="text-gray-300 hover:bg-gray-700">
                      Asia-Pacific
                    </SelectItem>
                    <SelectItem value="global" className="text-gray-300 hover:bg-gray-700">
                      Global
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Business Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="annualRevenue" className="text-sm font-medium text-gray-300">
                  Annual Revenue
                </Label>
                <Select
                  value={formData.annualRevenue}
                  onValueChange={value => handleInputChange('annualRevenue', value)}
                >
                  <SelectTrigger
                    data-testid="select-annual-revenue"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 focus:border-cyan-600 transition-colors"
                  >
                    <SelectValue
                      placeholder="Select annual revenue range"
                      className="text-gray-500"
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="under-1m" className="text-gray-300 hover:bg-gray-700">
                      Under $1M
                    </SelectItem>
                    <SelectItem value="1m-10m" className="text-gray-300 hover:bg-gray-700">
                      $1M - $10M
                    </SelectItem>
                    <SelectItem value="10m-100m" className="text-gray-300 hover:bg-gray-700">
                      $10M - $100M
                    </SelectItem>
                    <SelectItem value="over-100m" className="text-gray-300 hover:bg-gray-700">
                      Over $100M
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complianceTeamSize" className="text-sm font-medium text-gray-300">
                  Compliance Team Size
                </Label>
                <Select
                  value={formData.complianceTeamSize}
                  onValueChange={value => handleInputChange('complianceTeamSize', value)}
                >
                  <SelectTrigger
                    data-testid="select-compliance-team-size"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 focus:border-cyan-600 transition-colors"
                  >
                    <SelectValue placeholder="Select team size" className="text-gray-500" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="none" className="text-gray-300 hover:bg-gray-700">
                      No dedicated team
                    </SelectItem>
                    <SelectItem value="1-2" className="text-gray-300 hover:bg-gray-700">
                      1-2 people
                    </SelectItem>
                    <SelectItem value="3-10" className="text-gray-300 hover:bg-gray-700">
                      3-10 people
                    </SelectItem>
                    <SelectItem value="over-10" className="text-gray-300 hover:bg-gray-700">
                      10+ people
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-300">
                Company Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Briefly describe your company and its business activities..."
                className="min-h-[100px] w-full resize-none bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-600 transition-colors"
                data-testid="textarea-description"
              />
            </div>

            {/* Proceed Button */}
            <div className="flex justify-center pt-6 border-t border-gray-700">
              <Button
                onClick={async () => {
                  await saveBusinessProfile();
                  if (onNextStep) {
                    onNextStep();
                  }
                }}
                disabled={
                  savingProfile ||
                  updateOrganizationMutation.isPending ||
                  createOrganizationMutation.isPending ||
                  !formData.companyName ||
                  !formData.geography
                }
                className="flex items-center gap-2 px-6 py-3 text-base font-medium bg-cyan-500 hover:bg-cyan-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                data-testid="button-proceed-business-profile"
                data-tour="save-profile-button"
              >
                {savingProfile ||
                updateOrganizationMutation.isPending ||
                createOrganizationMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-5 w-5" />
                    Proceed to Next Step
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show profile display (view mode) - simplified for assessment journey
  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg transition-all duration-500">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Building2 className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                Business Profile
              </h3>
              <p className="text-sm text-gray-400">Your company information</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Company Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3 group/item">
              <div className="p-1.5 bg-green-500/20 rounded-md mt-0.5 transition-colors group-hover/item:bg-green-500/30">
                <Globe className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Website</p>
                <p className="text-sm text-gray-400">
                  {formData.companyWebsite || organization?.website || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 group/item">
              <div className="p-1.5 bg-purple-500/20 rounded-md mt-0.5 transition-colors group-hover/item:bg-purple-500/30">
                <Briefcase className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Industry</p>
                <p className="text-sm text-gray-400">
                  {formData.industry
                    ? formData.industry.charAt(0).toUpperCase() + formData.industry.slice(1)
                    : organization?.industry
                      ? organization.industry.charAt(0).toUpperCase() +
                        organization.industry.slice(1)
                      : 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 group/item">
              <div className="p-1.5 bg-blue-500/20 rounded-md mt-0.5 transition-colors group-hover/item:bg-blue-500/30">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Company Size</p>
                <p className="text-sm text-gray-400">
                  {formData.companySize
                    ? formData.companySize.charAt(0).toUpperCase() + formData.companySize.slice(1)
                    : 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Proceed Button */}
          <div className="flex justify-center pt-4 border-t border-gray-700">
            <Button
              onClick={() => {
                if (onNextStep) {
                  onNextStep();
                }
              }}
              className="flex items-center gap-2 px-6 py-3 text-base font-medium bg-cyan-500 hover:bg-cyan-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl"
              data-testid="button-proceed-business-profile-view"
            >
              <ArrowRight className="h-5 w-5" />
              Proceed to Next Step
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;
