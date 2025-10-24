import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface BlurredSectionProps {
  title: string;
  children: ReactNode;
  locked: boolean;
}

export function BlurredSection({ title, children, locked }: BlurredSectionProps) {
  const navigate = useNavigate();

  if (!locked) {
    // Not locked - render content normally
    return <>{children}</>;
  }

  // Locked - render with blur and overlay
  return (
    <div className="relative">
      {/* Blurred content */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: 'blur(8px)' }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
        <div className="text-center max-w-md px-6 py-8">
          <div className="inline-flex items-center justify-center p-4 mb-4 rounded-full bg-gradient-to-r from-cyan-600 to-pink-600">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            {title} Locked
          </h3>
          <p className="text-gray-300 mb-6">
            Upgrade to Premium to unlock {title.toLowerCase()} and get full insights into your
            compliance assessment.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => navigate('/pricing?upgrade=premium')}
              className="w-full bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-700 hover:to-pink-700"
            >
              Upgrade to Premium
            </Button>
            <p className="text-sm text-gray-400">Starting at €599/month</p>
          </div>
        </div>
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only">
        This {title} section is locked. Upgrade to Premium to access this content.
      </div>
    </div>
  );
}
