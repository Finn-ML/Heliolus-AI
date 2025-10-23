// Freemium UI Components
import { ReactNode, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Lock, Crown, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlurOverlayProps {
  children: ReactNode;
  isBlurred?: boolean;
  upgradeMessage?: string;
  onUpgrade?: () => void;
  className?: string;
}

export const BlurOverlay = ({
  children,
  isBlurred = true,
  upgradeMessage = 'Upgrade to view detailed analysis',
  onUpgrade,
  className,
}: BlurOverlayProps) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'transition-all duration-300',
          isBlurred && !showPreview && 'blur-sm pointer-events-none select-none'
        )}
      >
        {children}
      </div>

      {isBlurred && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/80 flex items-center justify-center">
          <Card className="max-w-sm mx-4 bg-background/95 backdrop-blur border-primary/20">
            <CardContent className="p-6 text-center">
              <Lock className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Premium Content</h3>
              <p className="text-sm text-muted-foreground mb-4">{upgradeMessage}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  data-testid="button-preview-content"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPreview ? 'Hide' : 'Preview'}
                </Button>
                {onUpgrade && (
                  <Button onClick={onUpgrade} size="sm" data-testid="button-upgrade-premium">
                    <Crown className="h-4 w-4 mr-1" />
                    Upgrade
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

interface UpgradePromptProps {
  title?: string;
  description?: string;
  features: string[];
  onUpgrade?: () => void;
  className?: string;
}

export const UpgradePrompt = ({
  title = 'Unlock Full Analysis',
  description = 'Get complete access to detailed insights and recommendations',
  features,
  onUpgrade,
  className,
}: UpgradePromptProps) => (
  <Card
    className={cn('border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5', className)}
  >
    <CardHeader>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {onUpgrade && (
        <Button onClick={onUpgrade} className="w-full" data-testid="button-upgrade-full-access">
          Upgrade Now <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </CardContent>
  </Card>
);

interface FreemiumProgressProps {
  used: number;
  limit: number;
  itemName: string;
  className?: string;
}

export const FreemiumProgress = ({ used, limit, itemName, className }: FreemiumProgressProps) => {
  const percentage = (used / limit) * 100;
  const isAtLimit = used >= limit;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{itemName} Usage</span>
        <Badge variant={isAtLimit ? 'destructive' : 'secondary'} className="text-xs">
          {used} of {limit}
        </Badge>
      </div>
      <Progress value={percentage} className={cn('h-2', isAtLimit && 'bg-destructive/20')} />
      {isAtLimit && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3" />
          You've reached your free {itemName.toLowerCase()} limit
        </div>
      )}
    </div>
  );
};

interface FreemiumBannerProps {
  title: string;
  description: string;
  ctaText: string;
  onCTA?: () => void;
  className?: string;
}

export const FreemiumBanner = ({
  title,
  description,
  ctaText,
  onCTA,
  className,
}: FreemiumBannerProps) => (
  <div
    className={cn(
      'bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-4',
      className
    )}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Crown className="h-5 w-5 text-primary" />
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {onCTA && (
        <Button size="sm" onClick={onCTA} data-testid="button-freemium-cta">
          {ctaText}
        </Button>
      )}
    </div>
  </div>
);

interface UpgradeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  features: string[];
  pricing?: {
    monthly: string;
    annual: string;
  };
  onUpgrade?: (plan: 'monthly' | 'annual') => void;
}

export const UpgradeDialog = ({
  isOpen,
  onOpenChange,
  title = 'Upgrade to Premium',
  description = 'Unlock powerful compliance insights and analysis tools',
  features,
  pricing = { monthly: '$29', annual: '$290' },
  onUpgrade,
}: UpgradeDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md" data-testid="dialog-upgrade">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          {title}
        </DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="font-medium">What you'll get:</h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3">
          <Button
            className="w-full"
            onClick={() => onUpgrade?.('annual')}
            data-testid="button-upgrade-annual"
          >
            <span className="flex items-center justify-between w-full">
              <span>Annual Plan</span>
              <span>{pricing.annual}/year</span>
            </span>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onUpgrade?.('monthly')}
            data-testid="button-upgrade-monthly"
          >
            <span className="flex items-center justify-between w-full">
              <span>Monthly Plan</span>
              <span>{pricing.monthly}/month</span>
            </span>
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

interface RestrictedContentProps {
  children: ReactNode;
  isRestricted: boolean;
  restrictionMessage?: string;
  upgradeFeatures: string[];
  onUpgrade?: () => void;
  className?: string;
}

export const RestrictedContent = ({
  children,
  isRestricted,
  restrictionMessage = 'This feature requires a premium subscription',
  upgradeFeatures,
  onUpgrade,
  className,
}: RestrictedContentProps) => {
  if (!isRestricted) {
    return <>{children}</>;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <BlurOverlay isBlurred={true} upgradeMessage={restrictionMessage} onUpgrade={onUpgrade}>
        {children}
      </BlurOverlay>

      <UpgradePrompt
        title="Unlock This Feature"
        description={restrictionMessage}
        features={upgradeFeatures}
        onUpgrade={onUpgrade}
      />
    </div>
  );
};
