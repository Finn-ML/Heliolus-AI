import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building, Upload, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VendorOnboardingProps {
  onComplete: () => void;
  onCancel: () => void;
}

const VendorOnboarding: React.FC<VendorOnboardingProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    website: '',
    logo: '',
    description: '',
    foundedYear: '',
    headquarters: '',
    employeeCount: '',

    // Solution Information
    category: '',
    subCategories: [] as string[],
    features: [] as string[],
    certifications: [] as string[],
    pricing: '',
    implementationTime: '',

    // Contact Information
    contactName: '',
    contactEmail: '',
    contactPhone: '',

    // Additional Information
    clientTypes: [] as string[],
    supportedRegions: [] as string[],
    integrations: [] as string[],
    casStudies: '',

    // Legal
    termsAccepted: false,
    dataProcessingAccepted: false,
  });

  const [newFeature, setNewFeature] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newIntegration, setNewIntegration] = useState('');

  const categories = [
    'Customer Due Diligence',
    'Transaction Monitoring',
    'Sanctions Screening',
    'Risk Assessment',
    'Regulatory Reporting',
    'All-in-One Solution',
    'Data Analytics',
    'Case Management',
  ];

  const clientTypes = [
    'Banks',
    'Credit Unions',
    'Payment Processors',
    'Fintech Companies',
    'Insurance Companies',
    'Investment Firms',
    'Cryptocurrency Exchanges',
    'Money Service Businesses',
  ];

  const regions = [
    'North America',
    'Europe',
    'Asia-Pacific',
    'Latin America',
    'Middle East',
    'Africa',
  ];

  const addToArray = (
    field: keyof typeof formData,
    value: string,
    setter: (value: string) => void
  ) => {
    if (value.trim()) {
      const currentArray = formData[field] as string[];
      if (!currentArray.includes(value.trim())) {
        setFormData(prev => ({
          ...prev,
          [field]: [...currentArray, value.trim()],
        }));
      }
      setter('');
    }
  };

  const removeFromArray = (field: keyof typeof formData, index: number) => {
    const currentArray = formData[field] as string[];
    setFormData(prev => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.termsAccepted || !formData.dataProcessingAccepted) {
      toast({
        title: 'Please accept the terms',
        description: 'You must accept the terms and conditions to proceed.',
        variant: 'destructive',
      });
      return;
    }

    // Save to localStorage (in a real app, this would be sent to a server)
    const existingVendors = JSON.parse(localStorage.getItem('pendingVendors') || '[]');
    const newVendor = {
      ...formData,
      id: Date.now().toString(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    localStorage.setItem('pendingVendors', JSON.stringify([...existingVendors, newVendor]));

    toast({
      title: 'Application Submitted!',
      description:
        "Your vendor application has been submitted for review. We'll contact you within 2-3 business days.",
    });

    onComplete();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="Enter your company name"
            />
          </div>
          <div>
            <Label htmlFor="website">Website *</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://your-company.com"
            />
          </div>
          <div>
            <Label htmlFor="foundedYear">Founded Year</Label>
            <Input
              id="foundedYear"
              value={formData.foundedYear}
              onChange={e => setFormData(prev => ({ ...prev, foundedYear: e.target.value }))}
              placeholder="2020"
            />
          </div>
          <div>
            <Label htmlFor="headquarters">Headquarters</Label>
            <Input
              id="headquarters"
              value={formData.headquarters}
              onChange={e => setFormData(prev => ({ ...prev, headquarters: e.target.value }))}
              placeholder="San Francisco, CA"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="employeeCount">Employee Count</Label>
            <Select
              onValueChange={value => setFormData(prev => ({ ...prev, employeeCount: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-1000">201-1000 employees</SelectItem>
                <SelectItem value="1000+">1000+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Company Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your company and what makes your compliance solutions unique..."
          rows={4}
        />
      </div>

      <div>
        <Label>Company Logo</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600">Upload your company logo (PNG, JPG, SVG)</p>
          <Button variant="outline" className="mt-2">
            Choose File
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Solution Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Primary Category *</Label>
            <Select onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select primary category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="pricing">Pricing Range *</Label>
            <Input
              id="pricing"
              value={formData.pricing}
              onChange={e => setFormData(prev => ({ ...prev, pricing: e.target.value }))}
              placeholder="e.g., $500-2000/month"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="implementationTime">Implementation Time</Label>
        <Input
          id="implementationTime"
          value={formData.implementationTime}
          onChange={e => setFormData(prev => ({ ...prev, implementationTime: e.target.value }))}
          placeholder="e.g., 2-4 weeks"
        />
      </div>

      <div>
        <Label>Key Features</Label>
        <div className="flex space-x-2 mb-2">
          <Input
            value={newFeature}
            onChange={e => setNewFeature(e.target.value)}
            placeholder="Add a key feature"
            onKeyPress={e => e.key === 'Enter' && addToArray('features', newFeature, setNewFeature)}
          />
          <Button
            variant="outline"
            onClick={() => addToArray('features', newFeature, setNewFeature)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.features.map((feature, index) => (
            <Badge key={index} variant="secondary">
              {feature}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => removeFromArray('features', index)}
              />
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label>Certifications & Compliance</Label>
        <div className="flex space-x-2 mb-2">
          <Input
            value={newCertification}
            onChange={e => setNewCertification(e.target.value)}
            placeholder="Add certification (e.g., SOC 2, ISO 27001)"
            onKeyPress={e =>
              e.key === 'Enter' &&
              addToArray('certifications', newCertification, setNewCertification)
            }
          />
          <Button
            variant="outline"
            onClick={() => addToArray('certifications', newCertification, setNewCertification)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.certifications.map((cert, index) => (
            <Badge key={index} variant="outline">
              {cert}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => removeFromArray('certifications', index)}
              />
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>

        <div className="space-y-4">
          <div>
            <Label>Target Client Types</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {clientTypes.map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={formData.clientTypes.includes(type)}
                    onCheckedChange={checked => {
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          clientTypes: [...prev.clientTypes, type],
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          clientTypes: prev.clientTypes.filter(t => t !== type),
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={type} className="text-sm">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Supported Regions</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {regions.map(region => (
                <div key={region} className="flex items-center space-x-2">
                  <Checkbox
                    id={region}
                    checked={formData.supportedRegions.includes(region)}
                    onCheckedChange={checked => {
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          supportedRegions: [...prev.supportedRegions, region],
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          supportedRegions: prev.supportedRegions.filter(r => r !== region),
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={region} className="text-sm">
                    {region}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Integrations</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={newIntegration}
                onChange={e => setNewIntegration(e.target.value)}
                placeholder="Add integration (e.g., Salesforce, ServiceNow)"
                onKeyPress={e =>
                  e.key === 'Enter' && addToArray('integrations', newIntegration, setNewIntegration)
                }
              />
              <Button
                variant="outline"
                onClick={() => addToArray('integrations', newIntegration, setNewIntegration)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.integrations.map((integration, index) => (
                <Badge key={index} variant="secondary">
                  {integration}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => removeFromArray('integrations', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="contactName">Primary Contact Name *</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
              placeholder="John Smith"
            />
          </div>
          <div>
            <Label htmlFor="contactEmail">Contact Email *</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="john@company.com"
            />
          </div>
          <div>
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={e => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="caseStudies">Case Studies or Success Stories</Label>
        <Textarea
          id="caseStudies"
          value={formData.casStudies}
          onChange={e => setFormData(prev => ({ ...prev, casStudies: e.target.value }))}
          placeholder="Share some success stories or case studies that demonstrate your solution's effectiveness..."
          rows={4}
        />
      </div>

      <div className="legal-agreements-section space-y-4 p-4 rounded-lg" style={{ backgroundColor: '#f9fafb', color: '#111827' }}>
        <h4 className="font-medium" style={{ color: '#111827 !important' }}>Legal Agreements</h4>
        <div className="space-y-3" style={{ color: '#111827' }}>
          <div className="flex items-start space-x-3" style={{ color: '#111827' }}>
            <Checkbox
              id="terms"
              checked={formData.termsAccepted}
              onCheckedChange={checked =>
                setFormData(prev => ({ ...prev, termsAccepted: !!checked }))
              }
            />
            <label htmlFor="terms" className="text-sm leading-5" style={{ color: '#111827', display: 'inline', fontWeight: '500' }}>
              I agree to the{' '}
              <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Terms of Service
              </a>{' '}
              and marketplace listing guidelines *
            </label>
          </div>
          <div className="flex items-start space-x-3" style={{ color: '#111827' }}>
            <Checkbox
              id="privacy"
              checked={formData.dataProcessingAccepted}
              onCheckedChange={checked =>
                setFormData(prev => ({ ...prev, dataProcessingAccepted: !!checked }))
              }
            />
            <label htmlFor="privacy" className="text-sm leading-5" style={{ color: '#111827', display: 'inline', fontWeight: '500' }}>
              I consent to the processing of my data as described in the{' '}
              <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Privacy Policy
              </a>{' '}
              *
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Join as Technology Vendor</span>
                </CardTitle>
                <CardDescription>
                  Step {step} of 4 - Complete your vendor profile to get listed in our marketplace
                </CardDescription>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            <div className="flex justify-between pt-6 border-t">
              <Button variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : onCancel())}>
                {step === 1 ? 'Cancel' : 'Previous'}
              </Button>

              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 &&
                      (!formData.companyName || !formData.website || !formData.description)) ||
                    (step === 2 && (!formData.category || !formData.pricing))
                  }
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.contactName ||
                    !formData.contactEmail ||
                    !formData.termsAccepted ||
                    !formData.dataProcessingAccepted
                  }
                >
                  Submit Application
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorOnboarding;
