import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Star,
  DollarSign,
  Clock,
  Shield,
  Send,
  Download,
  Users,
  Calculator,
  ArrowRight,
  X,
  Mail,
  Phone,
  Building,
  User,
  Paperclip,
  FileText,
  Trash2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ROICalculator from '@/components/ROICalculator';

interface ComparisonViewProps {
  selectedVendors: any[];
  businessProfile: any;
  onNavigateToConsultants?: () => void;
  onBack?: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  selectedVendors,
  businessProfile,
  onNavigateToConsultants,
  onBack,
}) => {
  const [activeVendor, setActiveVendor] = useState<any>(null);
  const [showRfpForm, setShowRfpForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showROICalculator, setShowROICalculator] = useState(false);
  const [roiVendor, setRoiVendor] = useState<any>(null);
  const [contactVendor, setContactVendor] = useState<any>(null);
  const [leadCount, setLeadCount] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const [rfpData, setRfpData] = useState({
    projectName: '',
    budget: '',
    timeline: '',
    requirements: '',
    additionalInfo: '',
  });

  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    message: '',
  });

  // Enhanced vendor data with AI models
  const enhancedVendors = selectedVendors.map(vendor => ({
    ...vendor,
    aiModels: vendor.aiModels || ['GPT-4', 'Claude-3', 'Custom ML Models'],
    capabilities: vendor.capabilities || [
      'Natural Language Processing',
      'Pattern Recognition',
      'Anomaly Detection',
    ],
  }));

  if (selectedVendors.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Vendors Selected</h3>
          <p className="text-gray-600">
            Select vendors from the marketplace to compare their features and generate RFPs.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleRfpSubmit = (vendor: any) => {
    setActiveVendor(vendor);
    setShowRfpForm(true);
  };

  const handleContactVendor = (vendor: any) => {
    setContactVendor(vendor);
    setShowContactForm(true);
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitRfp = () => {
    // Store RFP data for tracking
    const rfpSubmission = {
      id: Date.now().toString(),
      vendor: activeVendor,
      projectName: rfpData.projectName,
      budget: rfpData.budget,
      timeline: rfpData.timeline,
      requirements: rfpData.requirements,
      additionalInfo: rfpData.additionalInfo,
      attachedFiles: attachedFiles.map(file => file.name),
      submittedAt: new Date().toISOString(),
      status: 'Sent',
    };

    // Store in localStorage for tracking
    const existingRfps = JSON.parse(localStorage.getItem('sentRfps') || '[]');
    existingRfps.push(rfpSubmission);
    localStorage.setItem('sentRfps', JSON.stringify(existingRfps));

    toast({
      title: 'RFP Sent Successfully',
      description: `Your RFP with ${attachedFiles.length} document(s) has been sent to ${activeVendor.name}. They will contact you within 2 business days.`,
    });

    setShowRfpForm(false);
    setActiveVendor(null);
    setAttachedFiles([]);
    setRfpData({
      projectName: '',
      budget: '',
      timeline: '',
      requirements: '',
      additionalInfo: '',
    });
  };

  const submitContactForm = () => {
    // Track lead
    const newLeadCount = leadCount + 1;
    setLeadCount(newLeadCount);

    toast({
      title: 'Contact Request Sent',
      description: `Your contact request has been sent to ${contactVendor.name}. Lead #${newLeadCount} recorded for your company.`,
    });

    setShowContactForm(false);
    setContactVendor(null);
    setContactData({
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      message: '',
    });
  };

  const generateComparisonReport = () => {
    toast({
      title: 'Comparison Report Generated',
      description:
        'Your vendor comparison report has been generated and will be downloaded shortly.',
    });
  };

  const handleROICalculation = (vendor: any) => {
    setRoiVendor(vendor);
    setShowROICalculator(true);
  };

  const handleNavigateToConsultants = () => {
    if (onNavigateToConsultants) {
      onNavigateToConsultants();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ROI Calculator Modal */}
      {showROICalculator && roiVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <ROICalculator
              vendor={roiVendor}
              onClose={() => {
                setShowROICalculator(false);
                setRoiVendor(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">Vendor Comparison</h2>
              <p className="text-blue-700">
                Compare {selectedVendors.length} selected vendors side by side
              </p>
              {leadCount > 0 && (
                <Badge variant="outline" className="mt-2 text-green-600 border-green-300">
                  {leadCount} lead{leadCount > 1 ? 's' : ''} generated
                </Badge>
              )}
            </div>
            <div className="flex space-x-3">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Marketplace
                </Button>
              )}
              <Button onClick={generateComparisonReport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Button onClick={handleNavigateToConsultants}>
                Find Consultants
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-900">Feature</th>
                  {enhancedVendors.map(vendor => (
                    <th
                      key={vendor.id}
                      className="text-left p-4 font-medium text-gray-900 min-w-48"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{vendor.logo}</span>
                        <span>{vendor.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium text-gray-700">Match Score</td>
                  {enhancedVendors.map(vendor => (
                    <td key={vendor.id} className="p-4">
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        {vendor.matchScore}%
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium text-gray-700">Rating</td>
                  {enhancedVendors.map(vendor => (
                    <td key={vendor.id} className="p-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{vendor.rating}</span>
                        <span className="text-gray-500 text-sm">({vendor.reviewCount})</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b bg-blue-50">
                  <td className="p-4 font-medium text-gray-700">AI Models Used</td>
                  {enhancedVendors.map(vendor => (
                    <td key={vendor.id} className="p-4">
                      <div className="space-y-1">
                        {vendor.aiModels.map((model: string, idx: number) => (
                          <Badge key={idx} variant="default" className="text-xs mr-1 bg-blue-600">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium text-gray-700">AI Capabilities</td>
                  {enhancedVendors.map(vendor => (
                    <td key={vendor.id} className="p-4">
                      <div className="space-y-1">
                        {vendor.capabilities.map((capability: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs mr-1">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium text-gray-700">Pricing</td>
                  {enhancedVendors.map(vendor => (
                    <td key={vendor.id} className="p-4">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{vendor.pricing}</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium text-gray-700">Implementation Time</td>
                  {enhancedVendors.map(vendor => (
                    <td key={vendor.id} className="p-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{vendor.implementation}</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium text-gray-700">Risk Areas Covered</td>
                  {enhancedVendors.map(vendor => (
                    <td key={vendor.id} className="p-4">
                      <div className="space-y-1">
                        {vendor.riskAreaMatch.map((area: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs mr-1">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium text-gray-700">Key Strengths</td>
                  {enhancedVendors.map(vendor => (
                    <td key={vendor.id} className="p-4">
                      <ul className="text-sm text-gray-600 space-y-1">
                        {vendor.strengths.slice(0, 2).map((strength: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-1">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enhancedVendors.map(vendor => (
          <Card key={vendor.id}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{vendor.logo}</span>
                <CardTitle className="text-lg">{vendor.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                Match Score:{' '}
                <span className="font-medium text-green-600">{vendor.matchScore}%</span>
              </div>
              <div className="space-y-2">
                <Button onClick={() => handleRfpSubmit(vendor)} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Send RFP
                </Button>
                <Button
                  onClick={() => handleROICalculation(vendor)}
                  variant="outline"
                  className="w-full"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate ROI
                </Button>
                <Button
                  onClick={() => handleContactVendor(vendor)}
                  variant="outline"
                  className="w-full"
                >
                  Contact Vendor
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Form Modal */}
      {showContactForm && contactVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Contact {contactVendor.name}</CardTitle>
                  <CardDescription>
                    Fill out the form below to get in touch with the vendor
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowContactForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="inline h-4 w-4 mr-1" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={contactData.name}
                    onChange={e => setContactData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactData.email}
                    onChange={e => setContactData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={contactData.phone}
                    onChange={e => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">
                    <Building className="inline h-4 w-4 mr-1" />
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={contactData.company}
                    onChange={e => setContactData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Your company name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position/Title</Label>
                <Input
                  id="position"
                  value={contactData.position}
                  onChange={e => setContactData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="e.g., Compliance Officer, Risk Manager"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={contactData.message}
                  onChange={e => setContactData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Tell them about your requirements and what you'd like to discuss..."
                  rows={4}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button onClick={submitContactForm} className="flex-1">
                  Send Contact Request
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowContactForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* RFP Form Modal */}
      {showRfpForm && activeVendor && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Send RFP to {activeVendor.name}</CardTitle>
                  <CardDescription>
                    Complete the form below to send a Request for Proposal to the vendor
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowRfpForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={rfpData.projectName}
                    onChange={e => setRfpData(prev => ({ ...prev, projectName: e.target.value }))}
                    placeholder="e.g., KYC System Implementation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget Range</Label>
                  <Select onValueChange={value => setRfpData(prev => ({ ...prev, budget: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-10k">Under $10k</SelectItem>
                      <SelectItem value="10k-50k">$10k - $50k</SelectItem>
                      <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                      <SelectItem value="100k-500k">$100k - $500k</SelectItem>
                      <SelectItem value="over-500k">Over $500k</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Implementation Timeline</Label>
                <Select onValueChange={value => setRfpData(prev => ({ ...prev, timeline: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">ASAP</SelectItem>
                    <SelectItem value="1-3months">1-3 months</SelectItem>
                    <SelectItem value="3-6months">3-6 months</SelectItem>
                    <SelectItem value="6-12months">6-12 months</SelectItem>
                    <SelectItem value="over-12months">Over 12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Specific Requirements</Label>
                <Textarea
                  id="requirements"
                  value={rfpData.requirements}
                  onChange={e => setRfpData(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="Describe your specific requirements, integration needs, compliance standards, etc."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Additional Information</Label>
                <Textarea
                  id="additionalInfo"
                  value={rfpData.additionalInfo}
                  onChange={e => setRfpData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  placeholder="Any additional context about your organization or project"
                  rows={3}
                />
              </div>

              {/* Document Attachment Section */}
              <div className="space-y-3 border-t pt-4">
                <Label>
                  <Paperclip className="inline h-4 w-4 mr-1" />
                  Attach Documents
                </Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileAttachment}
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: PDF, DOC, DOCX, TXT, XLS, XLSX (Max 10MB each)
                  </p>
                </div>

                {/* Display attached files */}
                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Attached Files:</Label>
                    <div className="space-y-1">
                      {attachedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachedFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <Button onClick={submitRfp} className="flex-1">
                  <Send className="mr-2 h-4 w-4" />
                  Send RFP
                </Button>
                <Button variant="outline" onClick={() => setShowRfpForm(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ComparisonView;
