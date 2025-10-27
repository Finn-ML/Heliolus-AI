import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, ArrowLeft, CreditCard, Lock, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getCurrentUserId } from '@/lib/api';

type BillingCycle = 'MONTHLY' | 'ANNUAL';

const PRICING = {
  MONTHLY: 599,
  ANNUAL: 6490,
};

const SAVINGS = {
  percentage: 10,
  amount: 698.8, // (599 * 12) - 6490 = 698.8
};

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const initialCycle = (searchParams.get('cycle')?.toUpperCase() as BillingCycle) || 'MONTHLY';
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);

  // Create Stripe Checkout Session and redirect
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/v1/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          plan: 'PREMIUM',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        toast({
          title: 'Redirecting to Stripe...',
          description: 'You will be redirected to complete your payment securely.',
        });

        // Redirect to Stripe Checkout page
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Checkout Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUpgrade = () => {
    upgradeMutation.mutate();
  };

  const totalAmount = PRICING[billingCycle];
  const isAnnual = billingCycle === 'ANNUAL';

  return (
    <div className="min-h-screen bg-gray-950 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-white mb-2">Upgrade to Premium</h1>
          <p className="text-gray-400">Choose your billing cycle and complete your upgrade</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Plan Selection */}
          <div className="space-y-6">
            {/* Billing Cycle Selection */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Select Billing Cycle</CardTitle>
                <CardDescription>Choose how you'd like to be billed</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={billingCycle} onValueChange={(value) => setBillingCycle(value as BillingCycle)}>
                  <div className="space-y-3">
                    {/* Monthly Option */}
                    <div
                      className={`relative flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        billingCycle === 'MONTHLY'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => setBillingCycle('MONTHLY')}
                    >
                      <RadioGroupItem value="MONTHLY" id="monthly" />
                      <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">Monthly</p>
                            <p className="text-sm text-gray-400">Billed every month</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">€599</p>
                            <p className="text-xs text-gray-400">per month</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    {/* Annual Option */}
                    <div
                      className={`relative flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        billingCycle === 'ANNUAL'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => setBillingCycle('ANNUAL')}
                    >
                      <RadioGroupItem value="ANNUAL" id="annual" />
                      <Label htmlFor="annual" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white">Annual</p>
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                Save {SAVINGS.percentage}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400">Billed once per year</p>
                            <p className="text-xs text-green-400 mt-1">
                              Save €{SAVINGS.amount.toFixed(2)}/year
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">€6,490</p>
                            <p className="text-xs text-gray-400">per year</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Premium Features */}
            <Card className="bg-gradient-to-br from-cyan-900/20 to-pink-900/20 border-cyan-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  Premium Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Unlimited assessments per month',
                  'Full gap analysis & strategy matrix',
                  'AI-powered vendor matching',
                  'Downloadable PDF reports',
                  'Lead tracking & RFP management',
                  'Priority email support',
                  'Advanced analytics & insights',
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Plan</span>
                    <span className="text-white font-semibold">Premium</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Billing Cycle</span>
                    <span className="text-white font-semibold">{billingCycle === 'MONTHLY' ? 'Monthly' : 'Annual'}</span>
                  </div>
                  {isAnnual && (
                    <div className="flex justify-between text-green-400">
                      <span>Annual Savings</span>
                      <span className="font-semibold">-€{SAVINGS.amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator className="bg-gray-700" />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">€{totalAmount.toLocaleString()}</p>
                    {isAnnual && (
                      <p className="text-xs text-gray-400">€{(totalAmount / 12).toFixed(2)}/month</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Payment Section */}
                <div className="space-y-4">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-300">Secure Payment via Stripe</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      You'll be redirected to Stripe's secure checkout page to complete your payment.
                    </p>
                  </div>

                  <Button
                    onClick={handleUpgrade}
                    disabled={upgradeMutation.isPending}
                    className="w-full bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-700 hover:to-pink-700"
                    size="lg"
                  >
                    {upgradeMutation.isPending ? (
                      'Redirecting to Stripe...'
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Continue to Payment - €{totalAmount.toLocaleString()}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-400">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Badge */}
            <div className="text-center text-xs text-gray-400">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Lock className="h-3 w-3" />
                <span>Secure Checkout</span>
              </div>
              <p>Your payment information is encrypted and secure</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
