import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentUserId, publicPlanApi } from '@/lib/api';

interface PricingFeature {
  text: string;
  included: boolean;
  note?: string;
}

interface PricingTier {
  name: string;
  price: string;
  priceSubtext?: string;
  description: string;
  features: PricingFeature[];
  cta: {
    text: string;
    action: () => void;
    variant?: 'default' | 'outline';
    disabled?: boolean;
  };
  highlighted?: boolean;
  badge?: string;
  currentPlan?: boolean;
}

const PricingCard = ({ tier }: { tier: PricingTier }) => (
  <Card
    className={cn(
      'relative flex flex-col h-full',
      tier.highlighted && 'border-primary border-2 shadow-lg md:scale-105'
    )}
  >
    {tier.badge && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <Badge className="bg-primary text-primary-foreground px-4 py-1" aria-label={`${tier.badge} plan indicator`}>
          <Crown className="h-4 w-4 mr-1 inline" aria-hidden="true" />
          {tier.badge}
        </Badge>
      </div>
    )}

    <CardHeader className="text-center pb-8 pt-8">
      <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
      <div className="mt-4">
        <span className="text-4xl font-bold">{tier.price}</span>
        {tier.priceSubtext && (
          <p className="text-sm text-muted-foreground mt-2">
            {tier.priceSubtext}
          </p>
        )}
      </div>
      <CardDescription className="mt-4">{tier.description}</CardDescription>
    </CardHeader>

    <CardContent className="flex-1">
      <ul className="space-y-3" role="list">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            {feature.included ? (
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span
              className={cn(
                'text-sm',
                !feature.included && 'text-muted-foreground line-through'
              )}
            >
              {feature.text}
              {feature.note && (
                <span className="text-muted-foreground ml-1">({feature.note})</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </CardContent>

    <CardFooter className="pt-6">
      <Button
        className="w-full"
        variant={tier.cta.variant || 'default'}
        onClick={tier.cta.action}
        disabled={tier.cta.disabled || tier.currentPlan}
        aria-label={tier.currentPlan ? `${tier.name} is your current plan` : tier.cta.text}
      >
        {tier.currentPlan ? 'Current Plan' : tier.cta.text}
      </Button>
    </CardFooter>
  </Card>
);

export default function Pricing() {
  const navigate = useNavigate();

  // Fetch plans from database
  const { data: plansResponse, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => {
      return await publicPlanApi.listPlans();
    },
  });

  // Fetch current subscription for authenticated users
  const { data: billingInfo, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription', 'billing-info'],
    queryFn: async () => {
      const userId = getCurrentUserId();
      if (!userId) return null;

      const response = await fetch(`/v1/subscriptions/${userId}/billing-info`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        // If error, just return null (user might not have subscription yet)
        return null;
      }

      return response.json();
    },
    enabled: !!localStorage.getItem('token'), // Only fetch if logged in
    retry: false, // Don't retry on error
  });

  const currentPlan = billingInfo?.data?.plan || null;
  const dbPlans = plansResponse?.data || [];

  // Map database plans to PricingTier format
  const pricingTiers: PricingTier[] = dbPlans.map((plan: any) => {
    const isFreemium = plan.slug === 'freemium';
    const isPremium = plan.slug === 'premium';
    const isEnterprise = plan.slug === 'enterprise';

    // Format price
    let price = 'Free';
    let priceSubtext: string | undefined;

    if (plan.monthlyPrice > 0) {
      price = `€${plan.monthlyPrice}`;
      if (plan.annualPrice > 0) {
        const monthlySavings = ((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12) * 100).toFixed(0);
        priceSubtext = `per month, or €${plan.annualPrice}/year (save ${monthlySavings}%)`;
      }
    } else if (isEnterprise) {
      price = 'Custom';
    }

    // Convert features to PricingFeature format
    const features: PricingFeature[] = (plan.features || []).map((feature: string) => ({
      text: feature,
      included: !feature.includes('Blurred'),
      note: feature.includes('Blurred') ? 'Blurred' : undefined,
    }));

    // Determine CTA
    let cta;
    if (isFreemium) {
      cta = {
        text: 'Get Started',
        action: () => navigate('/register'),
        variant: 'outline' as const,
      };
    } else if (isPremium) {
      cta = {
        text: 'Upgrade to Premium',
        action: () => navigate(`/checkout?plan=${plan.slug}&cycle=monthly`),
      };
    } else {
      cta = {
        text: 'Contact Sales',
        action: () => (window.location.href = 'mailto:sales@heliolus.com'),
        variant: 'outline' as const,
      };
    }

    return {
      name: plan.name,
      price,
      priceSubtext,
      description: plan.description || '',
      features,
      cta,
      highlighted: isPremium,
      badge: isPremium ? 'Most Popular' : undefined,
      currentPlan: currentPlan === plan.slug.toUpperCase(),
    };
  });

  if (isLoadingPlans || isLoadingSubscription) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Loading pricing information...</p>
      </div>
    );
  }

  if (!dbPlans || dbPlans.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">No pricing plans available at this time.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your compliance needs. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {pricingTiers.map((tier) => (
          <PricingCard key={tier.name} tier={tier} />
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">What's included in the Freemium plan?</h3>
            <p className="text-muted-foreground">
              The Freemium plan allows you to create up to 2 compliance assessments for free. You'll see your
              compliance score and can browse vendors, but gap analysis and strategy matrix features are restricted.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Can I upgrade at any time?</h3>
            <p className="text-muted-foreground">
              Yes! You can upgrade from Freemium to Premium at any time. Your assessments and data will be preserved,
              and you'll immediately gain access to all Premium features.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">What if I need more than 2 assessments per month?</h3>
            <p className="text-muted-foreground">
              Premium users can purchase additional assessments for €299 each. Alternatively, consider our Enterprise
              plan for unlimited assessments.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">How does annual billing work?</h3>
            <p className="text-muted-foreground">
              By choosing annual billing, you pay €6,490 upfront (instead of €7,188 for 12 monthly payments),
              saving 10%. Your plan renews automatically each year.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">What's included in Enterprise support?</h3>
            <p className="text-muted-foreground">
              Enterprise customers get a dedicated account manager, priority email and phone support, custom
              integrations, and flexible billing arrangements tailored to your organization's needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
