import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  X,
  Plus,
  FileText,
  Shield,
  Building,
  Package,
  Globe,
  DollarSign,
  Truck,
  Anchor,
  AlertTriangle,
  Plane,
  Zap,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomTemplate {
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
  isCustom: boolean;
}

interface CustomTemplateBuilderProps {
  onTemplateCreate: (template: CustomTemplate) => void;
  onCancel: () => void;
}

const predefinedRiskAreas = {
  'financial-crime': [
    'AML/KYC',
    'Sanctions Screening',
    'Transaction Monitoring',
    'PEP Screening',
    'Regulatory Reporting',
    'Customer Due Diligence',
    'Enhanced Due Diligence',
    'Beneficial Ownership',
    'Trade-Based Money Laundering',
    'Correspondent Banking',
    'Wire Transfer Monitoring',
    'Cash Transaction Reporting',
    'Suspicious Activity Reporting',
    'Risk Assessment',
    'Internal Controls',
    'Staff Training',
    'Independent Testing',
    'BSA/AML Officer',
  ],
  'trade-compliance': [
    'Import/Export Controls',
    'Customs Compliance',
    'Export Licensing',
    'Sanctions Compliance',
    'Dual-Use Goods',
    'Country of Origin',
    'Trade Preferences',
    'Valuation & Classification',
    'Customs Brokers',
    'Free Trade Agreements',
    'Anti-Dumping Duties',
    'Countervailing Duties',
    'Supply Chain Security',
    'C-TPAT Compliance',
    'AEO Programme',
    'ISPS Code',
    'Maritime Security',
    'Aviation Security (AVSEC)',
    'Dangerous Goods Regulations',
    'Air Waybill Requirements',
    'Cargo Screening',
    'Known Consignor Status',
    'Regulated Agent Procedures',
    'Temperature-Controlled Cargo',
    'Live Animals Transport',
    'High-Value Cargo Security',
    'Ground Handling Security',
    'Cargo Handling Procedures',
    'Equipment Safety Standards',
    'Personnel Security Clearance',
    'Facility Security',
    'Documentation Management',
    'Quality Assurance',
    'Emergency Response Procedures',
    'Ramp Safety',
    'DG Classification',
    'Packaging Requirements',
    'Labeling & Marking',
    'Training & Certification',
    'Storage Requirements',
    'Transport Unit Loading',
    'Segregation Rules',
    'Incident Reporting',
    'Border Security',
    'Trade Documentation',
  ],
};

const predefinedFrameworks = {
  'financial-crime': [
    'AML6 (6th Anti-Money Laundering Directive)',
    'GDPR (General Data Protection Regulation)',
    'MiFID II (Markets in Financial Instruments Directive)',
    'PSD2 (Payment Services Directive)',
    'FATCA (Foreign Account Tax Compliance Act)',
    'CRS (Common Reporting Standard)',
    'BSA (Bank Secrecy Act)',
    'USA PATRIOT Act',
    'OFAC Sanctions',
    'EU Sanctions',
    'FATF Recommendations',
    'Basel AML Guidelines',
    'Wolfsberg Principles',
    'EU MiCA Regulation',
    '5AMLD (5th Anti-Money Laundering Directive)',
  ],
  'trade-compliance': [
    'WTO Agreements',
    'EU Customs Code',
    'US Customs Regulations',
    'CPTPP (Comprehensive and Progressive Trans-Pacific Partnership)',
    'USMCA (United States-Mexico-Canada Agreement)',
    'EAR (Export Administration Regulations)',
    'ITAR (International Traffic in Arms Regulations)',
    'EU Dual-Use Regulation',
    'OFAC Sanctions',
    'UK Export Control Orders',
    'C-TPAT (Customs-Trade Partnership Against Terrorism)',
    'AEO Programme (Authorized Economic Operator)',
    'SAFE Framework',
    'IMO Regulations',
    'ISPS Code',
    'STCW Convention',
    'MLC 2006',
    'MARPOL',
    'ICAO Annex 17',
    'IATA DGR (Dangerous Goods Regulations)',
    'EU Aviation Security Regulation',
    'TSA Air Cargo Security Requirements',
    'EASA Regulations',
    'IATA Cargo Security Manual',
    'ICAO Airport Services Manual',
    'IATA Ground Operations Manual',
    'EU Ground Handling Directive',
    'FAA Ground Handling Requirements',
    'ACI Security Guidelines',
    'UN Model Regulations',
    'IMDG Code',
    'ADR/RID European Agreement',
    'DOT HMR (Hazardous Materials Regulations)',
    'GHS Classification',
    'ICAO Technical Instructions',
  ],
};

