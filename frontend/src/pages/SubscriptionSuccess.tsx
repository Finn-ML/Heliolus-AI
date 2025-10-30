import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [verifying, setVerifying] = useState(true);

  // Verify the session and update subscription
  useQuery({
    queryKey: ['verify-checkout', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const response = await fetch(`/v1/subscriptions/verify-checkout/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify checkout session');
      }

      return response.json();
    },
    enabled: !!sessionId,
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    // Give webhook time to process
    const timer = setTimeout(() => {
      setVerifying(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!sessionId) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Session</CardTitle>
            <CardDescription>
              No checkout session ID was provided.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/pricing')}>
              Return to Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Your Subscription
            </CardTitle>
            <CardDescription>
              Please wait while we confirm your payment...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              This should only take a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl">Subscription Activated!</CardTitle>
          <CardDescription className="text-lg">
            Thank you for subscribing to Heliolus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-6 space-y-2">
            <h3 className="font-semibold">What happens next?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Your subscription is now active</li>
              <li>Assessment credits have been added to your account</li>
              <li>You can start creating assessments immediately</li>
              <li>A confirmation email has been sent to your email address</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => navigate('/assessment-templates')}
              variant="outline"
              className="flex-1"
            >
              Start Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
