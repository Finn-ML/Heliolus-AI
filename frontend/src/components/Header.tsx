import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut, FileText, BarChart3, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout, getUserInitials, getUserFullName } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Hide header on login/register pages
  const hideHeader = ['/login', '/register'].includes(location.pathname);

  if (hideHeader) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <img src="/aithea-logo.png" alt="Heliolus Logo" className="h-10 w-10 object-contain" />
            <span className="ml-3 text-xl font-bold text-foreground">Heliolus AI</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className={location.pathname === '/dashboard' ? 'bg-accent' : ''}
                  data-tour="business-profile"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/assessment-templates')}
                  className={location.pathname.includes('/assessment') ? 'bg-accent' : ''}
                  data-testid="link-assessments"
                  data-tour="assessments"
                >
                  Assessments
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/marketplace')}
                  className={location.pathname === '/marketplace' ? 'bg-accent' : ''}
                >
                  Marketplace
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/reports')}
                  className={location.pathname === '/reports' ? 'bg-accent' : ''}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Reports
                </Button>

                {isAdmin() && (
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/admin')}
                    className={location.pathname.startsWith('/admin') ? 'bg-accent' : ''}
                    data-testid="button-admin-header"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{getUserFullName()}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate('/settings')}
                      data-testid="link-settings"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    {isAdmin() && (
                      <>
                        <DropdownMenuItem
                          onClick={() => navigate('/admin')}
                          data-testid="link-admin"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Admin Settings</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/register')}>Get Started</Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
