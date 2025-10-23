import { useState } from 'react';
import { LucideIcon, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  completed?: boolean;
  adminOnly?: boolean;
  testId?: string;
}

interface DashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navItems: NavItem[];
  children: React.ReactNode;
  className?: string;
}

const DashboardLayout = ({
  activeTab,
  setActiveTab,
  navItems,
  children,
  className,
}: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleNavItemClick = (item: NavItem) => {
    if (!item.disabled) {
      setActiveTab(item.id);
    }
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isCompleted = item.completed;

    return (
      <button
        key={item.id}
        onClick={() => handleNavItemClick(item)}
        disabled={item.disabled}
        data-testid={item.testId || `nav-item-${item.id}`}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
          item.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {isCompleted && <CheckCircle className="h-4 w-4 text-cyan-400" />}
            {item.adminOnly && (
              <Badge variant="secondary" className="ml-auto">
                Admin
              </Badge>
            )}
          </>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-lg font-semibold">H</span>
              </div>
              <span className="font-semibold text-foreground">Dashboard</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0"
            data-testid="sidebar-toggle"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="px-2 py-4">
        <div className="space-y-1">{navItems.map(renderNavItem)}</div>
      </div>
    </>
  );

  return (
    <div className={cn('flex h-screen w-full', className)}>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden md:flex flex-col border-r border-sidebar-border fixed left-0 top-16 h-[calc(100vh-4rem)] bg-sidebar transition-all duration-300 z-30',
          collapsed ? 'w-16' : 'w-64'
        )}
        data-testid="desktop-sidebar"
      >
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="fixed top-20 left-4 z-40"
              data-testid="mobile-sidebar-trigger"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0" data-testid="mobile-sidebar-content">
            <div className="flex h-full flex-col bg-sidebar">{sidebarContent}</div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content - Full Width */}
      <div className={cn('flex-1 w-full', collapsed ? 'md:pl-16' : 'md:pl-64')}>
        <div className="w-full h-full">
          <div className="md:hidden p-4">
            <Button variant="ghost" size="sm" data-testid="mobile-sidebar-trigger-header">
              <ChevronRight className="h-4 w-4 mr-2" />
              Menu
            </Button>
          </div>
          <div className="p-4 md:p-8" data-testid="dashboard-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
