import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Star,
  Users,
  DollarSign,
  Shield,
  Search,
  Filter,
  ArrowRight,
  CheckCircle,
  Loader2,
  Target,
  TrendingUp,
  Calendar,
  FileText,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import VendorProfile from './VendorProfile';
import VendorComparison from './VendorComparison';
import { assessmentApi, queryKeys } from '@/lib/api';
import type { VendorMatchScore } from '@/types/vendor-matching.types';
import { getMatchQuality, getMatchQualityColor } from '@/types/vendor-matching.types';

interface VendorMarketplaceProps {
  businessProfile: any;
  riskData: any;
  selectedVendors: any[];
  onVendorSelect: (vendors: any[]) => void;
  onNavigateToCompare?: () => void;
  assessmentId?: string;
}

const VendorMarketplace: React.FC<VendorMarketplaceProps> = ({
  businessProfile,
  riskData,
  selectedVendors,
  onVendorSelect,
  onNavigateToCompare,
  assessmentId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState(assessmentId || 'all');
  const [selectedVendorProfile, setSelectedVendorProfile] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch user's completed assessments for filter dropdown
  const { data: assessments } = useQuery({
    queryKey: queryKeys.assessments,
    queryFn: assessmentApi.getAssessments,
  });

  // Filter to only show completed assessments
  const completedAssessments = useMemo(() => {
    return assessments?.filter(a => a.status === 'COMPLETED') || [];
  }, [assessments]);

  // Fetch vendors from API
  const {
    data: vendorsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'vendors',
      {
        search: searchTerm || undefined,
        page: 1,
        limit: 50,
        sortBy: 'featured',
        sortOrder: 'desc',
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', '1');
      params.append('limit', '50');
      params.append('sortBy', 'featured');
      params.append('sortOrder', 'desc');

      const token = localStorage.getItem('authToken');
      const response = await fetch(`/v1/vendors?${params}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      return response.json();
    },
  });

  // Fetch vendor matches for the selected assessment
  const selectedAssessmentId = assessmentFilter === 'all' ? assessmentId : assessmentFilter;
  const {
    data: vendorMatchesResponse,
    isLoading: isLoadingMatches,
    error: matchesError,
  } = useQuery({
    queryKey: queryKeys.vendorMatches(selectedAssessmentId!, 0),
    queryFn: () => assessmentApi.getVendorMatches(selectedAssessmentId!, 0, 50),
    enabled: !!selectedAssessmentId && selectedAssessmentId !== 'all',
    retry: false, // Don't retry if priorities questionnaire not completed
  });

  // Create a map of vendor ID to match score for quick lookup
  const vendorMatchScores = useMemo(() => {
    if (!vendorMatchesResponse?.data?.matches) return new Map<string, VendorMatchScore>();

    const scoreMap = new Map<string, VendorMatchScore>();
    vendorMatchesResponse.data.matches.forEach(match => {
      scoreMap.set(match.vendor.id, match);
    });
    return scoreMap;
  }, [vendorMatchesResponse]);

  // Transform API data to match frontend expectations with fallback demo data
  const vendors =
    vendorsResponse?.data?.map((vendor: any) => {
      // Map backend categories to frontend-friendly names
      const categoryMap: Record<string, string> = {
        KYC_AML: 'KYC & AML',
        TRANSACTION_MONITORING: 'Transaction Monitoring',
        SANCTIONS_SCREENING: 'Sanctions Screening',
        TRADE_SURVEILLANCE: 'Trade Surveillance',
        RISK_ASSESSMENT: 'Risk Assessment',
        COMPLIANCE_TRAINING: 'Compliance Training',
        REGULATORY_REPORTING: 'Regulatory Reporting',
        DATA_GOVERNANCE: 'Data Governance',
      };

      // Get match score if available
      const matchScore = vendorMatchScores.get(vendor.id);

      return {
        id: vendor.id,
        name: vendor.companyName,
        categories: vendor.categories?.map((cat: string) => categoryMap[cat] || cat) || [],
        description:
          vendor.benefitsSnapshot ||
          vendor.primaryProducts ||
          'Leading compliance technology provider',
        shortDescription:
          vendor.benefitsSnapshot?.substring(0, 150) ||
          vendor.primaryProducts?.substring(0, 150) ||
          '',
        logoUrl: vendor.logoUrl || vendor.logo || null,
        rating: vendor.rating || null,
        reviewCount: vendor.reviewCount || 0,
        website: vendor.website,
        headquarters: vendor.headquarters,
        primaryProducts: vendor.primaryProducts,
        aiCapabilities: vendor.aiCapabilities,
        deploymentOptions: vendor.deploymentOptions,
        integrations: vendor.integrations,
        dataCoverage: vendor.dataCoverage,
        awards: vendor.awards,
        customerSegments: vendor.customerSegments,
        benefitsSnapshot: vendor.benefitsSnapshot,
        maturityAssessment: vendor.maturityAssessment,
        featured: vendor.featured || false,
        verified: vendor.verified || false,
        status: vendor.status,
        // Add match score data (Story 1.27)
        matchScore: matchScore ? matchScore.totalScore : undefined,
        matchDetails: matchScore,
      };
    }) ||
    [
      // Empty array when no real data is available
    ];

  // Use vendors directly without filtering
  let filteredVendors = vendors;

  // Sort by match score when an assessment is selected
  if (selectedAssessmentId && selectedAssessmentId !== 'all' && vendorMatchScores.size > 0) {
    filteredVendors = [...filteredVendors].sort((a, b) => {
      const scoreA = a.matchScore || 0;
      const scoreB = b.matchScore || 0;
      return scoreB - scoreA; // Descending order
    });
  }

  const handleVendorToggle = (vendor: any) => {
    const isSelected = selectedVendors.some(v => v.id === vendor.id);
    if (isSelected) {
      onVendorSelect(selectedVendors.filter(v => v.id !== vendor.id));
    } else {
      const newSelectedVendors = [...selectedVendors, vendor];
      onVendorSelect(newSelectedVendors);

      // Scroll to top when second vendor is selected
      if (newSelectedVendors.length === 2) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast({
          title: 'Ready to Compare!',
          description: `You can now compare ${newSelectedVendors[0].name} and ${vendor.name}.`,
        });
      } else {
        toast({
          title: 'Vendor Added',
          description: `${vendor.name} has been added to your comparison list.`,
        });
      }
    }
  };

  const handleCompareSelected = () => {
    if (selectedVendors.length === 2) {
      setShowComparison(true);
    }
  };

  const handleBackFromComparison = () => {
    setShowComparison(false);
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-500/10 text-blue-300 border-blue-500/30',
      'bg-purple-500/10 text-purple-300 border-purple-500/30',
      'bg-green-500/10 text-green-300 border-green-500/30',
      'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
      'bg-pink-500/10 text-pink-300 border-pink-500/30',
    ];
    return colors[index % colors.length];
  };

  const handleViewDetails = (vendor: any) => {
    setSelectedVendorProfile(vendor);
  };

  const handleBackToMarketplace = () => {
    setSelectedVendorProfile(null);
  };

  // If comparison view is active, show the comparison component
  if (showComparison && selectedVendors.length === 2) {
    return <VendorComparison vendors={selectedVendors} onBack={handleBackFromComparison} />;
  }

  // If a vendor profile is selected, show the profile view
  if (selectedVendorProfile) {
    return (
      <VendorProfile
        vendor={selectedVendorProfile}
        onBack={handleBackToMarketplace}
        onSelect={
          onVendorSelect
            ? vendor => {
                const isSelected = selectedVendors.some(v => v.id === vendor.id);
                if (isSelected) {
                  onVendorSelect(selectedVendors.filter(v => v.id !== vendor.id));
                } else {
                  onVendorSelect([...selectedVendors, vendor]);
                  toast({
                    title: 'Vendor Added',
                    description: `${vendor.name} has been added to your comparison list.`,
                  });
                }
              }
            : undefined
        }
        isSelected={selectedVendors.some(v => v.id === selectedVendorProfile.id)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Assessment Match Banner (Story 1.27) */}
      {assessmentId && vendorMatchScores.size > 0 && (
        <Card className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border-cyan-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-cyan-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Viewing Matched Vendors for Your Assessment
                </h3>
                <p className="text-gray-300 text-sm">
                  Found {vendorMatchScores.size} vendors matched to your compliance gaps. Vendors
                  are sorted by match score (base compatibility + priority boost).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error loading matches */}
      {assessmentId && matchesError && (
        <Card className="bg-yellow-900/20 border-yellow-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-yellow-400" />
              <p className="text-yellow-200 text-sm">
                Unable to load vendor matches. Make sure you've completed the priorities
                questionnaire.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment-specific vendor matches message */}
      {selectedAssessmentId && selectedAssessmentId !== 'all' && vendorMatchesResponse && (
        <Card className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-400" />
              <p className="text-cyan-200">
                Showing vendor matches for <span className="font-semibold">
                  {completedAssessments.find(a => a.id === selectedAssessmentId)?.template?.name}
                </span> assessment - vendors are ranked by compliance fit
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Search and assessment filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                  <Input
                    placeholder="Search vendors..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4 pointer-events-none z-10" />
                <Select value={assessmentFilter} onValueChange={setAssessmentFilter}>
                  <SelectTrigger className="w-full md:w-96 pl-10">
                    <SelectValue placeholder="Filter by Assessment">
                      {assessmentFilter === 'all'
                        ? 'All Vendors'
                        : completedAssessments.find(a => a.id === assessmentFilter)?.template?.name || 'Select Assessment'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>All Vendors</span>
                      </div>
                    </SelectItem>
                    {completedAssessments.length === 0 ? (
                      <SelectItem value="none" disabled>
                        <span className="text-muted-foreground">No completed assessments yet</span>
                      </SelectItem>
                    ) : (
                      completedAssessments.map((assessment) => (
                        <SelectItem key={assessment.id} value={assessment.id}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="font-medium">{assessment.template?.name || 'Assessment'}</span>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span className="text-sm">
                                {new Date(assessment.completedAt || assessment.updatedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Compare Button (shows when exactly 2 vendors selected) */}
      {selectedVendors.length === 2 && (
        <div className="relative w-full group overflow-hidden rounded-lg">
          {/* Shimmer animation container - pointer-events-none allows clicks to pass through */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-pink-500 to-cyan-500 rounded-lg opacity-75 blur-sm animate-shimmer bg-size-200 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* Actual button */}
          <Button
            onClick={handleCompareSelected}
            className="relative w-full bg-cyan-600 hover:bg-cyan-700 text-white py-6 text-lg font-semibold transition-all duration-300"
            data-testid="button-compare-selected"
          >
            Compare Selected Vendors ({selectedVendors.length})
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 text-primary mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-white mb-2">Loading vendors...</h3>
            <p className="text-gray-300">Finding the best compliance solutions for you.</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-600 mb-2">⚠️ Error Loading Vendors</div>
              <p className="text-red-800 mb-4">
                {error?.message || 'Unable to load vendor data. Please try again.'}
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor Grid */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredVendors.map((vendor, index) => {
            const isSelected = selectedVendors.some(v => v.id === vendor.id);
            const hasMatchScore = vendor.matchScore !== undefined;
            const isTopMatch = hasMatchScore && index < 3 && selectedAssessmentId && selectedAssessmentId !== 'all'; // Top 3 matches for selected assessment

            return (
              <Card
                key={vendor.id}
                className={`relative transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-gradient-to-br from-card/90 to-card/60 backdrop-blur overflow-hidden ${
                  isSelected ? 'ring-2 ring-cyan-400 shadow-cyan-500/20' : ''
                } ${
                  isTopMatch
                    ? 'border-2 border-cyan-500/50 shadow-cyan-500/30'
                    : 'border-cyan-500/20'
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-3 right-3 z-20">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleVendorToggle(vendor)}
                    className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    data-testid={`checkbox-vendor-${vendor.id}`}
                  />
                </div>

                {/* Featured/Verified/Match Badges */}
                <div className="absolute top-3 left-3 right-16 flex flex-wrap gap-1.5 z-10">
                  {vendor.featured && (
                    <Badge className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-200 border-yellow-500/30 text-xs">
                      ⭐ Featured
                    </Badge>
                  )}
                  {vendor.verified && (
                    <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-200 border-green-500/30 text-xs">
                      ✓ Verified
                    </Badge>
                  )}

                  {/* Match Score Badge with Tooltip (Story 1.27) */}
                  {hasMatchScore && vendor.matchDetails && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className="bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-200 border-cyan-500/50 font-bold cursor-help text-xs">
                              <Target className="h-3 w-3 mr-1" />
                              {vendor.matchScore.toFixed(0)}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="bg-gray-900 border-cyan-800 p-3 max-w-xs"
                          >
                            <div className="space-y-2 text-xs">
                              <div className="font-semibold text-cyan-300 border-b border-cyan-800 pb-1">
                                Match Score Breakdown
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-gray-400">Base Score:</span>
                                  <span className="text-white font-medium ml-1">
                                    {vendor.matchDetails.baseScore.totalBase.toFixed(0)}/100
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Priority Boost:</span>
                                  <span className="text-purple-300 font-medium ml-1">
                                    +{vendor.matchDetails.priorityBoost.totalBoost.toFixed(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="pt-1 border-t border-cyan-800">
                                <span className="text-gray-400">Total:</span>
                                <span className="text-cyan-300 font-bold ml-1">
                                  {vendor.matchScore.toFixed(0)}/140
                                </span>
                              </div>
                              {vendor.matchDetails.gapsCovered > 0 && (
                                <div className="text-gray-400 pt-1">
                                  Covers {vendor.matchDetails.gapsCovered}{' '}
                                  {vendor.matchDetails.gapsCovered === 1 ? 'gap' : 'gaps'}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Match Quality Label (Story 1.27) */}
                      <Badge className={`${getMatchQualityColor(vendor.matchScore)} text-xs`}>
                        {getMatchQuality(vendor.matchScore)}
                      </Badge>

                      {isTopMatch && (
                        <Badge className="bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-pink-200 border-pink-500/50 animate-pulse text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Top {index + 1}
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                <CardHeader className="pt-12 pb-3">
                  <div className="flex items-start space-x-4">
                    {/* Company Logo/Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center text-2xl font-bold text-white border border-cyan-500/30">
                        {vendor.logoUrl ? (
                          <img
                            src={vendor.logoUrl}
                            alt={vendor.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          vendor.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                        {vendor.name}
                      </CardTitle>

                      {/* Categories */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {vendor.categories.slice(0, 3).map((category, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className={`text-xs border ${getCategoryColor(idx)}`}
                          >
                            {category}
                          </Badge>
                        ))}
                        {vendor.categories.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-xs border-gray-500/30 text-gray-400"
                          >
                            +{vendor.categories.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  <div className="text-sm text-gray-300 leading-relaxed line-clamp-3">
                    {vendor.shortDescription || vendor.description}
                  </div>

                  {/* Key Information */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Rating */}
                    {vendor.rating && (
                      <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/5">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold text-white">
                          {vendor.rating.toFixed(1)}
                        </span>
                        {vendor.reviewCount > 0 && (
                          <span className="text-xs text-gray-400">({vendor.reviewCount})</span>
                        )}
                      </div>
                    )}

                    {/* Website */}
                    {vendor.website && (
                      <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/5">
                        <Shield className="h-4 w-4 text-cyan-400" />
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-300 hover:text-cyan-200 truncate"
                          onClick={e => e.stopPropagation()}
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Marketing Information */}
                  <div className="space-y-2">
                    {vendor.headquarters && (
                      <div className="flex items-center space-x-2 text-xs text-gray-300">
                        <Users className="h-3 w-3 text-cyan-300" />
                        <span>Headquarters: {vendor.headquarters}</span>
                      </div>
                    )}
                    {vendor.primaryProducts && (
                      <div className="flex items-start space-x-2 text-xs text-gray-300">
                        <Shield className="h-3 w-3 text-cyan-300 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{vendor.primaryProducts}</span>
                      </div>
                    )}
                    {vendor.aiCapabilities && (
                      <div className="flex items-start space-x-2 text-xs text-gray-300">
                        <Star className="h-3 w-3 text-pink-300 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">AI: {vendor.aiCapabilities}</span>
                      </div>
                    )}
                  </div>

                  {/* Match Score Breakdown (Story 1.27) */}
                  {hasMatchScore && vendor.matchDetails && (
                    <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-800/30 space-y-2">
                      <h4 className="text-xs font-semibold text-cyan-300 uppercase tracking-wide flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        Match Score Breakdown
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col">
                          <span className="text-gray-400">Base Score</span>
                          <span className="text-white font-semibold">
                            {vendor.matchDetails.baseScore.totalBase.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400">Priority Boost</span>
                          <span className="text-purple-300 font-semibold">
                            +{vendor.matchDetails.priorityBoost.totalBoost.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-cyan-800/50">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">Total Match</span>
                          <span className="text-cyan-300 font-bold">
                            {vendor.matchScore.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      {vendor.matchDetails.gapsCovered > 0 && (
                        <div className="text-xs text-gray-400">
                          Covers {vendor.matchDetails.gapsCovered} compliance{' '}
                          {vendor.matchDetails.gapsCovered === 1 ? 'gap' : 'gaps'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contact Action */}
                  <div className="flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-pink-500/10 border border-cyan-500/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10"
                      onClick={e => {
                        e.stopPropagation();
                        handleViewDetails(vendor);
                      }}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      View Vendor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {!isLoading && !isError && filteredVendors.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Filter className="mx-auto h-12 w-12 text-primary mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No vendors found</h3>
            <p className="text-gray-300">
              Try adjusting your search criteria or filters to find more vendors.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorMarketplace;
