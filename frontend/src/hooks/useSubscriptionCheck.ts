import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '@/lib/api';

export type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  creditsBalance: number;
  creditsUsed: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
}

export function useSubscriptionCheck() {
  const {
    data: subscription,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.getCurrentSubscription,
    staleTime: 60000, // 1 minute
    retry: 1,
  });

  // Check if user has premium access (PREMIUM or ENTERPRISE plan)
  const isPremium = subscription?.plan === 'PREMIUM' || subscription?.plan === 'ENTERPRISE';

  // Check if user is on FREE plan
  const isFree = subscription?.plan === 'FREE';

  // Check if subscription is active
  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING';

  // Check if user has sufficient credits
  const hasCredits = (subscription?.creditsBalance ?? 0) > 0;

  // Check if user can access a premium feature
  const canAccessPremiumFeature = isPremium && isActive;

  // Get human-readable plan name
  const planName = subscription?.plan ? {
    FREE: 'Free',
    PREMIUM: 'Premium',
    ENTERPRISE: 'Enterprise',
  }[subscription.plan] : 'Unknown';

  return {
    subscription,
    isLoading,
    isError,
    error,
    refetch,
    // Helper flags
    isPremium,
    isFree,
    isActive,
    hasCredits,
    canAccessPremiumFeature,
    planName,
  };
}
