import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const response = await fetch('/v1/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');

          toast({
            title: 'Email Verified',
            description:
              'Your email has been successfully verified. You can now access all features.',
          });

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(
            data.message || 'Email verification failed. The link may be invalid or expired.'
          );

          toast({
            title: 'Verification Failed',
            description: data.message || 'The verification link is invalid or has expired.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');

        toast({
          title: 'Error',
          description: 'Failed to verify email. Please try again.',
          variant: 'destructive',
        });
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Email Verification</CardTitle>
          <CardDescription className="text-gray-400">
            Verifying your email address...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-8">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 text-cyan-500 animate-spin mb-4" />
                <p className="text-gray-300 text-center">
                  Please wait while we verify your email...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <p className="text-gray-300 text-center font-medium mb-2">{message}</p>
                <p className="text-gray-400 text-sm text-center">Redirecting you to login...</p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                <p className="text-gray-300 text-center font-medium mb-4">{message}</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate('/login')}
                    className="bg-cyan-600 hover:bg-cyan-700"
                    data-testid="button-go-to-login"
                  >
                    Go to Login
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="border-gray-700 hover:bg-gray-800"
                    data-testid="button-go-home"
                  >
                    Go Home
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
