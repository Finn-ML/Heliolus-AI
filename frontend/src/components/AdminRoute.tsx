import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, Lock, ArrowLeft } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

/**
 * AdminRoute component that requires ADMIN role
 * Shows access denied message or redirects non-admin users
 */
export const AdminRoute = ({ children, fallback, showAccessDenied = true }: AdminRouteProps) => {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center space-y-4">
            <Shield className="h-12 w-12 mx-auto text-primary animate-pulse" />
            <div>
              <h3 className="text-lg font-semibold">Verifying Admin Access...</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we check your permissions
              </p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        </div>
      )
    );
  }

  // Redirect to admin login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location.pathname, adminRequired: true }}
        replace
      />
    );
  }

  // Show access denied if authenticated but not admin
  if (!isAdmin()) {
    if (showAccessDenied) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto bg-red-100 dark:bg-red-900/20 rounded-full p-4 w-fit">
                <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Access Denied</CardTitle>
                <CardDescription className="mt-2">
                  You don't have administrator privileges to access this area.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  This section requires administrator access. Your current role:{' '}
                  <strong>{user?.role || 'USER'}</strong>
                </AlertDescription>
              </Alert>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  If you believe you should have admin access, please contact your system
                  administrator.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.history.back()}
                  data-testid="button-go-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => (window.location.href = '/dashboard')}
                  data-testid="button-dashboard"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else {
      // Silent redirect for non-admin users
      return <Navigate to="/dashboard" replace />;
    }
  }

  // User is authenticated and has admin role
  return <>{children}</>;
};
