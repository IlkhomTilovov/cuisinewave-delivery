import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingCart, 
  LogOut, 
  Menu,
  X,
  Warehouse,
  ArrowRightLeft,
  Users,
  Settings,
  FileText,
  ChevronDown,
  Bike
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Mahsulotlar', icon: Package },
  { href: '/admin/categories', label: 'Kategoriyalar', icon: FolderTree },
  { href: '/admin/orders', label: 'Buyurtmalar', icon: ShoppingCart },
  { href: '/admin/inventory', label: 'Ombor', icon: Warehouse },
  { href: '/admin/stock-movements', label: 'Harakatlar', icon: ArrowRightLeft },
  { href: '/admin/couriers', label: 'Kuryerlar', icon: Bike },
  { href: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
];

const settingsItems = [
  { href: '/admin/about-content', label: 'Biz haqimizda', icon: FileText },
  { href: '/admin/site-settings', label: 'Sayt sozlamalari', icon: Settings },
];

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, loading, roleLoading, signOut, isAdmin, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthLoading = loading || roleLoading;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && !roleLoading && user && !isAdmin) {
      navigate('/');
    }
  }, [user, loading, roleLoading, isAdmin, navigate]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative inset-y-0 left-0 z-50 w-64 h-screen bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:transform-none flex-shrink-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <span className="text-lg font-display text-primary-foreground">BV</span>
                </div>
                <div>
                  <h1 className="font-display text-lg text-sidebar-foreground">Bella Vista</h1>
                  <p className="text-xs text-muted-foreground">Admin Panel</p>
                </div>
              </Link>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation - scrollable */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                      isActive 
                        ? "bg-primary/10 text-primary border-l-2 border-primary" 
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-2 border-transparent"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Settings collapsible section */}
              <Collapsible defaultOpen={settingsItems.some(item => location.pathname === item.href)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-muted/50 hover:text-foreground group">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium text-sm">Sozlamalar</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 mt-0.5 space-y-0.5">
                  {settingsItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                          isActive 
                            ? "bg-primary/10 text-primary border-l-2 border-primary" 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-2 border-transparent"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        <span className="font-medium text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </nav>

          {/* User info & logout - fixed at bottom */}
          <div className="p-4 border-t border-sidebar-border flex-shrink-0">
            <div className="px-3 py-2 mb-2 rounded-lg bg-sidebar-accent/50">
              <p className="text-sm text-sidebar-foreground font-medium truncate">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary capitalize">
                {userRole}
              </span>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 py-3"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Chiqish
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center px-4 lg:px-8 gap-4 bg-card/50 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="font-display text-xl">
            {navItems.find(item => item.href === location.pathname)?.label || 
             settingsItems.find(item => item.href === location.pathname)?.label || 
             'Admin'}
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
