import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FolderTree, ShoppingCart, TrendingUp, Clock, Users, Warehouse } from 'lucide-react';
import { StatsChart } from '@/components/admin/StatsChart';
import { subDays } from 'date-fns';
import { queryKeys } from '@/lib/queryKeys';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const Dashboard = () => {
  // Real-time subscription for all relevant tables
  useRealtimeSubscription(['orders', 'products', 'categories', 'ingredients']);

  const { data: stats } = useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: async () => {
      const [products, categories, orders, ingredients, userRoles] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, status, total_price'),
        supabase.from('ingredients').select('id, current_stock, min_stock'),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }),
      ]);

      const newOrders = orders.data?.filter(o => o.status === 'new').length || 0;
      const totalRevenue = orders.data?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
      const lowStockItems = ingredients.data?.filter(i => i.current_stock <= i.min_stock).length || 0;

      return {
        productsCount: products.count || 0,
        categoriesCount: categories.count || 0,
        ordersCount: orders.data?.length || 0,
        ingredientsCount: ingredients.data?.length || 0,
        lowStockItems,
        usersCount: userRoles.count || 0,
        newOrders,
        totalRevenue,
      };
    },
  });

  // Fetch orders for the last 7 days for charts
  const { data: recentOrdersForChart } = useQuery({
    queryKey: ['orders-for-chart'],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data } = await supabase
        .from('orders')
        .select('id, created_at, total_price, status')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const statCards = [
    { title: 'Mahsulotlar', value: stats?.productsCount || 0, icon: Package, color: 'text-primary' },
    { title: 'Kategoriyalar', value: stats?.categoriesCount || 0, icon: FolderTree, color: 'text-secondary' },
    { title: 'Buyurtmalar', value: stats?.ordersCount || 0, icon: ShoppingCart, color: 'text-green-400' },
    { title: 'Ingredientlar', value: stats?.ingredientsCount || 0, icon: Warehouse, color: 'text-blue-400', subtext: stats?.lowStockItems ? `${stats.lowStockItems} kam qolgan` : undefined },
    { title: 'Foydalanuvchilar', value: stats?.usersCount || 0, icon: Users, color: 'text-purple-400' },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'cooking': return 'bg-orange-500/20 text-orange-400';
      case 'on_the_way': return 'bg-purple-500/20 text-purple-400';
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Yangi';
      case 'cooking': return 'Tayyorlanmoqda';
      case 'on_the_way': return "Yo'lda";
      case 'delivered': return 'Yetkazildi';
      case 'cancelled': return 'Bekor qilindi';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className="glass border-border/50 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl lg:text-3xl font-display mt-1">{stat.value}</p>
                  {(stat as any).subtext && (
                    <p className="text-xs text-orange-400 mt-1">{(stat as any).subtext}</p>
                  )}
                </div>
                <div className={`p-2 lg:p-3 rounded-xl bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue & New Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass border-border/50 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-primary">
                <TrendingUp className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jami daromad</p>
                <p className="text-2xl font-display text-secondary">{formatPrice(stats?.totalRevenue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-blue-500/20">
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Yangi buyurtmalar</p>
                <p className="text-2xl font-display">{stats?.newOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <StatsChart orders={recentOrdersForChart || []} type="revenue" />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <StatsChart orders={recentOrdersForChart || []} type="orders" />
        </div>
      </div>

      {/* Recent Orders */}
      <Card className="glass border-border/50 animate-fade-in" style={{ animationDelay: '0.9s' }}>
        <CardHeader>
          <CardTitle className="font-display text-xl">So'nggi buyurtmalar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders?.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div>
                  <p className="font-medium">{order.user_fullname}</p>
                  <p className="text-sm text-muted-foreground">{order.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-secondary">{formatPrice(Number(order.total_price))}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status || 'new')}`}>
                    {getStatusLabel(order.status || 'new')}
                  </span>
                </div>
              </div>
            ))}
            {!recentOrders?.length && (
              <p className="text-center text-muted-foreground py-8">Hali buyurtmalar yo'q</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
