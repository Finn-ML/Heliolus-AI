import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';

const CreditsSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [verifying, setVerifying] = useState(true);

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
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
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
              Processing Your Purchase
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
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full blur-lg opacity-50" />
              <div className="relative bg-gray-900 rounded-full p-4 border-2 border-cyan-500/50">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-400" />
            Purchase Complete!
          </CardTitle>
          <CardDescription className="text-lg pt-2">
            50 assessment credits have been added to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-cyan-900/20 to-pink-900/20 border border-cyan-800/50 rounded-lg p-6">
            <h3 className="font-semibold mb-2">What's included:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>1 complete assessment with all features</li>
              <li>Full gap analysis and risk assessment</li>
              <li>AI-powered vendor recommendations</li>
              <li>Strategy matrix and action plan</li>
              <li>Downloadable PDF report</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/dashboard')}
              className="flex-1"
              variant="outline"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => navigate('/assessment-templates')}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-700 hover:to-pink-700"
            >
              Start New Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditsSuccess;
