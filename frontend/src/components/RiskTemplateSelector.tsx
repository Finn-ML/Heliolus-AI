import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Shield,
  Building,
  Globe,
  Package,
  DollarSign,
  Truck,
  Anchor,
  Plus,
  Plane,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import CustomTemplateBuilder from './CustomTemplateBuilder';

interface RiskTemplate {
  id: string;
  name: string;
  category: 'trade-compliance' | 'financial-crime';
  subcategory?: string;
  description: string;
  riskAreas: string[];
  regulatoryFrameworks: string[];
  icon: React.ComponentType<any>;
  complexity: 'Basic' | 'Intermediate' | 'Advanced';
  estimatedCompletionTime: string;
  isCustom?: boolean;
}

interface RiskTemplateSelectorProps {
  onTemplateSelect: (template: RiskTemplate) => void;
  onSkip: () => void;
}

const riskTemplates: RiskTemplate[] = [
  // Financial Crime Compliance Templates
  {
    id: 'fc-general',
    name: 'General Financial Crime Compliance',
    category: 'financial-crime',
    description:
      'Comprehensive assessment covering AML, KYC, sanctions screening, and transaction monitoring for all financial institutions.',
    riskAreas: [
      'AML/KYC',
      'Sanctions Screening',
      'Transaction Monitoring',
      'PEP Screening',
      'Regulatory Reporting',
    ],
    regulatoryFrameworks: ['AML6', 'GDPR', 'MiFID II', 'PSD2', 'FATCA', 'CRS'],
    icon: Shield,
    complexity: 'Intermediate',
    estimatedCompletionTime: '45-60 minutes',
  },
  {
    id: 'fc-trade-finance',
    name: 'Trade Finance Compliance',
    category: 'financial-crime',
    subcategory: 'Trade Finance',
    description:
      'Specialized assessment for trade finance operations including letters of credit, documentary collections, and trade-based money laundering risks.',
    riskAreas: [
      'Trade-Based Money Laundering',
      'Documentary Credit Fraud',
      'Dual-Use Goods Screening',
      'Export Control Compliance',
      'Correspondent Banking',
    ],
    regulatoryFrameworks: [
      'AML6',
      'EU Dual-Use Regulation',
      'US Export Administration Regulations',
      'OFAC Sanctions',
      'UK Export Control Orders',
    ],
    icon: Package,
    complexity: 'Advanced',
    estimatedCompletionTime: '60-75 minutes',
  },
  {
    id: 'fc-correspondent-banking',
    name: 'Correspondent Banking Risk Assessment',
    category: 'financial-crime',
    description:
      'Focused assessment for correspondent banking relationships and cross-border payment risks.',
    riskAreas: [
      'Correspondent Banking Due Diligence',
      'Cross-Border Payment Monitoring',
      'Nested Account Risk',
      'SWIFT Messaging Controls',
    ],
    regulatoryFrameworks: [
      'Basel Committee Guidelines',
      'Wolfsberg Principles',
      'FATF Recommendations',
      'US BSA',
    ],
    icon: Globe,
    complexity: 'Advanced',
    estimatedCompletionTime: '50-65 minutes',
  },
  {
    id: 'fc-crypto',
    name: 'Digital Assets & Cryptocurrency',
    category: 'financial-crime',
    description:
      'Assessment for institutions dealing with digital assets, cryptocurrencies, and blockchain-based transactions.',
    riskAreas: [
      'Crypto AML',
      'DeFi Risk Management',
      'Blockchain Analytics',
      'Virtual Asset Service Provider Due Diligence',
    ],
    regulatoryFrameworks: [
      'EU MiCA Regulation',
      'FATF Virtual Asset Guidelines',
      'US FinCEN Guidance',
      '5AMLD',
    ],
    icon: DollarSign,
    complexity: 'Advanced',
    estimatedCompletionTime: '55-70 minutes',
  },

  // Trade Compliance Templates
  {
    id: 'tc-general',
    name: 'General Trade Compliance',
    category: 'trade-compliance',
    description:
      'Comprehensive assessment covering all aspects of international trade compliance including customs, import/export controls, and regulatory requirements.',
    riskAreas: [
      'Import/Export Controls',
      'Customs Compliance',
      'Export Licensing',
      'Sanctions Compliance',
      'Trade Documentation',
      'Country of Origin',
      'Valuation & Classification',
      'Free Trade Agreements',
      'Regulatory Reporting',
    ],
    regulatoryFrameworks: [
      'WTO Agreements',
      'EU Customs Code',
      'US Customs Regulations',
      'CPTPP',
      'USMCA',
      'EAR',
      'OFAC Sanctions',
      'C-TPAT',
    ],
    icon: Shield,
    complexity: 'Intermediate',
    estimatedCompletionTime: '50-65 minutes',
  },
  {
    id: 'tc-air-cargo',
    name: 'Air Cargo Compliance',
    category: 'trade-compliance',
    subcategory: 'Air Cargo',
    description:
      'Specialized assessment for air cargo operations covering aviation security, dangerous goods handling, and air transport regulations.',
    riskAreas: [
      'Aviation Security (AVSEC)',
      'Dangerous Goods Regulations',
      'Air Waybill Requirements',
      'Cargo Screening',
      'Known Consignor Status',
      'Regulated Agent Procedures',
      'Temperature-Controlled Cargo',
      'Live Animals Transport',
      'High-Value Cargo Security',
    ],
    regulatoryFrameworks: [
      'ICAO Annex 17',
      'IATA DGR',
      'EU Aviation Security Regulation',
      'TSA Air Cargo Security Requirements',
      'EASA Regulations',
      'IATA Cargo Security Manual',
    ],
    icon: Plane,
    complexity: 'Advanced',
    estimatedCompletionTime: '60-75 minutes',
  },
  {
    id: 'tc-ground-handler',
    name: 'Ground Handler Compliance',
    category: 'trade-compliance',
    subcategory: 'Ground Handling',
    description:
      'Assessment for ground handling operations including cargo handling, security procedures, and operational compliance requirements.',
    riskAreas: [
      'Ground Handling Security',
      'Cargo Handling Procedures',
      'Equipment Safety Standards',
      'Personnel Security Clearance',
      'Facility Security',
      'Documentation Management',
      'Quality Assurance',
      'Emergency Response Procedures',
      'Ramp Safety',
    ],
    regulatoryFrameworks: [
      'ICAO Airport Services Manual',
      'IATA Ground Operations Manual',
      'EU Ground Handling Directive',
      'FAA Ground Handling Requirements',
      'ACI Security Guidelines',
    ],
    icon: Truck,
    complexity: 'Intermediate',
    estimatedCompletionTime: '45-60 minutes',
  },
  {
    id: 'tc-dangerous-goods',
    name: 'Dangerous Goods Compliance',
    category: 'trade-compliance',
    subcategory: 'Dangerous Goods',
    description:
      'Comprehensive assessment for handling, transport, and compliance of dangerous goods across all transport modes.',
    riskAreas: [
      'DG Classification',
      'Packaging Requirements',
      'Labeling & Marking',
      'Documentation Requirements',
      'Training & Certification',
      'Emergency Response',
      'Storage Requirements',
      'Transport Unit Loading',
      'Segregation Rules',
      'Incident Reporting',
    ],
    regulatoryFrameworks: [
      'UN Model Regulations',
      'IATA DGR',
      'IMDG Code',
      'ADR/RID European Agreement',
      'DOT HMR',
      'GHS Classification',
      'ICAO Technical Instructions',
    ],
    icon: AlertTriangle,
    complexity: 'Advanced',
    estimatedCompletionTime: '65-80 minutes',
  },
  {
    id: 'tc-import-export',
    name: 'Import/Export Compliance',
    category: 'trade-compliance',
    description:
      'Comprehensive assessment for import/export operations covering customs, trade regulations, and cross-border compliance.',
    riskAreas: [
      'Customs Compliance',
      'Import/Export Licensing',
      'Country of Origin',
      'Valuation & Classification',
      'Free Trade Agreements',
    ],
    regulatoryFrameworks: [
      'WTO Agreements',
      'EU Customs Code',
      'US Customs Regulations',
      'CPTPP',
      'USMCA',
    ],
    icon: Truck,
    complexity: 'Intermediate',
    estimatedCompletionTime: '40-55 minutes',
  },
  {
    id: 'tc-sanctions-export',
    name: 'Export Control & Sanctions',
    category: 'trade-compliance',
    description:
      'Specialized assessment for export control compliance, dual-use goods, and international sanctions.',
    riskAreas: [
      'Export Control Lists',
      'Dual-Use Technology',
      'End-User Verification',
      'Sanctions Compliance',
      'Technology Transfer',
    ],
    regulatoryFrameworks: [
      'EAR',
      'ITAR',
      'EU Dual-Use Regulation',
      'OFAC Sanctions',
      'UK Export Control Orders',
    ],
    icon: Shield,
    complexity: 'Advanced',
    estimatedCompletionTime: '55-70 minutes',
  },
  {
    id: 'tc-supply-chain',
    name: 'Supply Chain Compliance',
    category: 'trade-compliance',
    description:
      'Assessment covering supply chain security, vendor compliance, and third-party risk management.',
    riskAreas: [
      'Supplier Due Diligence',
      'C-TPAT Compliance',
      'Authorized Economic Operator',
      'Supply Chain Security',
      'Third-Party Risk',
    ],
    regulatoryFrameworks: [
      'C-TPAT',
      'AEO Programme',
      'SAFE Framework',
      'EU Supply Chain Due Diligence Directive',
    ],
    icon: Building,
    complexity: 'Intermediate',
    estimatedCompletionTime: '45-60 minutes',
  },
  {
    id: 'tc-maritime',
    name: 'Maritime Trade Compliance',
    category: 'trade-compliance',
    description:
      'Specialized assessment for maritime shipping, port operations, and vessel compliance requirements.',
    riskAreas: [
      'ISPS Code Compliance',
      'Maritime Security',
      'Port State Control',
      'Flag State Requirements',
      'Maritime Labor Convention',
    ],
    regulatoryFrameworks: ['IMO Regulations', 'ISPS Code', 'STCW Convention', 'MLC 2006', 'MARPOL'],
    icon: Anchor,
    complexity: 'Advanced',
    estimatedCompletionTime: '50-65 minutes',
  },
];

