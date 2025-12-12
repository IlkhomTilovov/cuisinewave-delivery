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
  Bike,
  ClipboardCheck,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Mahsulotlar', icon: Package },
  { href: '/admin/categories', label: 'Kategoriyalar', icon: FolderTree },
  { href: '/admin/orders', label: 'Buyurtmalar', icon: ShoppingCart },
  { href: '/admin/inventory', label: 'Ombor', icon: Warehouse },
  { href: '/admin/stock-movements', label: 'Harakatlar', icon: ArrowRightLeft },
  { href: '/admin/inventory-count', label: 'Inventarizatsiya', icon: ClipboardCheck },
  { href: '/admin/inventory-reports', label: 'Hisobotlar', icon: BarChart3 },
  { href: '/admin/couriers', label: 'Kuryerlar', icon: Bike },
  { href: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
  { href: '/admin/content', label: 'Kontent', icon: FileText },
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
      navigate('/auth', { replace: true });
      return;
    }
    
    if (!loading && !roleLoading && user && !isAdmin) {
      navigate('/', { replace: true });
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
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative inset-y-0 left-0 z-50 w-64 h-screen bg-slate-50 border-r border-slate-200 transform transition-transform duration-300 lg:transform-none flex-shrink-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <span className="text-lg font-display text-primary-foreground">BV</span>
                </div>
                <div>
                  <h1 className="font-display text-lg text-slate-900">Bella Vista</h1>
                  <p className="text-xs text-slate-500">Admin Panel</p>
                </div>
              </Link>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-slate-500 hover:text-slate-900"
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
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-2 border-transparent"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-900"
                    )} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User info & logout - fixed at bottom */}
          <div className="p-4 border-t border-slate-200 flex-shrink-0">
            <div className="px-3 py-2 mb-2 rounded-lg bg-slate-100">
              <p className="text-sm text-slate-900 font-medium truncate">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary capitalize">
                {userRole}
              </span>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-600 hover:text-destructive hover:bg-destructive/10 py-3"
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
        <header className="h-16 border-b border-slate-200 flex items-center px-4 lg:px-8 gap-4 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-900"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="font-display text-xl text-slate-900">
            {navItems.find(item => item.href === location.pathname)?.label || 'Admin'}
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
