import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, FolderTree, ShoppingCart, TrendingUp, Clock, Users, Warehouse, Bike, MapPin, Phone, ArrowUpCircle, ArrowDownCircle, RotateCcw, Trash } from 'lucide-react';
import { StatsChart } from '@/components/admin/StatsChart';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import { queryKeys } from '@/lib/queryKeys';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Tables } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';

type Order = Tables<'orders'>;
type Courier = Tables<'couriers'>;

const Dashboard = () => {
  // Real-time subscription for all relevant tables
  useRealtimeSubscription(['orders', 'products', 'categories', 'ingredients', 'couriers', 'stock_movements']);

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

  // Fetch today's stock movements
  const { data: todayMovements } = useQuery({
    queryKey: ['dashboard-stock-movements-today'],
    queryFn: async () => {
      const today = new Date();
      const { data, error } = await supabase
        .from('stock_movements')
        .select('movement_type, total_cost, quantity')
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString());
      if (error) throw error;
      
      const totalIn = data?.filter(m => m.movement_type === 'in').reduce((sum, m) => sum + (m.total_cost || 0), 0) || 0;
      const totalOut = data?.filter(m => m.movement_type === 'out').reduce((sum, m) => sum + (m.total_cost || 0), 0) || 0;
      const totalReturn = data?.filter(m => m.movement_type === 'return').reduce((sum, m) => sum + (m.total_cost || 0), 0) || 0;
      const totalWaste = data?.filter(m => m.movement_type === 'waste').reduce((sum, m) => sum + (m.total_cost || 0), 0) || 0;
      const movementsCount = data?.length || 0;
      
      return { totalIn, totalOut, totalReturn, totalWaste, movementsCount };
    },
  });
  // Fetch couriers
  const { data: couriers } = useQuery({
    queryKey: ['dashboard-couriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('couriers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Courier[];
    },
  });

  // Fetch active courier orders
  const { data: courierOrders } = useQuery({
    queryKey: ['dashboard-courier-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('courier_id', 'is', null)
        .in('status', ['new', 'cooking', 'on_the_way'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  // Group orders by courier
  const ordersByCourier = courierOrders?.reduce((acc, order) => {
    if (order.courier_id) {
      if (!acc[order.courier_id]) {
        acc[order.courier_id] = [];
      }
      acc[order.courier_id].push(order);
    }
    return acc;
  }, {} as Record<string, Order[]>) || {};

  // Courier statistics
  const courierStats = {
    total: couriers?.length || 0,
    available: couriers?.filter(c => c.is_available).length || 0,
    busy: couriers?.filter(c => !c.is_available || (c.current_orders_count || 0) >= (c.max_orders || 5)).length || 0,
    activeOrders: courierOrders?.length || 0,
  };

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
          <Card key={stat.title} className="bg-white border-slate-200 shadow-sm animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl lg:text-3xl font-display mt-1 text-slate-900">{stat.value}</p>
                  {(stat as any).subtext && (
                    <p className="text-xs text-orange-400 mt-1">{(stat as any).subtext}</p>
                  )}
                </div>
                <div className={`p-2 lg:p-3 rounded-xl bg-slate-100 ${stat.color}`}>
                  <stat.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue & New Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-primary">
                <TrendingUp className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Jami daromad</p>
                <p className="text-2xl font-display text-emerald-600">{formatPrice(stats?.totalRevenue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-blue-500/20">
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Yangi buyurtmalar</p>
                <p className="text-2xl font-display text-slate-900">{stats?.newOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Stock Movements */}
      <Card className="bg-white border-slate-200 shadow-sm animate-fade-in" style={{ animationDelay: '0.55s' }}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-display text-xl flex items-center gap-2 text-slate-900">
            <Warehouse className="h-5 w-5 text-primary" />
            Bugungi ombor harakatlari
          </CardTitle>
          <Link to="/admin/stock-movements" className="text-sm text-primary hover:underline">
            Barchasini ko'rish →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 text-center">
              <ArrowUpCircle className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-emerald-600">{formatPrice(todayMovements?.totalIn || 0)}</p>
              <p className="text-xs text-slate-500">Kirim</p>
            </div>
            <div className="p-4 rounded-xl bg-red-50 text-center">
              <ArrowDownCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-red-600">{formatPrice(todayMovements?.totalOut || 0)}</p>
              <p className="text-xs text-slate-500">Chiqim</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 text-center">
              <RotateCcw className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-purple-600">{formatPrice(todayMovements?.totalReturn || 0)}</p>
              <p className="text-xs text-slate-500">Qaytarish</p>
            </div>
            <div className="p-4 rounded-xl bg-orange-50 text-center">
              <Trash className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-orange-600">{formatPrice(todayMovements?.totalWaste || 0)}</p>
              <p className="text-xs text-slate-500">Isrof</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-100 text-center">
              <p className="text-3xl font-bold text-slate-900">{todayMovements?.movementsCount || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Jami harakatlar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courier Statistics Section */}
      <Card className="bg-white border-slate-200 shadow-sm animate-fade-in" style={{ animationDelay: '0.65s' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-xl flex items-center gap-2 text-slate-900">
            <Bike className="h-5 w-5 text-primary" />
            Kuryerlar holati
          </CardTitle>
          <Link to="/admin/couriers" className="text-sm text-primary hover:underline">
            Barchasini ko'rish →
          </Link>
        </CardHeader>
        <CardContent>
          {/* Courier Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-100 text-center">
              <p className="text-3xl font-display font-bold text-slate-900">{courierStats.total}</p>
              <p className="text-sm text-slate-500">Jami kuryerlar</p>
            </div>
            <div className="p-4 rounded-xl bg-green-500/10 text-center">
              <p className="text-3xl font-display font-bold text-emerald-600">{courierStats.available}</p>
              <p className="text-sm text-slate-500">Bo'sh</p>
            </div>
            <div className="p-4 rounded-xl bg-orange-500/10 text-center">
              <p className="text-3xl font-display font-bold text-orange-600">{courierStats.busy}</p>
              <p className="text-sm text-slate-500">Band</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/10 text-center">
              <p className="text-3xl font-display font-bold text-purple-600">{courierStats.activeOrders}</p>
              <p className="text-sm text-slate-500">Faol buyurtmalar</p>
            </div>
          </div>

          {/* Active Couriers with Orders */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-500 mb-3">Faol kuryerlar</h4>
            {couriers && couriers.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {couriers.map((courier) => {
                  const courierOrdersList = ordersByCourier[courier.id] || [];
                  const hasOrders = courierOrdersList.length > 0;
                  const isBusy = (courier.current_orders_count || 0) >= (courier.max_orders || 5);
                  
                  return (
                      <div 
                        key={courier.id} 
                        className={`p-4 rounded-xl border transition-all ${
                          hasOrders 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              courier.is_available && !isBusy ? 'bg-emerald-500' : 'bg-orange-500'
                            }`} />
                            <span className="font-medium text-slate-900">{courier.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {courierOrdersList.length}/{courier.max_orders || 5}
                        </Badge>
                      </div>
                      
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          <Phone className="h-3 w-3" />
                          <span>{courier.phone}</span>
                      </div>

                      {hasOrders ? (
                          <div className="space-y-2 mt-3 pt-3 border-t border-slate-200">
                            {courierOrdersList.slice(0, 2).map((order) => (
                              <div key={order.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1 text-slate-500 truncate max-w-[60%]">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{order.address}</span>
                              </div>
                              <Badge className={`text-[10px] ${getStatusColor(order.status || 'new')}`}>
                                {getStatusLabel(order.status || 'new')}
                              </Badge>
                            </div>
                          ))}
                          {courierOrdersList.length > 2 && (
                            <p className="text-xs text-slate-500 text-center">
                              +{courierOrdersList.length - 2} buyurtma
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 mt-2">Buyurtma yo'q</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Bike className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Faol kuryerlar yo'q</p>
                <Link to="/admin/couriers" className="text-sm text-primary hover:underline mt-2 inline-block">
                  Kuryer qo'shish
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
      <Card className="bg-white border-slate-200 shadow-sm animate-fade-in" style={{ animationDelay: '0.9s' }}>
        <CardHeader>
          <CardTitle className="font-display text-xl text-slate-900">So'nggi buyurtmalar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders?.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">{order.user_fullname}</p>
                  <p className="text-sm text-slate-500">{order.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-emerald-600">{formatPrice(Number(order.total_price))}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status || 'new')}`}>
                    {getStatusLabel(order.status || 'new')}
                  </span>
                </div>
              </div>
            ))}
            {!recentOrders?.length && (
              <p className="text-center text-slate-500 py-8">Hali buyurtmalar yo'q</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
