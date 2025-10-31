import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  Users,
  Package,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  UserCog,
  Building2,
  TrendingUp,
  FileBarChart,
  Crown,
  Layers,
  Scale,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
}

const navigation: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: Home },
  { title: 'Vendor Management', href: '/admin/vendors', icon: Building2 },
  { title: 'User Management', href: '/admin/users', icon: Users },
  { title: 'Leads', href: '/admin/leads', icon: TrendingUp },
  { title: 'Templates', href: '/admin/templates', icon: FileText },
  { title: 'Plans', href: '/admin/plans', icon: Layers },
  { title: 'Revenue Reports', href: '/admin/reports', icon: FileBarChart },
  { title: 'Subscriptions', href: '/admin/subscriptions', icon: Crown },
  { title: 'Legal Documents', href: '/admin/legal-documents', icon: Scale },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          'border-r border-border bg-card transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                {!isCollapsed && (
                  <>
                    <h2 className="text-lg font-semibold gradient-text">Admin Panel</h2>
                    <p className="text-sm text-muted-foreground">Heliolus Control Center</p>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hover:bg-accent"
              >
                <ChevronLeft
                  className={cn(
                    'h-4 w-4 transition-transform duration-300',
                    isCollapsed && 'rotate-180'
                  )}
                />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navigation.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Button
                    key={item.href}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full',
                      isCollapsed ? 'justify-center px-2' : 'justify-start',
                      isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                    onClick={() => navigate(item.href)}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon className={cn('h-4 w-4', !isCollapsed && 'mr-3')} />
                    {!isCollapsed && (
                      <>
                        {item.title}
                        {item.badge && (
                          <span className="ml-auto bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/admin/settings')}
              title={isCollapsed ? 'Settings' : undefined}
            >
              <Settings className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
              {!isCollapsed && 'Settings'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="container mx-auto p-6">{children}</div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AdminLayout;
