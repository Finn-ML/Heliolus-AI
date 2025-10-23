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
import { ArrowLeft, User, Upload, Plus, X, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ConsultantOnboardingProps {
  onComplete: () => void;
  onCancel: () => void;
}

const ConsultantOnboarding: React.FC<ConsultantOnboardingProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    location: '',
    photo: '',
    linkedInProfile: '',

    // Professional Information
    type: '',
    description: '',
    experience: '',
    hourlyRate: '',
    projectRate: '',
    teamSize: '',
    availability: '',

    // Expertise & Skills
    expertise: [] as string[],
    certifications: [] as string[],
    specializations: [] as string[],
    aiModels: [] as string[],
    languages: [] as string[],

    // Business Information
    companyName: '',
    clientTypes: [] as string[],
    completedProjects: '',

    // Verification
    linkedInVerified: false,
    companyVerified: false,
    complianceCertified: false,

    // Legal
    termsAccepted: false,
    dataProcessingAccepted: false,
  });

  const [newExpertise, setNewExpertise] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const consultantTypes = [
    'Independent Consultant',
    'Compliance Firm',
    'Systems Integrator',
    'Implementation Partner',
    'Training Provider',
  ];

  const expertiseAreas = [
    'AML/BSA Compliance',
    'KYC Implementation',
    'Transaction Monitoring',
    'Sanctions Screening',
    'Risk Assessment',
    'Regulatory Reporting',
    'GDPR Compliance',
    'SOX Compliance',
    'PCI DSS',
    'Data Analytics',
    'Process Automation',
    'Staff Training',
  ];

  const clientTypeOptions = [
    'Banks',
    'Credit Unions',
    'Payment Processors',
    'Fintech Companies',
    'Insurance Companies',
    'Investment Firms',
    'Cryptocurrency Exchanges',
    'Money Service Businesses',
    'Government Agencies',
    'Non-profits',
  ];

  const availabilityOptions = [
    'Available immediately',
    'Available in 2-4 weeks',
    'Available in 1-2 months',
    'Project-based only',
    'Long-term contracts only',
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
    const existingConsultants = JSON.parse(localStorage.getItem('pendingConsultants') || '[]');
    const newConsultant = {
      ...formData,
      id: Date.now(),
      rating: 0,
      reviewCount: 0,
      matchScore: 0,
      verificationStatus: {
        isVerified: false,
        linkedInVerified: formData.linkedInVerified,
        companyVerified: formData.companyVerified,
        complianceCertified: formData.complianceCertified,
        verificationDate: new Date().toISOString(),
        linkedInProfile: formData.linkedInProfile,
      },
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      'pendingConsultants',
      JSON.stringify([...existingConsultants, newConsultant])
    );

    toast({
      title: 'Application Submitted!',
      description:
        "Your consultant profile has been submitted for review. We'll contact you within 2-3 business days.",
    });

    onComplete();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="John Smith"
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="San Francisco, CA"
            />
          </div>
          <div>
            <Label htmlFor="linkedIn">LinkedIn Profile</Label>
            <Input
              id="linkedIn"
              value={formData.linkedInProfile}
              onChange={e => setFormData(prev => ({ ...prev, linkedInProfile: e.target.value }))}
              placeholder="https://linkedin.com/in/johnsmith"
            />
          </div>
        </div>
      </div>

      <div>
        <Label>Professional Photo</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600">Upload your professional photo (PNG, JPG)</p>
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
        <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Consultant Type *</Label>
            <Select onValueChange={value => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select consultant type" />
              </SelectTrigger>
              <SelectContent>
                {consultantTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="experience">Years of Experience *</Label>
            <Select onValueChange={value => setFormData(prev => ({ ...prev, experience: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-3 years">1-3 years</SelectItem>
                <SelectItem value="4-7 years">4-7 years</SelectItem>
                <SelectItem value="8-12 years">8-12 years</SelectItem>
                <SelectItem value="13-20 years">13-20 years</SelectItem>
                <SelectItem value="20+ years">20+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="hourlyRate">Hourly Rate</Label>
            <Input
              id="hourlyRate"
              value={formData.hourlyRate}
              onChange={e => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
              placeholder="$150-300/hour"
            />
          </div>
          <div>
            <Label htmlFor="projectRate">Project Rate Range</Label>
            <Input
              id="projectRate"
              value={formData.projectRate}
              onChange={e => setFormData(prev => ({ ...prev, projectRate: e.target.value }))}
              placeholder="$15K-50K"
            />
          </div>
          <div>
            <Label htmlFor="teamSize">Team Size</Label>
            <Select onValueChange={value => setFormData(prev => ({ ...prev, teamSize: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select team size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Solo consultant">Solo consultant</SelectItem>
                <SelectItem value="2-5 people">2-5 people</SelectItem>
                <SelectItem value="6-15 people">6-15 people</SelectItem>
                <SelectItem value="16-50 people">16-50 people</SelectItem>
                <SelectItem value="50+ people">50+ people</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Availability</Label>
            <Select
              onValueChange={value => setFormData(prev => ({ ...prev, availability: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select availability" />
              </SelectTrigger>
              <SelectContent>
                {availabilityOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Professional Summary *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your background, expertise, and what makes you unique as a compliance consultant..."
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="companyName">Company Name (if applicable)</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
          placeholder="Your consulting firm name"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Expertise & Skills</h3>

        <div className="space-y-4">
          <div>
            <Label>Areas of Expertise</Label>
            <div className="flex space-x-2 mb-2">
              <Select value={newExpertise} onValueChange={setNewExpertise}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select expertise area" />
                </SelectTrigger>
                <SelectContent>
                  {expertiseAreas.map(area => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => addToArray('expertise', newExpertise, setNewExpertise)}
                disabled={!newExpertise}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.expertise.map((exp, index) => (
                <Badge key={index} variant="secondary">
                  {exp}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => removeFromArray('expertise', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Certifications</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={newCertification}
                onChange={e => setNewCertification(e.target.value)}
                placeholder="Add certification (e.g., CAMS, CFCS, CPA)"
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

          <div>
            <Label>Specializations</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={newSpecialization}
                onChange={e => setNewSpecialization(e.target.value)}
                placeholder="Add specialization (e.g., Banking, Fintech, Healthcare)"
                onKeyPress={e =>
                  e.key === 'Enter' &&
                  addToArray('specializations', newSpecialization, setNewSpecialization)
                }
              />
              <Button
                variant="outline"
                onClick={() =>
                  addToArray('specializations', newSpecialization, setNewSpecialization)
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.specializations.map((spec, index) => (
                <Badge key={index} variant="secondary">
                  {spec}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => removeFromArray('specializations', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Languages</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={newLanguage}
                onChange={e => setNewLanguage(e.target.value)}
                placeholder="Add language (e.g., English, Spanish, French)"
                onKeyPress={e =>
                  e.key === 'Enter' && addToArray('languages', newLanguage, setNewLanguage)
                }
              />
              <Button
                variant="outline"
                onClick={() => addToArray('languages', newLanguage, setNewLanguage)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((lang, index) => (
                <Badge key={index} variant="outline">
                  {lang}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => removeFromArray('languages', index)}
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
        <h3 className="text-lg font-semibold mb-4">Business Information & Verification</h3>

        <div className="space-y-4">
          <div>
            <Label>Target Client Types</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {clientTypeOptions.map(type => (
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
            <Label htmlFor="completedProjects">Number of Completed Compliance Projects</Label>
            <Select
              onValueChange={value => setFormData(prev => ({ ...prev, completedProjects: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select number of projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-5">1-5 projects</SelectItem>
                <SelectItem value="6-15">6-15 projects</SelectItem>
                <SelectItem value="16-30">16-30 projects</SelectItem>
                <SelectItem value="31-50">31-50 projects</SelectItem>
                <SelectItem value="50+">50+ projects</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Verification Options</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="linkedInVerification"
                  checked={formData.linkedInVerified}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, linkedInVerified: !!checked }))
                  }
                />
                <Label htmlFor="linkedInVerification" className="text-sm">
                  Verify LinkedIn profile (increases trust score)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="companyVerification"
                  checked={formData.companyVerified}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, companyVerified: !!checked }))
                  }
                />
                <Label htmlFor="companyVerification" className="text-sm">
                  Verify company registration (for business entities)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="complianceVerification"
                  checked={formData.complianceCertified}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, complianceCertified: !!checked }))
                  }
                />
                <Label htmlFor="complianceVerification" className="text-sm">
                  Verify compliance certifications (upload certificates)
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">Legal Agreements</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, termsAccepted: !!checked }))
                  }
                />
                <Label htmlFor="terms" className="text-sm leading-5">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and consultant marketplace guidelines *
                </Label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy"
                  checked={formData.dataProcessingAccepted}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, dataProcessingAccepted: !!checked }))
                  }
                />
                <Label htmlFor="privacy" className="text-sm leading-5">
                  I consent to the processing of my data as described in the
                  <a href="#" className="text-blue-600 hover:underline">
                    {' '}
                    Privacy Policy
                  </a>{' '}
                  *
                </Label>
              </div>
            </div>
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
                  <User className="h-5 w-5" />
                  <span>Join as Expert Consultant</span>
                </CardTitle>
                <CardDescription>
                  Step {step} of 4 - Create your consultant profile to connect with clients
                </CardDescription>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
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
                    (step === 1 && (!formData.name || !formData.email || !formData.location)) ||
                    (step === 2 &&
                      (!formData.type || !formData.description || !formData.experience))
                  }
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.termsAccepted || !formData.dataProcessingAccepted}
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

export default ConsultantOnboarding;
