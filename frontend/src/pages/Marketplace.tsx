import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building, FileText, Store, Plus } from 'lucide-react';
import VendorMarketplace from '@/components/VendorMarketplace';
import RfpTracking from '@/components/RfpTracking';
import ComparisonView from '@/components/ComparisonView';
import VendorOnboarding from '@/components/VendorOnboarding';
import { RFPFormModal } from '@/components/rfp/RFPFormModal';
import { InlinePremiumGate } from '@/components/subscription/PremiumFeatureGate';
import { organizationApi } from '@/lib/api';

interface MarketplaceProps {
  // Optional props for when connected to main workflow
  businessProfile?: any;
  riskData?: any;
  isConnected?: boolean;
}

const Marketplace: React.FC<MarketplaceProps> = ({
  businessProfile,
  riskData,
  isConnected = false,
}) => {
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get('assessmentId') || undefined;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('vendors');
  const [selectedVendors, setSelectedVendors] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showVendorOnboarding, setShowVendorOnboarding] = useState(false);
  const [showRFPModal, setShowRFPModal] = useState(false);

  // Fetch user's organization for RFP creation
  const { data: organization } = useQuery({
    queryKey: ['organization', 'my'],
    queryFn: organizationApi.getMyOrganization,
    enabled: !!localStorage.getItem('token'),
    retry: false,
  });

  if (showComparison) {
    return (
      <ComparisonView
        selectedVendors={selectedVendors}
        businessProfile={businessProfile}
        onBack={() => setShowComparison(false)}
      />
    );
  }

  if (showVendorOnboarding) {
    return (
      <VendorOnboarding
        onComplete={() => setShowVendorOnboarding(false)}
        onCancel={() => setShowVendorOnboarding(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="border-cyan-500/20 bg-gradient-to-r from-card/50 to-card/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Compliance Technology Marketplace
                </h1>
                <p className="text-gray-200 text-lg">
                  {isConnected
                    ? 'Find solutions tailored to your risk assessment and business profile'
                    : 'Discover compliance technology vendors and manage your RFPs'}
                </p>
                {isConnected && (
                  <div className="flex items-center space-x-4 mt-4">
                    <Badge
                      variant="secondary"
                      className="bg-green-900/50 text-green-200 border-green-500/30"
                    >
                      <Building className="mr-1 h-3 w-3" />
                      Profile Complete
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-blue-900/50 text-blue-200 border-blue-500/30"
                    >
                      <FileText className="mr-1 h-3 w-3" />
                      Risk Assessment Complete
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <InlinePremiumGate
                  featureName="RFP Creation"
                  onUpgradeClick={() => navigate('/settings/subscription')}
                >
                  <Button
                    onClick={() => setShowRFPModal(true)}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 w-full sm:w-auto"
                    data-testid="button-create-rfp"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Create RFP</span>
                  </Button>
                </InlinePremiumGate>
                <Button
                  variant="outline"
                  onClick={() => setShowVendorOnboarding(true)}
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                  data-testid="button-join-vendor"
                >
                  <Store className="h-4 w-4" />
                  <span>Join as Vendor</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-card/80 backdrop-blur-sm border-border/50">
            <TabsTrigger
              value="vendors"
              className="flex items-center space-x-2 data-[state=active]:bg-primary/20 data-[state=active]:text-white text-gray-300"
            >
              <Building className="h-4 w-4" />
              <span>Technology Vendors</span>
            </TabsTrigger>
            <TabsTrigger
              value="rfps"
              className="flex items-center space-x-2 data-[state=active]:bg-primary/20 data-[state=active]:text-white text-gray-300"
            >
              <FileText className="h-4 w-4" />
              <span>RFP Tracking</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendors" className="space-y-6">
            <VendorMarketplace
              businessProfile={businessProfile}
              riskData={riskData}
              selectedVendors={selectedVendors}
              onVendorSelect={setSelectedVendors}
              onNavigateToCompare={() => setShowComparison(true)}
              assessmentId={assessmentId}
            />
          </TabsContent>

          <TabsContent value="rfps" className="space-y-6">
            <RfpTracking />
          </TabsContent>
        </Tabs>
      </div>

      {/* RFP Form Modal */}
      {organization?.id && (
        <RFPFormModal
          open={showRFPModal}
          onOpenChange={setShowRFPModal}
          organizationId={organization.id}
        />
      )}
    </div>
  );
};

export default Marketplace;
