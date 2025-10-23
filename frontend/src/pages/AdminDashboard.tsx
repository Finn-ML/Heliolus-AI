import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Settings,
  Users,
  Shield,
  CreditCard,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import UserSettings from '@/components/UserSettings';
import UserManagement from '@/components/UserManagement';
import MembershipPlanManager from '@/components/MembershipPlanManager';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (this shouldn't happen due to useEffect, but just in case)
  if (!isAuthenticated) {
    return null;
  }

  // Show access denied for non-admin users
  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" data-testid="alert-access-denied">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <div className="space-y-2">
                  <p className="font-semibold">Access Denied</p>
                  <p>
                    You don't have permission to access this page. Only administrators can access
                    the admin dashboard.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Current role: {user?.role || 'Unknown'}
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="text-center mt-8">
              <Lock className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Admin Access Required</h1>
              <p className="text-muted-foreground mb-6">
                This area is restricted to administrators only. If you believe you should have
                access, please contact your system administrator.
              </p>
              <Button onClick={() => navigate('/')} data-testid="button-return-home">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-admin-title">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your account settings and users</p>
            <p className="text-xs text-muted-foreground mt-1">
              Logged in as: {user?.firstName} {user?.lastName} ({user?.role})
            </p>
          </div>
        </div>

        <Tabs defaultValue="settings" className="w-full" data-testid="tabs-admin">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="settings"
              className="flex items-center gap-2"
              data-testid="tab-settings"
            >
              <Settings className="h-4 w-4" />
              User Settings
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2" data-testid="tab-users">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2" data-testid="tab-plans">
              <CreditCard className="h-4 w-4" />
              Membership Plans
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className="flex items-center gap-2"
              data-testid="tab-permissions"
            >
              <Shield className="h-4 w-4" />
              Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-6">
            <UserSettings />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <MembershipPlanManager />
          </TabsContent>

          <TabsContent value="permissions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Role & Permissions Management</CardTitle>
                <CardDescription>
                  Configure user roles and permissions for your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Permissions management coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