const iconOptions = [
  { name: 'Shield', icon: Shield },
  { name: 'FileText', icon: FileText },
  { name: 'Building', icon: Building },
  { name: 'Package', icon: Package },
  { name: 'Globe', icon: Globe },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'Truck', icon: Truck },
  { name: 'Anchor', icon: Anchor },
  { name: 'Plane', icon: Plane },
  { name: 'AlertTriangle', icon: AlertTriangle },
];

const CustomTemplateBuilder: React.FC<CustomTemplateBuilderProps> = ({
  onTemplateCreate,
  onCancel,
}) => {
  const [templateData, setTemplateData] = useState({
    name: '',
    category: '' as 'trade-compliance' | 'financial-crime' | '',
    subcategory: '',
    description: '',
    complexity: '' as 'Basic' | 'Intermediate' | 'Advanced' | '',
    estimatedCompletionTime: '',
    selectedIcon: 'Shield',
  });

  const [selectedRiskAreas, setSelectedRiskAreas] = useState<string[]>([]);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [customRiskArea, setCustomRiskArea] = useState('');
  const [customFramework, setCustomFramework] = useState('');

  const handleRiskAreaToggle = (area: string) => {
    setSelectedRiskAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleFrameworkToggle = (framework: string) => {
    setSelectedFrameworks(prev =>
      prev.includes(framework) ? prev.filter(f => f !== framework) : [...prev, framework]
    );
  };

  const addCustomRiskArea = () => {
    if (customRiskArea.trim() && !selectedRiskAreas.includes(customRiskArea.trim())) {
      setSelectedRiskAreas([...selectedRiskAreas, customRiskArea.trim()]);
      setCustomRiskArea('');
    }
  };

  const addCustomFramework = () => {
    if (customFramework.trim() && !selectedFrameworks.includes(customFramework.trim())) {
      setSelectedFrameworks([...selectedFrameworks, customFramework.trim()]);
      setCustomFramework('');
    }
  };

  const removeRiskArea = (area: string) => {
    setSelectedRiskAreas(prev => prev.filter(a => a !== area));
  };

  const removeFramework = (framework: string) => {
    setSelectedFrameworks(prev => prev.filter(f => f !== framework));
  };

  const handleCreate = () => {
    if (
      !templateData.name ||
      !templateData.category ||
      !templateData.description ||
      !templateData.complexity
    ) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields before creating the template.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedRiskAreas.length === 0) {
      toast({
        title: 'No Risk Areas Selected',
        description: 'Please select at least one risk area for your template.',
        variant: 'destructive',
      });
      return;
    }

    const selectedIconComponent =
      iconOptions.find(opt => opt.name === templateData.selectedIcon)?.icon || Shield;

    const newTemplate: CustomTemplate = {
      id: `custom-${Date.now()}`,
      name: templateData.name,
      category: templateData.category,
      subcategory: templateData.subcategory || undefined,
      description: templateData.description,
      riskAreas: selectedRiskAreas,
      regulatoryFrameworks: selectedFrameworks,
      icon: selectedIconComponent,
      complexity: templateData.complexity,
      estimatedCompletionTime:
        templateData.estimatedCompletionTime ||
        `${30 + selectedRiskAreas.length * 5}-${45 + selectedRiskAreas.length * 7} minutes`,
      isCustom: true,
    };

    onTemplateCreate(newTemplate);

    toast({
      title: 'Custom Template Created',
      description: `Your custom template "${templateData.name}" has been created successfully.`,
    });
  };

  const availableRiskAreas = templateData.category
    ? predefinedRiskAreas[templateData.category] || []
    : [];
  const availableFrameworks = templateData.category
    ? predefinedFrameworks[templateData.category] || []
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span>Create Custom Risk Assessment Template</span>
          </CardTitle>
          <CardDescription>
            Build a personalized risk assessment template tailored to your specific compliance needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Custom AML Assessment"
                value={templateData.name}
                onChange={e => setTemplateData({ ...templateData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={templateData.category}
                onValueChange={(value: 'trade-compliance' | 'financial-crime') =>
                  setTemplateData({ ...templateData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial-crime">Financial Crime Compliance</SelectItem>
                  <SelectItem value="trade-compliance">Trade Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory (Optional)</Label>
              <Input
                id="subcategory"
                placeholder="e.g., Trade Finance, Digital Assets"
                value={templateData.subcategory}
                onChange={e => setTemplateData({ ...templateData, subcategory: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complexity">Complexity Level *</Label>
              <Select
                value={templateData.complexity}
                onValueChange={(value: 'Basic' | 'Intermediate' | 'Advanced') =>
                  setTemplateData({ ...templateData, complexity: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what this template covers and its intended use..."
              value={templateData.description}
              onChange={e => setTemplateData({ ...templateData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Template Icon</Label>
              <Select
                value={templateData.selectedIcon}
                onValueChange={value => setTemplateData({ ...templateData, selectedIcon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(option => (
                    <SelectItem key={option.name} value={option.name}>
                      <div className="flex items-center space-x-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Estimated Completion Time</Label>
              <Input
                id="estimatedTime"
                placeholder="e.g., 45-60 minutes"
                value={templateData.estimatedCompletionTime}
                onChange={e =>
                  setTemplateData({ ...templateData, estimatedCompletionTime: e.target.value })
                }
              />
            </div>
          </div>

          {/* Risk Areas Selection */}
          {templateData.category && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Risk Areas *</Label>
                <p className="text-sm text-gray-600">
                  Select the risk areas this template should cover
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableRiskAreas.map(area => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={area}
                      checked={selectedRiskAreas.includes(area)}
                      onCheckedChange={() => handleRiskAreaToggle(area)}
                    />
                    <Label htmlFor={area} className="text-sm cursor-pointer">
                      {area}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom risk area..."
                  value={customRiskArea}
                  onChange={e => setCustomRiskArea(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomRiskArea()}
                />
                <Button type="button" onClick={addCustomRiskArea} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {selectedRiskAreas.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Selected Risk Areas ({selectedRiskAreas.length})
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {selectedRiskAreas.map(area => (
                      <Badge key={area} variant="secondary" className="flex items-center gap-1">
                        {area}
                        <button
                          onClick={() => removeRiskArea(area)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Regulatory Frameworks Selection */}
          {templateData.category && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Regulatory Frameworks (Optional)</Label>
                <p className="text-sm text-gray-600">Select applicable regulatory frameworks</p>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {availableFrameworks.map(framework => (
                  <div key={framework} className="flex items-center space-x-2">
                    <Checkbox
                      id={framework}
                      checked={selectedFrameworks.includes(framework)}
                      onCheckedChange={() => handleFrameworkToggle(framework)}
                    />
                    <Label htmlFor={framework} className="text-sm cursor-pointer">
                      {framework}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom regulatory framework..."
                  value={customFramework}
                  onChange={e => setCustomFramework(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomFramework()}
                />
                <Button type="button" onClick={addCustomFramework} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {selectedFrameworks.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Selected Frameworks ({selectedFrameworks.length})
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {selectedFrameworks.map(framework => (
                      <Badge key={framework} variant="outline" className="flex items-center gap-1">
                        {framework}
                        <button
                          onClick={() => removeFramework(framework)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Template</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomTemplateBuilder;
