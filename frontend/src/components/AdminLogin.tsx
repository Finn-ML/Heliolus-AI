import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

interface AdminLoginProps {
  onClose?: () => void;
  returnTo?: string;
}

export const AdminLogin = ({ onClose, returnTo }: AdminLoginProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAdmin } = useAuth();

  const redirectPath = returnTo || (location.state as any)?.from || '/admin';

  // If user is already authenticated and admin, redirect
  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate, redirectPath]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Check if user has admin role
        if (result.user && result.user.role === 'ADMIN') {
          login(result.token, result.user);
          // Redirect will be handled by useEffect above
        } else {
          setError('Access denied. Administrator privileges required.');
        }
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Dev-only quick login function
  const handleDevQuickLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Making dev login request...');
      const response = await fetch('/v1/test-admin-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'admin@example.com' }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const result = await response.json();
      console.log('Response result:', result);

      if (response.ok && result.success) {
        console.log('Login successful, calling login function');
        login(result.token, result.user);
        // Redirect will be handled by useEffect above
      } else {
        const errorMsg = `Dev login failed (${response.status}): ${result.message || 'Unknown error'}`;
        console.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Dev login error:', err);
      setError(`Dev login error: ${err.message || 'Network error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Administrator Access</h1>
          <p className="text-sm text-muted-foreground">
            Enter your administrator credentials to continue
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="pt-6 space-y-4">
              {error && (
                <Alert variant="destructive" data-testid="alert-error">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin-email">Administrator Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@company.com"
                  {...register('email')}
                  disabled={isLoading}
                  data-testid="input-admin-email"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    disabled={isLoading}
                    data-testid="input-admin-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-admin-login"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Access Admin Panel
              </Button>

              {/* Dev-only quick login button */}
              {import.meta.env.DEV && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  disabled={isLoading}
                  onClick={handleDevQuickLogin}
                  data-testid="button-dev-quick-login"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  🚀 Quick Admin Login (DEV)
                </Button>
              )}

              <div className="flex space-x-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                  onClick={() => (onClose ? onClose() : navigate('/'))}
                  data-testid="button-cancel"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  disabled={isLoading}
                  onClick={() => navigate('/login')}
                  data-testid="button-user-login"
                >
                  User Login
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Only users with administrator privileges can access this area.</p>
          <p>
            For regular user access, use the{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:underline font-medium"
              data-testid="link-user-login"
            >
              standard login page
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
};
