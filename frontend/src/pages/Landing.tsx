import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ArrowRight,
  Sparkles,
  Activity,
  Zap,
  ChevronRight,
  Shield,
  Lock,
} from 'lucide-react';
// Logo is now served from public directory
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Landing = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState<string>('');
  const { isAuthenticated } = useAuth();

  // Instant navigation with loading state feedback
  const smoothNavigate = (targetRoute: string, delay = 800) => {
    setIsNavigating(true);
    setLoadingRoute(targetRoute);

    // Show loading state briefly then navigate instantly
    setTimeout(() => {
      navigate(targetRoute);
      setIsNavigating(false);
      setLoadingRoute('');
    }, delay);
  };

  // Handler for protected actions that require authentication
  const handleProtectedAction = (targetRoute: string, actionTitle: string) => {
    if (isAuthenticated) {
      navigate(targetRoute);
    } else {
      // Show auth modal instead of immediate redirect
      setPendingRoute(targetRoute);
      setShowAuthModal(true);
    }
  };

  // Handle auth modal actions with instant navigation
  const handleLogin = () => {
    setShowAuthModal(false);
    // Small delay to let modal close smoothly, then navigate instantly
    setTimeout(() => navigate('/login'), 200);
  };

  const handleSignup = () => {
    setShowAuthModal(false);
    // Small delay to let modal close smoothly, then navigate instantly
    setTimeout(() => navigate('/register'), 200);
  };

  // Animated floating shapes
  const FloatingShapes = () => (
    <div className="floating-shapes">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="shape"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 2}s`,
          }}
        >
          <svg width="100" height="100" viewBox="0 0 100 100">
            {i % 3 === 0 && (
              <polygon
                points="50,10 90,90 10,90"
                fill="none"
                stroke="hsl(183, 81%, 57%)"
                strokeWidth="1"
                opacity="0.3"
              />
            )}
            {i % 3 === 1 && (
              <rect
                x="20"
                y="20"
                width="60"
                height="60"
                fill="none"
                stroke="hsl(324, 85%, 60%)"
                strokeWidth="1"
                opacity="0.3"
                transform="rotate(45 50 50)"
              />
            )}
            {i % 3 === 2 && (
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="hsl(183, 81%, 57%)"
                strokeWidth="1"
                opacity="0.3"
              />
            )}
          </svg>
        </div>
      ))}
    </div>
  );

  const journeyOptions = [
    {
      id: 'assessment',
      title: 'Start Risk Assessment',
      description: 'Begin your compliance journey with a comprehensive risk evaluation',
      icon: TrendingUp,
      color: 'purple',
      glowClass: 'glow-cyan',
      gradient: 'from-cyan-500 to-cyan-400',
      features: [
        'AI-powered risk analysis',
        'Personalized compliance roadmap',
        'Industry benchmarking',
        'Strategic recommendations',
      ],
      action: () => navigate('/assessment-templates'),
    },
    {
      id: 'marketplace',
      title: 'Explore Solutions',
      description: 'Browse vendors and consultants tailored to your needs',
      icon: TrendingUp,
      color: 'blue',
      glowClass: 'glow-pink',
      gradient: 'from-pink-500 to-pink-400',
      features: [
        'Curated vendor marketplace',
        'Expert consultants',
        'Instant RFP generation',
        'Price comparisons',
      ],
      action: () => handleProtectedAction('/marketplace', 'Explore Solutions'),
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingShapes />

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">Heliolus AI</h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8">
              Your intelligent compliance marketplace powered by AI
            </p>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>AI-Powered Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-secondary" />
                <span>Real-time Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                <span>Instant Matching</span>
              </div>
            </div>
          </div>

          {/* Journey Selection */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4 text-white">Choose Your Journey</h2>
            <p className="text-gray-400">
              Select how you'd like to begin your compliance transformation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {journeyOptions.map(option => {
              const Icon = option.icon;
              const isHovered = hoveredCard === option.id;

              return (
                <Card
                  key={option.id}
                  className={`relative p-8 bg-gray-900/50 backdrop-blur-sm border-gray-800 card-hover cursor-pointer ${option.glowClass} ${isHovered ? option.glowClass : ''}`}
                  onMouseEnter={() => setHoveredCard(option.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={option.action}
                  data-testid={`card-journey-${option.id}`}
                >
                  {/* Animated border gradient */}
                  {isHovered && (
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${option.gradient} opacity-20`}
                      />
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${option.gradient} bg-opacity-20`}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <ArrowRight
                        className={`h-6 w-6 text-gray-500 transition-transform ${isHovered ? 'translate-x-2' : ''}`}
                      />
                    </div>

                    <h3 className="text-2xl font-semibold mb-3 text-white">{option.title}</h3>

                    <p className="text-gray-400 mb-6">{option.description}</p>

                    <div className="space-y-2">
                      {option.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-500"
                          style={{
                            opacity: isHovered ? 1 : 0.7,
                            transform: isHovered ? 'translateX(0)' : 'translateX(-10px)',
                            transition: `all 0.3s ease ${index * 0.1}s`,
                          }}
                        >
                          <ChevronRight className="h-3 w-3 text-gray-600" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={option.action}
                      className={`w-full mt-6 bg-gradient-to-r ${option.gradient} hover:opacity-90 btn-glow transition-all duration-300`}
                      size="lg"
                      data-testid={`button-start-${option.id}`}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Authentication Required
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please sign in or create an account to access our compliance assessment tools and
              marketplace.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 mt-6">
            <Button
              onClick={handleSignup}
              className="w-full relative overflow-hidden group bg-[#3BE2E9] text-white hover:shadow-xl transition-all duration-300"
              size="lg"
              data-testid="button-modal-signup"
            >
              {/* Fluid wave overlay - pink that flows across on hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -left-[70%] top-1/2 h-[250%] w-[250%] -translate-y-1/2 rounded-[50%_40%_60%_50%/60%_50%_40%_50%] bg-[#F345B8] rotate-[8deg] transform-gpu transition-transform duration-1000 ease-out group-hover:translate-x-[140%]"
              />
              <span className="relative z-10 flex items-center justify-center">
                <Shield className="mr-2 h-4 w-4" />
                Create Account
              </span>
            </Button>

            <Button
              onClick={handleLogin}
              variant="outline"
              className="w-full border-border hover:bg-accent transition-all duration-300"
              size="lg"
              data-testid="button-modal-login"
            >
              <Lock className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Join thousands of organizations building better compliance programs
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
