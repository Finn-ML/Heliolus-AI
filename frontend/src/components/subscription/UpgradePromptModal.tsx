import { useState } from 'react';
import { Crown, Check, X, Loader2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { subscriptionApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UpgradePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  description?: string;
}

const PREMIUM_FEATURES = [
  'Unlimited RFP creation and distribution',
  'Advanced vendor matching and filtering',
  'Lead tracking and management dashboard',
  'Comprehensive compliance reports',
  'Priority email support',
  'Custom assessment templates',
  'Advanced analytics and insights',
  'Export data to CSV/PDF',
];

const FREE_FEATURES = [
  'Basic compliance assessments',
  'Vendor marketplace access',
  'Limited RFPs (3 per month)',
  'Community support',
];

export function UpgradePromptModal({
  open,
  onOpenChange,
  featureName = 'this premium feature',
  description,
}: UpgradePromptModalProps) {
  const { planName, subscription } = useSubscriptionCheck();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);

    try {
      const result = await subscriptionApi.createCheckout('PREMIUM');

      // Redirect to Stripe checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast({
          title: 'Checkout session created',
          description: 'Redirecting to payment page...',
        });
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);

      toast({
        title: 'Failed to start upgrade',
        description: error.message || 'Please try again or contact support.',
        variant: 'destructive',
      });

      setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-cyan-500/20 to-pink-500/20">
              <Crown className="h-8 w-8 text-cyan-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {description || `Unlock ${featureName} and much more with a Premium subscription`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan Badge */}
          <div className="flex justify-center">
            <Badge variant="outline" className="text-sm px-4 py-1">
              Current Plan: {planName}
            </Badge>
          </div>

          {/* Feature Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Free Plan</h3>
                <Badge variant="secondary">Current</Badge>
              </div>
              <p className="text-2xl font-bold mb-4">$0<span className="text-sm text-gray-400">/month</span></p>
              <ul className="space-y-2">
                {FREE_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium Plan */}
            <div className="border-2 border-cyan-500 rounded-lg p-4 bg-gradient-to-br from-cyan-500/10 to-pink-500/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white">
                  Most Popular
                </Badge>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-cyan-400">Premium Plan</h3>
                <Crown className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold mb-4">
                $49<span className="text-sm text-gray-400">/month</span>
              </p>
              <ul className="space-y-2">
                {PREMIUM_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-100">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Benefits Highlight */}
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
            <p className="text-sm text-center text-gray-300">
              <Crown className="inline h-4 w-4 text-cyan-400 mr-1" />
              Join <span className="font-semibold text-cyan-400">thousands of organizations</span> using Premium
              to streamline their compliance journey
            </p>
          </div>

          {/* Credit Info if applicable */}
          {subscription && subscription.creditsBalance > 0 && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-center text-blue-300">
                You have {subscription.creditsBalance} credits remaining. Upgrade now to get unlimited access
                without consuming credits!
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
            disabled={isUpgrading}
          >
            <X className="mr-2 h-4 w-4" />
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600"
          >
            {isUpgrading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                Upgrade Now
              </>
            )}
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-gray-400 mt-2">
          Cancel anytime. No long-term commitment required.
        </p>
      </DialogContent>
    </Dialog>
  );
}
