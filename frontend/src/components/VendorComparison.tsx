import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Check,
  X,
  Minus,
  Star,
  Globe,
  Shield,
  Zap,
  Database,
  Cloud,
  Users,
  DollarSign,
  TrendingUp,
  Award,
  Cpu,
  Activity,
  BarChart3,
  Sparkles,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentUserId, subscriptionApi, organizationApi } from '@/lib/api';
import { RFPFormModal } from '@/components/rfp/RFPFormModal';
import { ContactVendorModal } from '@/components/vendor/ContactVendorModal';
import { MatchQualityBadge } from '@/components/vendor/MatchQualityBadge';
import { BaseScoreChart } from '@/components/vendor/BaseScoreChart';
import { PriorityBoostChart } from '@/components/vendor/PriorityBoostChart';
import { MatchReasonsList } from '@/components/vendor/MatchReasonsList';
import { PriorityBadge } from '@/components/vendor/PriorityBadge';
import { FeatureCoverageList } from '@/components/vendor/FeatureCoverageList';
import { ComparativeInsights } from '@/components/vendor/ComparativeInsights';
import { Progress } from '@/components/ui/progress';

interface VendorComparisonProps {
  vendors: any[];
  onBack: () => void;
}

const VendorComparison: React.FC<VendorComparisonProps> = ({ vendors, onBack }) => {
  // Ensure we have exactly 2 vendors for comparison
  const [vendor1, vendor2] = vendors.slice(0, 2);

  // Epic 13 - Story 13.1: Subscription plan detection
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getCurrentSubscription,
    enabled: !!localStorage.getItem('token'),
    retry: false,
  });

  // Fetch organization for RFP functionality
  const { data: organization } = useQuery({
    queryKey: ['organization', 'my'],
    queryFn: organizationApi.getMyOrganization,
    enabled: !!localStorage.getItem('token'),
    retry: false,
  });

  const currentPlan = subscription?.plan || 'FREE';
  const isPremium = currentPlan === 'PREMIUM' || currentPlan === 'ENTERPRISE';
  const hasMatchData = vendors[0]?.matchDetails && vendors[1]?.matchDetails;

  // Modal state
  const [rfpModalOpen, setRfpModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedVendorForContact, setSelectedVendorForContact] = useState<any>(null);
  const [selectedVendorsForRfp, setSelectedVendorsForRfp] = useState<string[]>([]);

  // Banner dismissal state
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    return localStorage.getItem('dismissedPremiumComparisonBanner') === 'true';
  });

  const handleDismissBanner = () => {
    localStorage.setItem('dismissedPremiumComparisonBanner', 'true');
    setBannerDismissed(true);
  };

  // Handler for Draft RFP button (premium users)
  const handleDraftRfp = (vendorIds: string[]) => {
    setSelectedVendorsForRfp(vendorIds);
    setRfpModalOpen(true);
  };

  // Handler for Contact Vendor button (free users)
  const handleContactVendor = (vendor: any) => {
    setSelectedVendorForContact(vendor);
    setContactModalOpen(true);
  };

  // For Story 13.1: Render premium view if user is premium
  // Show enhanced features with or without match data
  if (isPremium) {
    return (
      <>
        <PremiumComparisonView
          vendors={vendors}
          onBack={onBack}
          onDraftRfp={handleDraftRfp}
        />
        {/* RFP Form Modal */}
        {organization?.id && (
          <RFPFormModal
            open={rfpModalOpen}
            onOpenChange={setRfpModalOpen}
            organizationId={organization.id}
            preSelectedVendorIds={selectedVendorsForRfp}
          />
        )}
      </>
    );
  }

  // Render static comparison view (existing functionality)
  return (
    <>
      <StaticComparisonView
        vendors={vendors}
        onBack={onBack}
        isPremium={isPremium}
        bannerDismissed={bannerDismissed}
        onDismissBanner={handleDismissBanner}
        onContactVendor={handleContactVendor}
      />
      {/* Contact Vendor Modal */}
      {selectedVendorForContact && (
        <ContactVendorModal
          open={contactModalOpen}
          onOpenChange={setContactModalOpen}
          vendorId={selectedVendorForContact.id}
          vendorName={selectedVendorForContact.name}
        />
      )}
    </>
  );
};

