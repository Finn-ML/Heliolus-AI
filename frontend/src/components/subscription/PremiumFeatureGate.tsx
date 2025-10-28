import React from 'react';
import { Crown, Lock, Loader2 } from 'lucide-react';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface PremiumFeatureGateProps {
  children: React.ReactNode;
  featureName?: string;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  onUpgradeClick?: () => void;
}

export function PremiumFeatureGate({
  children,
  featureName = 'this feature',
  fallback,
  showUpgradePrompt = true,
  onUpgradeClick,
}: PremiumFeatureGateProps) {
  const { canAccessPremiumFeature, isLoading, isError, planName } = useSubscriptionCheck();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Unable to verify subscription status. Please refresh the page and try again.
        </AlertDescription>
      </Alert>
    );
  }

  // User has premium access - show the feature
  if (canAccessPremiumFeature) {
    return <>{children}</>;
  }

  // User doesn't have premium access - show fallback or upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  // Default upgrade prompt
  return (
    <Card className="border-cyan-500/20 bg-gradient-to-br from-card/50 to-card/80">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <Crown className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-cyan-400" />
              Premium Feature
            </CardTitle>
            <CardDescription>
              Upgrade to access {featureName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
          <p className="text-sm text-gray-300 mb-4">
            You're currently on the <span className="font-semibold text-white">{planName}</span> plan.
            Upgrade to <span className="font-semibold text-cyan-400">Premium</span> to unlock:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <Crown className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>Create and send unlimited RFPs to vendors</span>
            </li>
            <li className="flex items-start gap-2">
              <Crown className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>Track vendor responses and manage leads</span>
            </li>
            <li className="flex items-start gap-2">
              <Crown className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>Generate comprehensive compliance reports</span>
            </li>
            <li className="flex items-start gap-2">
              <Crown className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>Priority support and advanced analytics</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onUpgradeClick}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Button>
          <Button variant="outline" className="flex-1">
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline version for smaller UI elements
interface InlinePremiumGateProps {
  children: React.ReactNode;
  featureName?: string;
  onUpgradeClick?: () => void;
}

export function InlinePremiumGate({ children, featureName = 'this feature', onUpgradeClick }: InlinePremiumGateProps) {
  const { canAccessPremiumFeature, isLoading } = useSubscriptionCheck();

  if (isLoading) {
    return (
      <Button disabled size="sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (canAccessPremiumFeature) {
    return <>{children}</>;
  }

  return (
    <Button
      onClick={onUpgradeClick}
      variant="outline"
      size="sm"
      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
    >
      <Lock className="mr-2 h-4 w-4" />
      Upgrade for {featureName}
    </Button>
  );
}
