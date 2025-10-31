import React, { useState, useEffect } from 'react';
import { Building2, BarChart3, FileText, Shield, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import BusinessProfile from '@/components/BusinessProfile';
import DocumentStorage from '@/components/DocumentStorage';
import TrackingDashboard from '@/components/TrackingDashboard';
import { PurchaseAssessmentButton } from '@/components/PurchaseAssessmentButton';
import Reports from '@/pages/Reports';
import { useQuery } from '@tanstack/react-query';
import { organizationApi, queryKeys } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { cn } from '@/lib/utils';

const Index = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [animateTab, setAnimateTab] = useState(false);
  const { user } = useAuth();
  const { startTour, hasCompleted } = useOnboarding();
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldHighlightPurchase = searchParams.get('purchase') === 'true';

  // Auto-start tour for first-time users
  useEffect(() => {
    if (user && !hasCompleted && user.role === 'USER') {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        startTour();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user, hasCompleted, startTour]);

  // Clear purchase param after component mounts
  useEffect(() => {
    if (shouldHighlightPurchase) {
      // Remove the purchase param after a delay
      const timer = setTimeout(() => {
        searchParams.delete('purchase');
        setSearchParams(searchParams);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [shouldHighlightPurchase, searchParams, setSearchParams]);

  // Fetch organization data to get organizationId for DocumentStorage
  const { data: organization } = useQuery({
    queryKey: queryKeys.myOrganization,
    queryFn: organizationApi.getMyOrganization,
    enabled: !!user?.id,
    retry: 1,
  });

  const tabs = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: BarChart3,
      color: 'cyan',
      bgClass: 'bg-cyan-500/20',
      borderClass: 'border-cyan-500/50',
      glowClass: 'glow-cyan',
      auraClass: 'bg-cyan-500',
      iconBgClass: 'bg-cyan-500/20',
      iconTextClass: 'text-cyan-400',
    },
    {
      id: 'profile',
      title: 'Business Profile',
      icon: Building2,
      color: 'pink',
      bgClass: 'bg-pink-500/20',
      borderClass: 'border-pink-500/50',
      glowClass: 'glow-pink',
      auraClass: 'bg-pink-500',
      iconBgClass: 'bg-pink-500/20',
      iconTextClass: 'text-pink-400',
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: FileText,
      color: 'purple',
      bgClass: 'bg-purple-500/20',
      borderClass: 'border-purple-500/50',
      glowClass: 'glow-purple',
      auraClass: 'bg-purple-500',
      iconBgClass: 'bg-purple-500/20',
      iconTextClass: 'text-purple-400',
    },
  ];

  const handleTabClick = (index: number) => {
    setAnimateTab(true);
    setTimeout(() => {
      setCurrentTab(index);
      setAnimateTab(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-5"
            style={{
              left: `${30 + i * 25}%`,
              top: `${20 + i * 20}%`,
              animation: `float ${20 + i * 5}s infinite ease-in-out`,
            }}
          >
            <div
              className={`w-96 h-96 rounded-full bg-gradient-to-br ${
                i % 2 === 0 ? 'from-cyan-500 to-cyan-400' : 'from-pink-500 to-pink-400'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Header Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dashboard Title */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-cyan-500/20 backdrop-blur-sm">
            <Shield className="h-10 w-10 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 gradient-text">Risk Management Dashboard</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Comprehensive tools to manage your organization's compliance and risk assessment needs
          </p>
        </div>

        {/* Tab Navigation with Glass Morphism */}
        <div className="mb-8 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-gray-800">
          <div className="flex items-stretch">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = index === currentTab;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(index)}
                  className={cn(
                    'relative flex-1 px-6 py-4 flex flex-col items-center justify-center gap-2',
                    'transition-all duration-300 cursor-pointer group',
                    'first:rounded-tl-2xl first:rounded-tr-none last:rounded-tr-2xl last:rounded-tl-none',
                    'hover:bg-gray-800/30',
                    isActive && `${tab.bgClass} ${tab.borderClass}`
                  )}
                  data-testid={`tab-${tab.id}`}
                  data-tour={tab.id === 'profile' ? 'business-profile-tab' : undefined}
                >
                  {/* Active Tab Background Glow */}
                  {isActive && (
                    <div className={`absolute inset-0 ${tab.auraClass} opacity-10 blur-2xl`} />
                  )}

                  {/* Tab Content */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        'p-2 rounded-lg transition-all duration-300',
                        isActive
                          ? `${tab.bgClass} ${tab.borderClass} border`
                          : 'group-hover:bg-gray-800/50'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-6 w-6 transition-all duration-300',
                          isActive ? tab.iconTextClass : 'text-gray-400 group-hover:text-gray-300'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors duration-300',
                        isActive ? tab.iconTextClass : 'text-gray-500 group-hover:text-gray-400'
                      )}
                    >
                      {tab.title}
                    </span>
                  </div>

                  {/* Active Tab Indicator Bar */}
                  {isActive && (
                    <div
                      className={cn(
                        'absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300',
                        `bg-gradient-to-r ${
                          tab.color === 'cyan'
                            ? 'from-cyan-500 to-cyan-400'
                            : tab.color === 'pink'
                              ? 'from-pink-500 to-pink-400'
                              : 'from-purple-500 to-purple-400'
                        }`
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div
          className={cn(
            'transition-all duration-500 transform',
            animateTab ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          )}
        >
          {/* Dashboard Tab */}
          {currentTab === 0 && (
            <div className="w-full space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span className="text-cyan-400 text-sm font-medium">
                    Compliance Tracking Center
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Monitor Your Progress</h2>
                <p className="text-gray-400">
                  Track compliance metrics, risks, and assessment progress in real-time
                </p>
              </div>

              {/* Purchase Additional Assessment Button (Premium users only) */}
              <div className="flex justify-center mb-6">
                <PurchaseAssessmentButton shouldHighlight={shouldHighlightPurchase} />
              </div>

              <TrackingDashboard />
            </div>
          )}

          {/* Business Profile Tab */}
          {currentTab === 1 && (
            <div className="w-full space-y-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-4">
                  <Building2 className="h-4 w-4 text-pink-400" />
                  <span className="text-pink-400 text-sm font-medium">Organization Management</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Business Profile & Documents</h2>
                <p className="text-gray-400">
                  Configure your organization details and manage compliance documentation
                </p>
              </div>

              {/* Business Profile Section */}
              <div data-tour="business-profile-form">
                <BusinessProfile onProfileComplete={setBusinessProfile} />
              </div>

              {/* Document Storage Section */}
              <DocumentStorage
                organizationId={organization?.id || null}
                className="transition-all duration-500"
              />
            </div>
          )}

          {/* Reports Tab */}
          {currentTab === 2 && (
            <div className="w-full space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                  <FileText className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-400 text-sm font-medium">Assessment Reports</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Risk Analysis & Insights</h2>
                <p className="text-gray-400">
                  View comprehensive risk assessment results and recommendations
                </p>
              </div>
              <Reports />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