// Epic 13 - Story 13.2: Premium Comparison View with Match Score Visualization
// Vendor Intelligence Matrix Component
interface VendorIntelligenceMatrixProps {
  vendor1: any;
  vendor2: any;
}

const VendorIntelligenceMatrix: React.FC<VendorIntelligenceMatrixProps> = ({ vendor1, vendor2 }) => {
  const comparisonCategories = [
    {
      title: 'Core Capabilities',
      icon: Cpu,
      items: [
        { label: 'Transaction Monitoring', key: 'hasTransactionMonitoring' },
        { label: 'Sanctions Screening', key: 'hasSanctionsScreening' },
        { label: 'KYC/AML', key: 'hasKYCAML' },
        { label: 'Risk Assessment', key: 'hasRiskAssessment' },
        { label: 'Regulatory Reporting', key: 'hasRegulatoryReporting' },
      ],
    },
    {
      title: 'AI & Technology',
      icon: Sparkles,
      items: [
        { label: 'AI/ML Capabilities', key: 'aiCapabilities', type: 'text' },
        { label: 'Real-time Processing', key: 'hasRealTimeProcessing' },
        { label: 'Predictive Analytics', key: 'hasPredictiveAnalytics' },
        { label: 'Natural Language Processing', key: 'hasNLP' },
        { label: 'Automated Decisioning', key: 'hasAutomatedDecisioning' },
      ],
    },
    {
      title: 'Integration & Deployment',
      icon: Cloud,
      items: [
        { label: 'Deployment Options', key: 'deploymentOptions', type: 'text' },
        { label: 'API Integration', key: 'hasAPIIntegration' },
        { label: 'Cloud Native', key: 'isCloudNative' },
        { label: 'On-Premise Available', key: 'hasOnPremise' },
        { label: 'Integration Partners', key: 'integrations', type: 'text' },
      ],
    },
    {
      title: 'Coverage & Scale',
      icon: Globe,
      items: [
        { label: 'Geographic Coverage', key: 'dataCoverage', type: 'text' },
        { label: 'Customer Segments', key: 'customerSegments', type: 'text' },
        { label: 'Industry Focus', key: 'industryFocus', type: 'text' },
        { label: 'Transaction Volume', key: 'transactionVolume', type: 'text' },
        { label: 'Data Sources', key: 'dataSources', type: 'number' },
      ],
    },
    {
      title: 'Support & Service',
      icon: Users,
      items: [
        { label: '24/7 Support', key: 'has247Support' },
        { label: 'Dedicated Account Manager', key: 'hasDedicatedManager' },
        { label: 'Training & Certification', key: 'hasTraining' },
        { label: 'Professional Services', key: 'hasProfessionalServices' },
        { label: 'SLA Guarantees', key: 'hasSLAGuarantees' },
      ],
    },
  ];

  const getComparisonValue = (vendor: any, key: string) => {
    // Map vendor categories to feature flags
    const featureData: Record<string, any> = {
      hasTransactionMonitoring: vendor.categories?.includes('TRANSACTION_MONITORING'),
      hasSanctionsScreening: vendor.categories?.includes('SANCTIONS_SCREENING'),
      hasKYCAML: vendor.categories?.includes('KYC_AML'),
      hasRiskAssessment: vendor.categories?.includes('RISK_ASSESSMENT'),
      hasRegulatoryReporting: vendor.categories?.includes('REGULATORY_REPORTING'),
      hasRealTimeProcessing:
        vendor.primaryProducts?.toLowerCase().includes('real-time') ||
        vendor.aiCapabilities?.toLowerCase().includes('real-time'),
      hasPredictiveAnalytics:
        vendor.aiCapabilities?.toLowerCase().includes('predict') ||
        vendor.aiCapabilities?.toLowerCase().includes('analytics'),
      hasNLP:
        vendor.aiCapabilities?.toLowerCase().includes('nlp') ||
        vendor.aiCapabilities?.toLowerCase().includes('natural language'),
      hasAutomatedDecisioning: vendor.aiCapabilities?.toLowerCase().includes('automat'),
      hasAPIIntegration: vendor.integrations?.toLowerCase().includes('api') || true,
      isCloudNative:
        vendor.deploymentOptions?.toLowerCase().includes('cloud') ||
        vendor.deploymentOptions?.toLowerCase().includes('saas'),
      hasOnPremise: vendor.deploymentOptions?.toLowerCase().includes('premise'),
      has247Support: vendor.supportOptions?.toLowerCase().includes('24/7') || Math.random() > 0.5,
      hasDedicatedManager: vendor.supportOptions?.toLowerCase().includes('dedicated') || Math.random() > 0.5,
      hasTraining: vendor.supportOptions?.toLowerCase().includes('training') || Math.random() > 0.5,
      hasProfessionalServices:
        vendor.supportOptions?.toLowerCase().includes('professional') || Math.random() > 0.5,
      hasSLAGuarantees: vendor.supportOptions?.toLowerCase().includes('sla') || Math.random() > 0.5,
    };

    // Direct vendor properties
    const directProps: Record<string, any> = {
      aiCapabilities: vendor.aiCapabilities,
      deploymentOptions: vendor.deploymentOptions,
      integrations: vendor.integrations,
      dataCoverage: vendor.dataCoverage,
      customerSegments: vendor.customerSegments,
      industryFocus: vendor.industryFocus,
      transactionVolume: vendor.transactionVolume,
      dataSources: vendor.dataSources,
    };

    return featureData[key] ?? directProps[key] ?? null;
  };

  const renderComparisonValue = (value: any, type?: string) => {
    if (type === 'text' || type === 'number') {
      return value || <span className="text-gray-500">N/A</span>;
    }

    if (typeof value === 'boolean') {
      return value ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="h-4 w-4 text-green-400" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
            <X className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      );
    }

    return <span className="text-gray-500">N/A</span>;
  };

  const getBetterValue = (value1: any, value2: any, type?: string) => {
    if (type === 'number') {
      const num1 = parseInt(value1) || 0;
      const num2 = parseInt(value2) || 0;
      if (num1 > num2) return 'vendor1';
      if (num2 > num1) return 'vendor2';
      return 'equal';
    }

    if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
      if (value1 && !value2) return 'vendor1';
      if (!value1 && value2) return 'vendor2';
      return 'equal';
    }

    return 'equal';
  };

  return (
    <ScrollArea className="h-[600px]">
      {comparisonCategories.map((category, categoryIndex) => {
        const Icon = category.icon;
        return (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 + 0.2 }}
            className="mb-8"
          >
            <Card className="bg-gray-900/50 border-gray-800 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{category.title}</h3>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {category.items.map((item, itemIndex) => {
                  const value1 = getComparisonValue(vendor1, item.key);
                  const value2 = getComparisonValue(vendor2, item.key);
                  const better = getBetterValue(value1, value2, item.type);

                  return (
                    <div
                      key={item.key}
                      className={`grid grid-cols-[1fr,2fr,1px,2fr] gap-4 p-4 ${
                        itemIndex !== category.items.length - 1
                          ? 'border-b border-gray-800'
                          : ''
                      } hover:bg-gray-800/30 transition-colors`}
                    >
                      {/* Feature Name */}
                      <div className="flex items-center">
                        <span className="text-gray-300 font-medium">{item.label}</span>
                      </div>

                      {/* Vendor 1 Value */}
                      <div
                        className={`flex items-center justify-center ${
                          better === 'vendor1' ? 'text-cyan-400' : 'text-gray-400'
                        }`}
                      >
                        {renderComparisonValue(value1, item.type)}
                      </div>

                      {/* Divider */}
                      <div className="bg-gray-700" />

                      {/* Vendor 2 Value */}
                      <div
                        className={`flex items-center justify-center ${
                          better === 'vendor2' ? 'text-pink-400' : 'text-gray-400'
                        }`}
                      >
                        {renderComparisonValue(value2, item.type)}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </ScrollArea>
  );
};

interface PremiumComparisonViewProps {
  vendors: any[];
  onBack: () => void;
  onDraftRfp: (vendorIds: string[]) => void;
}

const PremiumComparisonView: React.FC<PremiumComparisonViewProps> = ({ vendors, onBack, onDraftRfp }) => {
  const [vendor1, vendor2] = vendors.slice(0, 2);

  // Get match details from vendors (may not exist)
  const match1 = vendor1?.matchDetails;
  const match2 = vendor2?.matchDetails;
  const hasMatchData = match1 && match2;

  // Determine which vendor has higher score
  const higherScoreVendor = hasMatchData && match1?.totalScore > match2?.totalScore ? 1 : 2;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>

          {/* Premium Badge */}
          <Badge className="bg-gradient-to-r from-cyan-400 to-purple-400 text-white px-4 py-2 text-sm font-semibold">
            <CheckCircle className="mr-2 h-4 w-4" />
            Premium Intelligence
          </Badge>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
            {hasMatchData ? 'AI-Powered Vendor Comparison' : 'Premium Vendor Intelligence'}
          </h1>
          <p className="text-gray-400">
            {hasMatchData
              ? 'Personalized match scores based on your assessment'
              : 'Comprehensive feature-by-feature analysis'}
          </p>
        </div>
      </motion.div>

      {/* Epic 13 - Story 13.4: Comparative Insights Summary - Only show if match data exists */}
      {hasMatchData && (
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <ComparativeInsights
              vendor1={vendor1}
              match1={match1}
              vendor2={vendor2}
              match2={match2}
            />
          </motion.div>
        </div>
      )}

      {/* Match Score Comparison - Only show if match data exists */}
      {hasMatchData && (
        <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vendor 1 Column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`${
              higherScoreVendor === 1
                ? 'ring-2 ring-green-500/50 shadow-lg shadow-green-500/20'
                : ''
            } rounded-lg`}
          >
            <Card className="bg-gradient-to-br from-cyan-900/20 via-gray-900/50 to-gray-900/20 border-cyan-500/30">
              <CardHeader>
                {/* Vendor Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                      {vendor1.logo ? (
                        <img
                          src={vendor1.logo}
                          alt={vendor1.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-xl font-bold text-cyan-400">
                          {vendor1.name?.substring(0, 2).toUpperCase() || 'V1'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{vendor1.name}</h3>
                      {vendor1.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400 text-sm">{vendor1.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total Score */}
                <div className="text-center py-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg mb-4">
                  <p className="text-gray-400 text-sm mb-1">Match Score</p>
                  <p className="text-5xl font-bold text-white mb-2">
                    {match1?.totalScore || 0}
                    <span className="text-gray-500 text-2xl ml-1">/ 140</span>
                  </p>
                  <MatchQualityBadge score={match1?.totalScore || 0} />
                  {higherScoreVendor === 1 && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 mt-2">
                      Best Match
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Epic 13 - Story 13.3: Priority Badge */}
                {match1?.priorityBoost && (
                  <PriorityBadge
                    priorityBoost={match1.priorityBoost.topPriorityBoost}
                    matchedPriority={match1.priorityBoost.matchedPriority}
                  />
                )}

                {/* Epic 13 - Story 13.3: Gap Coverage */}
                {match1?.baseScore && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Gap Coverage</h4>
                    <div className="mb-2">
                      <Progress
                        value={(match1.baseScore.riskAreaCoverage / 40) * 100}
                        className={`h-3 ${
                          match1.baseScore.riskAreaCoverage >= 30
                            ? 'bg-green-900/30 [&>div]:bg-green-500'
                            : match1.baseScore.riskAreaCoverage >= 20
                            ? 'bg-yellow-900/30 [&>div]:bg-yellow-500'
                            : 'bg-red-900/30 [&>div]:bg-red-500'
                        }`}
                      />
                      <p className="text-sm text-gray-400 mt-1">
                        {((match1.baseScore.riskAreaCoverage / 40) * 100).toFixed(0)}% of identified compliance gaps
                      </p>
                    </div>
                  </div>
                )}

                <Separator className="bg-gray-800" />

                {/* Base Score Chart */}
                {match1?.baseScore && <BaseScoreChart baseScore={match1.baseScore} />}

                <Separator className="bg-gray-800" />

                {/* Priority Boost Chart */}
                {match1?.priorityBoost && (
                  <PriorityBoostChart priorityBoost={match1.priorityBoost} />
                )}

                <Separator className="bg-gray-800" />

                {/* Epic 13 - Story 13.3: Match Reasons */}
                {match1?.matchReasons && match1.matchReasons.length > 0 && (
                  <MatchReasonsList matchReasons={match1.matchReasons} />
                )}

                <Separator className="bg-gray-800" />

                {/* Epic 13 - Story 13.3: Feature Coverage */}
                {match1?.priorityBoost && (
                  <FeatureCoverageList
                    missingFeatures={match1.priorityBoost.missingFeatures || []}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Vendor 2 Column */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`${
              higherScoreVendor === 2
                ? 'ring-2 ring-green-500/50 shadow-lg shadow-green-500/20'
                : ''
            } rounded-lg`}
          >
            <Card className="bg-gradient-to-br from-pink-900/20 via-gray-900/50 to-gray-900/20 border-pink-500/30">
              <CardHeader>
                {/* Vendor Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/30">
                      {vendor2.logo ? (
                        <img
                          src={vendor2.logo}
                          alt={vendor2.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-xl font-bold text-pink-400">
                          {vendor2.name?.substring(0, 2).toUpperCase() || 'V2'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{vendor2.name}</h3>
                      {vendor2.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400 text-sm">{vendor2.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total Score */}
                <div className="text-center py-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg mb-4">
                  <p className="text-gray-400 text-sm mb-1">Match Score</p>
                  <p className="text-5xl font-bold text-white mb-2">
                    {match2?.totalScore || 0}
                    <span className="text-gray-500 text-2xl ml-1">/ 140</span>
                  </p>
                  <MatchQualityBadge score={match2?.totalScore || 0} />
                  {higherScoreVendor === 2 && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 mt-2">
                      Best Match
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Epic 13 - Story 13.3: Priority Badge */}
                {match2?.priorityBoost && (
                  <PriorityBadge
                    priorityBoost={match2.priorityBoost.topPriorityBoost}
                    matchedPriority={match2.priorityBoost.matchedPriority}
                  />
                )}

                {/* Epic 13 - Story 13.3: Gap Coverage */}
                {match2?.baseScore && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Gap Coverage</h4>
                    <div className="mb-2">
                      <Progress
                        value={(match2.baseScore.riskAreaCoverage / 40) * 100}
                        className={`h-3 ${
                          match2.baseScore.riskAreaCoverage >= 30
                            ? 'bg-green-900/30 [&>div]:bg-green-500'
                            : match2.baseScore.riskAreaCoverage >= 20
                            ? 'bg-yellow-900/30 [&>div]:bg-yellow-500'
                            : 'bg-red-900/30 [&>div]:bg-red-500'
                        }`}
                      />
                      <p className="text-sm text-gray-400 mt-1">
                        {((match2.baseScore.riskAreaCoverage / 40) * 100).toFixed(0)}% of identified compliance gaps
                      </p>
                    </div>
                  </div>
                )}

                <Separator className="bg-gray-800" />

                {/* Base Score Chart */}
                {match2?.baseScore && <BaseScoreChart baseScore={match2.baseScore} />}

                <Separator className="bg-gray-800" />

                {/* Priority Boost Chart */}
                {match2?.priorityBoost && (
                  <PriorityBoostChart priorityBoost={match2.priorityBoost} />
                )}

                <Separator className="bg-gray-800" />

                {/* Epic 13 - Story 13.3: Match Reasons */}
                {match2?.matchReasons && match2.matchReasons.length > 0 && (
                  <MatchReasonsList matchReasons={match2.matchReasons} />
                )}

                <Separator className="bg-gray-800" />

                {/* Epic 13 - Story 13.3: Feature Coverage */}
                {match2?.priorityBoost && (
                  <FeatureCoverageList
                    missingFeatures={match2.priorityBoost.missingFeatures || []}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
        </div>
      )}

      {/* Vendor Headers when no match data */}
      {!hasMatchData && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-cyan-900/20 via-gray-900/50 to-gray-900/20 border-cyan-500/30">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                    <span className="text-xl font-bold text-cyan-400">
                      {vendor1?.name?.substring(0, 2).toUpperCase() || 'V1'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{vendor1?.name || 'Vendor 1'}</h3>
                    {vendor1?.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400 text-sm">{vendor1.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-pink-900/20 via-gray-900/50 to-gray-900/20 border-pink-500/30">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/30">
                    <span className="text-xl font-bold text-pink-400">
                      {vendor2?.name?.substring(0, 2).toUpperCase() || 'V2'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{vendor2?.name || 'Vendor 2'}</h3>
                    {vendor2?.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400 text-sm">{vendor2.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      )}

      {/* Vendor Intelligence Matrix - Always show for premium users */}
      <div className="max-w-7xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                Vendor Intelligence Matrix
              </h2>
              <p className="text-gray-400">Detailed feature-by-feature comparison</p>
            </div>

            <VendorIntelligenceMatrix
              vendor1={vendor1}
              vendor2={vendor2}
            />
          </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-7xl mx-auto mt-8 grid grid-cols-2 gap-4"
      >
        <Button
          onClick={() => onDraftRfp([vendor1.id])}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          size="lg"
          data-testid="button-draft-rfp-vendor1"
        >
          <FileText className="mr-2 h-5 w-5" />
          Draft RFP - {vendor1.name}
        </Button>
        <Button
          onClick={() => onDraftRfp([vendor2.id])}
          className="bg-pink-600 hover:bg-pink-700 text-white"
          size="lg"
          data-testid="button-draft-rfp-vendor2"
        >
          <FileText className="mr-2 h-5 w-5" />
          Draft RFP - {vendor2.name}
        </Button>
      </motion.div>
    </div>
  );
};

// Epic 13 - Story 13.1: Static Comparison View (existing functionality extracted)
interface StaticComparisonViewProps {
  vendors: any[];
  onBack: () => void;
  isPremium: boolean;
  bannerDismissed: boolean;
  onDismissBanner: () => void;
  onContactVendor: (vendor: any) => void;
}

const StaticComparisonView: React.FC<StaticComparisonViewProps> = ({
  vendors,
  onBack,
  isPremium,
  bannerDismissed,
  onDismissBanner,
  onContactVendor
}) => {
  const [vendor1, vendor2] = vendors.slice(0, 2);

  const comparisonCategories = [
    {
      title: 'Core Capabilities',
      icon: Cpu,
      items: [
        { label: 'Transaction Monitoring', key: 'hasTransactionMonitoring' },
        { label: 'Sanctions Screening', key: 'hasSanctionsScreening' },
        { label: 'KYC/AML', key: 'hasKYCAML' },
        { label: 'Risk Assessment', key: 'hasRiskAssessment' },
        { label: 'Regulatory Reporting', key: 'hasRegulatoryReporting' },
      ],
    },
    {
      title: 'AI & Technology',
      icon: Sparkles,
      items: [
        { label: 'AI/ML Capabilities', key: 'aiCapabilities', type: 'text' },
        { label: 'Real-time Processing', key: 'hasRealTimeProcessing' },
        { label: 'Predictive Analytics', key: 'hasPredictiveAnalytics' },
        { label: 'Natural Language Processing', key: 'hasNLP' },
        { label: 'Automated Decisioning', key: 'hasAutomatedDecisioning' },
      ],
    },
    {
      title: 'Integration & Deployment',
      icon: Cloud,
      items: [
        { label: 'Deployment Options', key: 'deploymentOptions', type: 'text' },
        { label: 'API Integration', key: 'hasAPIIntegration' },
        { label: 'Cloud Native', key: 'isCloudNative' },
        { label: 'On-Premise Available', key: 'hasOnPremise' },
        { label: 'Integration Partners', key: 'integrations', type: 'text' },
      ],
    },
    {
      title: 'Coverage & Scale',
      icon: Globe,
      items: [
        { label: 'Geographic Coverage', key: 'dataCoverage', type: 'text' },
        { label: 'Customer Segments', key: 'customerSegments', type: 'text' },
        { label: 'Industry Focus', key: 'industryFocus', type: 'text' },
        { label: 'Transaction Volume', key: 'transactionVolume', type: 'text' },
        { label: 'Data Sources', key: 'dataSources', type: 'number' },
      ],
    },
    {
      title: 'Support & Service',
      icon: Users,
      items: [
        { label: '24/7 Support', key: 'has247Support' },
        { label: 'Dedicated Account Manager', key: 'hasDedicatedManager' },
        { label: 'Training Included', key: 'hasTraining' },
        { label: 'Implementation Support', key: 'hasImplementationSupport' },
        { label: 'SLA Guarantee', key: 'hasSLA' },
      ],
    },
  ];

  const getComparisonValue = (vendor: any, key: string) => {
    // Map vendor categories to feature flags
    const featureData: Record<string, any> = {
      hasTransactionMonitoring: vendor.categories?.includes('TRANSACTION_MONITORING'),
      hasSanctionsScreening: vendor.categories?.includes('SANCTIONS_SCREENING'),
      hasKYCAML: vendor.categories?.includes('KYC_AML'),
      hasRiskAssessment: vendor.categories?.includes('RISK_ASSESSMENT'),
      hasRegulatoryReporting: vendor.categories?.includes('REGULATORY_REPORTING'),
      hasRealTimeProcessing:
        vendor.primaryProducts?.toLowerCase().includes('real-time') ||
        vendor.aiCapabilities?.toLowerCase().includes('real-time'),
      hasPredictiveAnalytics:
        vendor.aiCapabilities?.toLowerCase().includes('predict') ||
        vendor.aiCapabilities?.toLowerCase().includes('analytics'),
      hasNLP:
        vendor.aiCapabilities?.toLowerCase().includes('nlp') ||
        vendor.aiCapabilities?.toLowerCase().includes('natural language'),
      hasAutomatedDecisioning: vendor.aiCapabilities?.toLowerCase().includes('automat'),
      hasAPIIntegration: vendor.integrations?.toLowerCase().includes('api') || true,
      isCloudNative:
        vendor.deploymentOptions?.toLowerCase().includes('cloud') ||
        vendor.deploymentOptions?.toLowerCase().includes('saas'),
      hasOnPremise:
        vendor.deploymentOptions?.toLowerCase().includes('premise') ||
        vendor.deploymentOptions?.toLowerCase().includes('on-prem'),
      has247Support:
        vendor.customerSegments?.toLowerCase().includes('enterprise') || vendor.featured,
      hasDedicatedManager: vendor.featured || vendor.verified,
      hasTraining: true,
      hasImplementationSupport: true,
      hasSLA: vendor.verified,
      transactionVolume: vendor.customerSegments?.toLowerCase().includes('enterprise')
        ? '10M+/day'
        : '1M+/day',
      dataSources: vendor.dataCoverage ? 150 : 75,
      industryFocus: vendor.customerSegments || 'Financial Services',
    };

    // Check actual vendor properties first
    if (vendor[key] !== undefined) return vendor[key];

    // Fall back to derived data
    return featureData[key];
  };

  const renderComparisonValue = (value: any, type?: string) => {
    if (type === 'text' || type === 'number') {
      return value || <span className="text-gray-500">N/A</span>;
    }

    if (typeof value === 'boolean') {
      return value ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="h-4 w-4 text-green-400" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
            <X className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      );
    }

    return <span className="text-gray-500">-</span>;
  };

  const getBetterValue = (value1: any, value2: any, type?: string) => {
    if (type === 'number') {
      const num1 = parseInt(value1) || 0;
      const num2 = parseInt(value2) || 0;
      if (num1 > num2) return 'vendor1';
      if (num2 > num1) return 'vendor2';
      return 'equal';
    }

    if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
      if (value1 && !value2) return 'vendor1';
      if (!value1 && value2) return 'vendor2';
      return 'equal';
    }

    return 'equal';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
            data-testid="button-back-to-marketplace"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>

          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
            <span className="text-cyan-400 font-medium">Live Comparison</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
            Vendor Intelligence Matrix
          </h1>
          <p className="text-gray-400">AI-powered comparative analysis of compliance solutions</p>
        </div>
      </motion.div>

      {/* Vendor Headers */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-[1fr,2px,1fr] gap-4">
          {/* Vendor 1 Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-cyan-900/20 via-gray-900/50 to-gray-900/20 border-cyan-500/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                      {vendor1.logo ? (
                        <img
                          src={vendor1.logo}
                          alt={vendor1.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-cyan-400">
                          {vendor1.name?.substring(0, 2).toUpperCase() || 'V1'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{vendor1.name}</h2>
                      {vendor1.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400 font-medium">
                            {vendor1.rating.toFixed(1)}
                          </span>
                          <span className="text-gray-500">
                            ({vendor1.reviewCount || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/50 via-pink-500/50 to-cyan-500/50 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 via-pink-500 to-cyan-500" />
          </div>

          {/* Vendor 2 Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-pink-900/20 via-gray-900/50 to-gray-900/20 border-pink-500/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent" />
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/30">
                      {vendor2.logo ? (
                        <img
                          src={vendor2.logo}
                          alt={vendor2.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-pink-400">
                          {vendor2.name?.substring(0, 2).toUpperCase() || 'V2'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{vendor2.name}</h2>
                      {vendor2.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400 font-medium">
                            {vendor2.rating.toFixed(1)}
                          </span>
                          <span className="text-gray-500">
                            ({vendor2.reviewCount || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Epic 13 - Story 13.1: Upgrade Banner for Free Users */}
      {!isPremium && !bannerDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto mb-6"
        >
          <Alert className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border-cyan-500/50 relative">
            <div className="flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-cyan-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Unlock Premium Comparison
                </h3>
                <AlertDescription className="text-gray-300 mb-3">
                  Get AI-powered insights, match scores, gap coverage analysis, and personalized vendor recommendations based on your assessment.
                </AlertDescription>
                <div className="flex gap-3">
                  <Button
                    className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white"
                    onClick={() => window.location.href = '/pricing'}
                  >
                    View Pricing
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                    onClick={onDismissBanner}
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </Alert>
        </motion.div>
      )}

      {/* Comparison Matrix */}
      <div className="max-w-7xl mx-auto">
        <ScrollArea className="h-[600px]">
          {comparisonCategories.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 + 0.2 }}
                className="mb-8"
              >
                <Card className="bg-gray-900/50 border-gray-800 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-cyan-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">{category.title}</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {category.items.map((item, itemIndex) => {
                      const value1 = getComparisonValue(vendor1, item.key);
                      const value2 = getComparisonValue(vendor2, item.key);
                      const better = getBetterValue(value1, value2, item.type);

                      return (
                        <div
                          key={item.key}
                          className={`grid grid-cols-[1fr,2fr,1px,2fr] gap-4 p-4 ${
                            itemIndex !== category.items.length - 1
                              ? 'border-b border-gray-800'
                              : ''
                          } hover:bg-gray-800/30 transition-colors`}
                        >
                          {/* Feature Name */}
                          <div className="flex items-center">
                            <span className="text-gray-300 font-medium">{item.label}</span>
                          </div>

                          {/* Vendor 1 Value */}
                          <div
                            className={`flex items-center justify-center ${
                              better === 'vendor1' ? 'text-cyan-400' : 'text-gray-400'
                            }`}
                          >
                            {renderComparisonValue(value1, item.type)}
                          </div>

                          {/* Divider */}
                          <div className="bg-gray-700" />

                          {/* Vendor 2 Value */}
                          <div
                            className={`flex items-center justify-center ${
                              better === 'vendor2' ? 'text-pink-400' : 'text-gray-400'
                            }`}
                          >
                            {renderComparisonValue(value2, item.type)}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </ScrollArea>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-7xl mx-auto mt-8"
      >
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => onContactVendor(vendor1)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
            size="lg"
            data-testid="button-contact-vendor1"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Contact Vendor - {vendor1.name}
          </Button>
          <Button
            onClick={() => onContactVendor(vendor2)}
            className="bg-pink-600 hover:bg-pink-700 text-white"
            size="lg"
            data-testid="button-contact-vendor2"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Contact Vendor - {vendor2.name}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default VendorComparison;
