import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';
import { motion } from 'framer-motion';

interface VendorComparisonProps {
  vendors: any[];
  onBack: () => void;
}

const VendorComparison: React.FC<VendorComparisonProps> = ({ vendors, onBack }) => {
  // Ensure we have exactly 2 vendors for comparison
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
                      {vendor1.logoUrl ? (
                        <img
                          src={vendor1.logoUrl}
                          alt={vendor1.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-cyan-400">
                          {vendor1.name.substring(0, 2).toUpperCase()}
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
                      {vendor2.logoUrl ? (
                        <img
                          src={vendor2.logoUrl}
                          alt={vendor2.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-pink-400">
                          {vendor2.name.substring(0, 2).toUpperCase()}
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
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
            size="lg"
            data-testid="button-request-demo-vendor1"
          >
            Request Demo - {vendor1.name}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            className="bg-pink-600 hover:bg-pink-700 text-white"
            size="lg"
            data-testid="button-request-demo-vendor2"
          >
            Request Demo - {vendor2.name}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default VendorComparison;
