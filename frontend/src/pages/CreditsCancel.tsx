import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const CreditsCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-orange-500" />
          </div>
          <CardTitle className="text-3xl">Purchase Cancelled</CardTitle>
          <CardDescription className="text-lg">
            Your credit purchase was cancelled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-6 space-y-2">
            <h3 className="font-semibold">What happened?</h3>
            <p className="text-sm text-muted-foreground">
              You cancelled the checkout process before completing your payment. No charges have been made to your account.
            </p>
          </div>

          <div className="bg-muted rounded-lg p-6 space-y-2">
            <h3 className="font-semibold">Need help?</h3>
            <p className="text-sm text-muted-foreground">
              If you experienced any issues during checkout or have questions, please don't hesitate to contact our support team.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => navigate('/pricing')}
              variant="outline"
              className="flex-1"
            >
              View Pricing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditsCancel;
