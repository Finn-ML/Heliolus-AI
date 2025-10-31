import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Sparkles, Check, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getCurrentUserId } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PurchaseAssessmentButtonProps {
  shouldHighlight?: boolean;
}

export function PurchaseAssessmentButton({ shouldHighlight = false }: PurchaseAssessmentButtonProps) {
  const queryClient = useQueryClient();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(shouldHighlight);

  // Fetch user's billing info
  const { data: billingInfo } = useQuery({
    queryKey: ['subscription', 'billing-info'],
    queryFn: async () => {
      const userId = getCurrentUserId();
      if (!userId) return null;

      const response = await fetch(`/v1/subscriptions/${userId}/billing-info`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!localStorage.getItem('token'),
    retry: false,
  });

  const currentPlan = billingInfo?.data?.plan;
  const currentCredits = billingInfo?.data?.creditsBalance || 0;

  // Purchase mutation - now redirects to Stripe checkout
  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`/v1/subscriptions/${userId}/purchase-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          stripePriceId: import.meta.env.VITE_STRIPE_ADDITIONAL_ASSESSMENT_PRICE_ID,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Purchase failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('Purchase response:', data);
      console.log('Checkout URL:', data.data?.checkoutUrl);
      
      // Redirect to Stripe checkout
      if (data.data?.checkoutUrl) {
        console.log('Redirecting to Stripe:', data.data.checkoutUrl);
        window.location.href = data.data.checkoutUrl;
      } else {
        console.error('No checkoutUrl in response:', data);
        // Fallback for old response format (if credits were added directly)
        queryClient.invalidateQueries({ queryKey: ['subscription', 'billing-info'] });
        toast({
          title: 'Purchase Successful!',
          description: `${data.data?.creditsAdded || 50} credits added to your account.`,
        });
        setShowConfirmModal(false);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Purchase Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Auto-show modal if highlighted and user has low credits
  useEffect(() => {
    if (shouldHighlight && currentCredits < 50 && currentPlan === 'PREMIUM') {
      setIsHighlighting(true);
      // Auto-open modal after a short delay
      const timer = setTimeout(() => {
        setShowConfirmModal(true);
        setIsHighlighting(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [shouldHighlight, currentCredits, currentPlan]);

  // Don't show button for FREE or ENTERPRISE users
  if (!currentPlan || currentPlan === 'FREE' || currentPlan === 'ENTERPRISE') {
    return null;
  }

  const newBalance = currentCredits + 50; // 50 credits per purchase

  return (
    <>
      <div className={cn(
        "relative transition-all duration-300"
      )}>
        {/* Attention-grabbing glow effect */}
        {isHighlighting && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-pink-500 blur-2xl opacity-75 animate-pulse" />
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-lg blur-md opacity-50 animate-pulse" />
          </>
        )}
        
        <Button
          onClick={() => setShowConfirmModal(true)}
          className={cn(
            "relative bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-700 hover:to-pink-700 transition-all duration-300",
            isHighlighting && "shadow-2xl shadow-cyan-500/50 scale-105 ring-4 ring-cyan-500/30 ring-offset-2 ring-offset-gray-900"
          )}
          size="lg"
        >
          {isHighlighting ? (
            <>
              <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
              Purchase Additional Assessment - €299
              <Sparkles className="ml-2 h-5 w-5 animate-pulse" />
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Purchase Additional Assessment - €299
            </>
          )}
        </Button>
      </div>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full blur-lg opacity-50" />
                <div className="relative bg-gray-900 rounded-full p-4 border-2 border-cyan-500/50">
                  <ShoppingCart className="h-8 w-8 text-cyan-400" />
                </div>
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                Purchase Additional Assessment
              </div>
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-4">
              Add one more assessment to your Premium account
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gradient-to-r from-cyan-900/20 to-pink-900/20 border border-cyan-800/50 rounded-lg p-6 my-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Current Credits:</span>
                <span className="text-xl font-bold text-white">{currentCredits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Credits Added:</span>
                <span className="text-xl font-bold text-cyan-400">+50</span>
              </div>
              <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
                <span className="text-gray-300">New Balance:</span>
                <span className="text-2xl font-bold text-green-400">{newBalance}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2 text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>50 credits = 1 complete assessment (all features)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>Full gap analysis and strategy matrix</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>AI-powered vendor matching</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>Downloadable PDF report</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-white">€299</p>
              <p className="text-xs text-gray-400">One-time payment</p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={purchaseMutation.isPending}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-700 hover:to-pink-700 order-1 sm:order-2"
            >
              {purchaseMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
