import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ContactVendorModal } from '@/components/vendor/ContactVendorModal';
import {
  Star,
  ArrowLeft,
  Globe,
  Mail,
  MapPin,
  Award,
  Shield,
  Zap,
  CheckCircle,
  ExternalLink,
  Users,
  Building,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { vendorApi } from '@/lib/api';

interface VendorProfileProps {
  vendor: any;
  onBack: () => void;
  onSelect?: (vendor: any) => void;
  isSelected?: boolean;
}

const VendorProfile: React.FC<VendorProfileProps> = ({
  vendor,
  onBack,
  onSelect,
  isSelected = false,
}) => {
  const [contactModalOpen, setContactModalOpen] = useState(false);

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

  // Map backend categories to display names
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

  const displayCategories = vendor.categories?.map((cat: string) => categoryMap[cat] || cat) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-300 hover:text-white hover:bg-white/5"
            data-testid="button-back-marketplace"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
          <div className="flex space-x-3">
            {onSelect && (
              <Button
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => onSelect(vendor)}
                className={
                  isSelected
                    ? 'bg-cyan-500 hover:bg-cyan-600'
                    : 'hover:bg-cyan-500/10 hover:border-cyan-400'
                }
                data-testid="button-select-vendor"
              >
                {isSelected ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Selected
                  </>
                ) : (
                  'Select for Comparison'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <Card className="border-cyan-500/20 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start space-x-6">
              {/* Company Logo */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center text-3xl font-bold text-white border border-cyan-500/30">
                  {vendor.logoUrl ? (
                    <img
                      src={vendor.logoUrl}
                      alt={vendor.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    vendor.name.substring(0, 2).toUpperCase()
                  )}
                </div>
              </div>

              {/* Company Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent mb-2">
                      {vendor.name}
                    </h1>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {displayCategories.slice(0, 4).map((category, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={`border ${getCategoryColor(idx)}`}
                        >
                          {category}
                        </Badge>
                      ))}
                      {displayCategories.length > 4 && (
                        <Badge variant="outline" className="border-gray-500/30 text-gray-400">
                          +{displayCategories.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col gap-2">
                    {vendor.featured && (
                      <Badge className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-200 border-yellow-500/30">
                        ⭐ Featured
                      </Badge>
                    )}
                    {vendor.verified && (
                      <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-200 border-green-500/30">
                        ✓ Verified
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={
                        vendor.status === 'APPROVED'
                          ? 'border-green-500/30 text-green-300'
                          : 'border-yellow-500/30 text-yellow-300'
                      }
                    >
                      {vendor.status}
                    </Badge>
                  </div>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Rating */}
                  {vendor.rating > 0 && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5 border border-white/10">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <div>
                        <div className="text-lg font-semibold text-white">
                          {vendor.rating.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {vendor.reviewCount > 0
                            ? `${vendor.reviewCount} reviews`
                            : 'No reviews yet'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Company Info */}
                  {vendor.headquarters && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5 border border-white/10">
                      <MapPin className="h-5 w-5 text-cyan-400" />
                      <div>
                        <div className="text-sm font-medium text-white">Headquarters</div>
                        <div className="text-xs text-gray-300">{vendor.headquarters}</div>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {vendor.website && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5 border border-white/10">
                      <Globe className="h-5 w-5 text-pink-400" />
                      <div>
                        <div className="text-sm font-medium text-white">Website</div>
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center"
                        >
                          Visit site <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardContent className="p-6 text-center">
              <Button
                className="w-full bg-cyan-500 hover:bg-cyan-600"
                onClick={() => {
                  vendorApi.trackVendorClick(vendor.id);
                  if (vendor.website) {
                    window.open(vendor.website, '_blank');
                  }
                }}
                data-testid="button-visit-website"
              >
                <Globe className="mr-2 h-4 w-4" />
                Visit Website
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardContent className="p-6 text-center">
              <Button
                variant="outline"
                className="w-full hover:bg-cyan-500/10 hover:border-cyan-400"
                data-testid="button-request-demo"
              >
                <Eye className="mr-2 h-4 w-4" />
                Request Demo
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardContent className="p-6 text-center">
              <Button
                onClick={() => setContactModalOpen(true)}
                variant="outline"
                className="w-full hover:bg-pink-500/10 hover:border-pink-400"
                data-testid="button-contact-vendor"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Vendor
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/80 backdrop-blur border-border/50">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-gray-300"
              data-testid="tab-overview"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="solutions"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-gray-300"
              data-testid="tab-solutions"
            >
              Solutions
            </TabsTrigger>
            <TabsTrigger
              value="capabilities"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-gray-300"
              data-testid="tab-capabilities"
            >
              Capabilities
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-gray-300"
              data-testid="tab-contact"
            >
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Overview */}
              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Building className="h-5 w-5 text-cyan-400" />
                    <span>Company Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-gray-300 leading-relaxed">
                    {vendor.benefitsSnapshot ||
                      vendor.primaryProduct ||
                      `${vendor.name} is a leading compliance technology provider specializing in ${displayCategories.join(', ').toLowerCase()} solutions.`}
                  </div>

                  <Separator className="bg-border/30" />

                  <div className="space-y-3">
                    {vendor.customerSegments && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-400">Target Customers</span>
                        <span className="text-sm text-white">{vendor.customerSegments}</span>
                      </div>
                    )}

                    {vendor.deploymentOptions && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-400">Deployment</span>
                        <span className="text-sm text-white">{vendor.deploymentOptions}</span>
                      </div>
                    )}

                    {vendor.dataCoverage && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-400">Data Coverage</span>
                        <span className="text-sm text-white">{vendor.dataCoverage}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Key Strengths */}
              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <span>Key Strengths</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vendor.aiCapabilities && (
                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                        <Zap className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-white">AI Capabilities</div>
                          <div className="text-xs text-gray-300">{vendor.aiCapabilities}</div>
                        </div>
                      </div>
                    )}

                    {vendor.integrations && (
                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <Shield className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-white">Integrations</div>
                          <div className="text-xs text-gray-300">{vendor.integrations}</div>
                        </div>
                      </div>
                    )}

                    {vendor.awards && (
                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                        <Award className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-white">Awards & Recognition</div>
                          <div className="text-xs text-gray-300">{vendor.awards}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="solutions" className="space-y-6">
            <Card className="bg-card/80 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Shield className="h-5 w-5 text-green-400" />
                  <span>Primary Solutions</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Core compliance solutions offered by {vendor.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayCategories.map((category, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-cyan-500/5 to-pink-500/5 border border-cyan-500/20"
                    >
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <div>
                        <div className="font-medium text-white">{category}</div>
                        <div className="text-xs text-gray-400">Compliance solution</div>
                      </div>
                    </div>
                  ))}
                </div>

                {vendor.primaryProduct && (
                  <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <h4 className="font-medium text-white mb-2">Primary Product</h4>
                    <p className="text-sm text-gray-300">{vendor.primaryProduct}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capabilities" className="space-y-6">
            <Card className="bg-card/80 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Users className="h-5 w-5 text-purple-400" />
                  <span>Technical Capabilities</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Technology stack and deployment capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {vendor.maturityAssessment && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <h4 className="flex items-center space-x-2 font-medium text-white mb-2">
                      <Shield className="h-4 w-4 text-green-400" />
                      <span>Maturity Assessment</span>
                    </h4>
                    <p className="text-sm text-gray-300">{vendor.maturityAssessment}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendor.deploymentOptions && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-white">Deployment Options</h4>
                      <p className="text-sm text-gray-300">{vendor.deploymentOptions}</p>
                    </div>
                  )}

                  {vendor.dataCoverage && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-white">Data Coverage</h4>
                      <p className="text-sm text-gray-300">{vendor.dataCoverage}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Mail className="h-5 w-5 text-cyan-400" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vendor.website && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                      <Globe className="h-4 w-4 text-cyan-400" />
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cyan-300 hover:text-cyan-200 flex items-center"
                      >
                        {vendor.website.replace('https://', '').replace('http://', '')}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {vendor.contactEmail && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                      <Mail className="h-4 w-4 text-pink-400" />
                      <a
                        href={`mailto:${vendor.contactEmail}`}
                        className="text-sm text-pink-300 hover:text-pink-200"
                      >
                        {vendor.contactEmail}
                      </a>
                    </div>
                  )}

                  {vendor.headquarters && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                      <MapPin className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-white">{vendor.headquarters}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="text-white">Get Started</CardTitle>
                  <CardDescription className="text-gray-400">
                    Connect with {vendor.name} to learn more about their solutions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full bg-cyan-500 hover:bg-cyan-600"
                    onClick={() => {
                      vendorApi.trackVendorClick(vendor.id);
                      if (vendor.website) {
                        window.open(vendor.website, '_blank');
                      }
                    }}
                    data-testid="button-visit-website-contact"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Visit Website
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full hover:bg-cyan-500/10 hover:border-cyan-400"
                    data-testid="button-request-demo-contact"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Request Demo
                  </Button>

                  <Button
                    onClick={() => setContactModalOpen(true)}
                    variant="outline"
                    className="w-full hover:bg-pink-500/10 hover:border-pink-400"
                    data-testid="button-contact-vendor-form"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact Form
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Vendor Modal */}
        <ContactVendorModal
          open={contactModalOpen}
          onOpenChange={setContactModalOpen}
          vendorId={vendor.id}
          vendorName={vendor.name}
        />
      </div>
    </div>
  );
};

export default VendorProfile;
