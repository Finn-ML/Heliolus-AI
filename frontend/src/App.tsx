import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { AdminRoute } from '@/components/AdminRoute';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from './components/Header';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AssessmentJourneyNew from './pages/AssessmentJourneyNew';
import Index from './pages/Index';
import Marketplace from './pages/Marketplace';
import Reports from './pages/Reports';
import AdminDashboard from './pages/AdminDashboard';
import AssessmentFlow from './pages/AssessmentFlow';
import AssessmentTemplates from './pages/AssessmentTemplates';
import AssessmentExecution from './pages/AssessmentExecution';
import AssessmentResults from './pages/AssessmentResults';
import AssessmentPriorities from './pages/AssessmentPriorities';
import NotFound from './pages/NotFound';
import Pricing from './pages/Pricing';
import { AdminLogin } from '@/components/AdminLogin';

// Admin Pages
import AdminDashboardNew from './pages/admin/Dashboard';
import VendorManagement from './pages/admin/VendorManagement';
import UserManagement from './pages/admin/UserManagement';
import CreditBalances from './pages/admin/CreditBalances';
import CreditTransactions from './pages/admin/CreditTransactions';
import TemplateCosts from './pages/admin/TemplateCosts';
import TemplateManagement from './pages/admin/TemplateManagement';
import RevenueReports from './pages/admin/RevenueReports';
import Subscriptions from './pages/admin/Subscriptions';
import UserSettings from './components/UserSettings';
import PasswordReset from './pages/PasswordReset';
import EmailVerification from './pages/EmailVerification';

// Dev-only lazy import - completely excluded from production bundles
const AdminTokenSetterLazy = import.meta.env.DEV
  ? lazy(() => import('./components/AdminTokenSetter'))
  : lazy(() => Promise.resolve({ default: () => <div>Not available in production</div> }));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OnboardingProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <OnboardingTour />
              <Header />
              <div className="pt-16 w-full min-w-0 max-w-none">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                {/* Dev-only route - completely excluded from production builds */}
                {import.meta.env.DEV && (
                  <Route
                    path="/set-admin-token"
                    element={
                      <Suspense fallback={<div>Loading...</div>}>
                        <AdminTokenSetterLazy />
                      </Suspense>
                    }
                  />
                )}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <UserSettings />
                    </ProtectedRoute>
                  }
                />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                {/* Protected Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardNew />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/vendors"
                  element={
                    <AdminRoute>
                      <VendorManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <UserManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/credits"
                  element={
                    <AdminRoute>
                      <CreditBalances />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/transactions"
                  element={
                    <AdminRoute>
                      <CreditTransactions />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/template-costs"
                  element={
                    <AdminRoute>
                      <TemplateCosts />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/templates"
                  element={
                    <AdminRoute>
                      <TemplateManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <AdminRoute>
                      <RevenueReports />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/subscriptions"
                  element={
                    <AdminRoute>
                      <Subscriptions />
                    </AdminRoute>
                  }
                />
                <Route path="/assessment-flow" element={<AssessmentFlow />} />
                <Route path="/assessment-templates" element={<AssessmentTemplates />} />
                <Route
                  path="/assessment/execute/:templateId"
                  element={
                    <ProtectedRoute>
                      <AssessmentExecution />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assessment/journey/:assessmentId"
                  element={
                    <ProtectedRoute>
                      <AssessmentJourneyNew />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assessment/results/:assessmentId"
                  element={
                    <ProtectedRoute>
                      <AssessmentResults />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assessments/:assessmentId/priorities"
                  element={
                    <ProtectedRoute>
                      <AssessmentPriorities />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </OnboardingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
