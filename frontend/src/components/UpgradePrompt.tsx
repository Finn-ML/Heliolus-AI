import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
  plan?: string;
  price?: string;
  onUpgrade?: () => void;
}

export function UpgradePrompt({
  open,
  onOpenChange,
  title = 'Assessment Limit Reached',
  message = 'Free users can create maximum 2 assessments. Upgrade to Premium for unlimited assessments and full features.',
  plan = 'Premium',
  price = '€599/month',
  onUpgrade,
}: UpgradePromptProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/pricing?upgrade=premium');
    }
    onOpenChange(false);
  };

  const handleLearnMore = () => {
    navigate('/pricing');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full blur-lg opacity-50" />
              <div className="relative bg-gray-900 rounded-full p-4 border-2 border-cyan-500/50">
                <Lock className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              {title}
            </div>
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-4">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gradient-to-r from-cyan-900/20 to-pink-900/20 border border-cyan-800/50 rounded-lg p-6 my-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Upgrade to</p>
            <h3 className="text-2xl font-bold text-white mb-1">{plan}</h3>
            <p className="text-xl text-cyan-400 font-semibold">{price}</p>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400 flex-shrink-0" />
              <span>Unlimited assessments per month</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400 flex-shrink-0" />
              <span>Full gap analysis & strategy matrix</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400 flex-shrink-0" />
              <span>AI-powered vendor matching</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400 flex-shrink-0" />
              <span>Downloadable PDF reports</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleLearnMore}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Learn More
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-700 hover:to-pink-700 order-1 sm:order-2"
          >
            Upgrade to {plan}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