const RiskTemplateSelector: React.FC<RiskTemplateSelectorProps> = ({
  onTemplateSelect,
  onSkip,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'trade-compliance' | 'financial-crime'
  >('all');
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<RiskTemplate[]>([]);

  const allTemplates = [...riskTemplates, ...customTemplates];

  const filteredTemplates = allTemplates.filter(
    template => selectedCategory === 'all' || template.category === selectedCategory
  );

  const handleCustomTemplateCreate = (template: RiskTemplate) => {
    setCustomTemplates(prev => [...prev, template]);
    setShowCustomBuilder(false);
  };

  const handleCancelCustomBuilder = () => {
    setShowCustomBuilder(false);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Basic':
        return 'bg-green-600/20 text-green-400';
      case 'Intermediate':
        return 'bg-yellow-600/20 text-yellow-400';
      case 'Advanced':
        return 'bg-red-600/20 text-red-400';
      default:
        return 'bg-gray-600/20 text-gray-300';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial-crime':
        return 'bg-cyan-600/20 text-cyan-400';
      case 'trade-compliance':
        return 'bg-pink-600/20 text-pink-400';
      default:
        return 'bg-gray-600/20 text-gray-300';
    }
  };

  if (showCustomBuilder) {
    return (
      <CustomTemplateBuilder
        onTemplateCreate={handleCustomTemplateCreate}
        onCancel={handleCancelCustomBuilder}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span>Choose Risk Assessment Template</span>
          </CardTitle>
          <CardDescription>
            Select a pre-built risk assessment template tailored to your compliance needs, or skip
            to upload your own documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Category Filter and Custom Template Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Templates
              </Button>
              <Button
                variant={selectedCategory === 'financial-crime' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('financial-crime')}
              >
                Financial Crime Compliance
              </Button>
              <Button
                variant={selectedCategory === 'trade-compliance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('trade-compliance')}
              >
                Trade Compliance
              </Button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCustomBuilder(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Custom Template
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {filteredTemplates.map(template => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                        {template.subcategory && (
                          <p className="text-sm text-white mb-1">({template.subcategory})</p>
                        )}
                        <p className="text-sm text-white mb-3">{template.description}</p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          <Badge className={getCategoryColor(template.category)}>
                            {template.category === 'financial-crime'
                              ? 'Financial Crime'
                              : 'Trade Compliance'}
                          </Badge>
                          <Badge className={getComplexityColor(template.complexity)}>
                            {template.complexity}
                          </Badge>
                          {template.isCustom && (
                            <Badge variant="secondary" className="bg-gray-600/20 text-gray-300">
                              Custom
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-white mb-2">
                          <strong>Duration:</strong> {template.estimatedCompletionTime}
                        </div>

                        <div className="text-xs text-white mb-3">
                          <strong>Key Areas:</strong> {template.riskAreas.slice(0, 3).join(', ')}
                          {template.riskAreas.length > 3 &&
                            ` +${template.riskAreas.length - 3} more`}
                        </div>

                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => onTemplateSelect(template)}
                        >
                          Use This Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Skip Option */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-white mb-3">
              Don't see what you're looking for? You can upload your own documentation instead.
            </p>
            <Button variant="outline" onClick={onSkip}>
              Skip Templates - Upload Custom Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskTemplateSelector;
