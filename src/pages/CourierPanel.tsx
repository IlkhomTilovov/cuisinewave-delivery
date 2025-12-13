import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, MapPin, Package, User, LogOut, Loader2, Eye, EyeOff, Mail, 
  Check, Truck, History, TrendingUp, Navigation, Calendar,
  DollarSign, Clock, BarChart3
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid } from "recharts";

const statusLabels: Record<string, string> = {
  new: "Yangi",
  cooking: "Tayyorlanmoqda",
  ready: "Tayyor",
  on_the_way: "Yo'lda",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  cooking: "bg-yellow-500",
  ready: "bg-green-500",
  on_the_way: "bg-purple-500",
  delivered: "bg-emerald-600",
  cancelled: "bg-red-500",
};

export default function CourierPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch courier data linked to this user
  const { data: courier, isLoading: courierLoading } = useQuery({
    queryKey: ["courier-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("couriers")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch active orders assigned to this courier
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["courier-orders", courier?.id],
    queryFn: async () => {
      if (!courier?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            price
          )
        `)
        .eq("courier_id", courier.id)
        .not("status", "in", '("delivered","cancelled")')
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!courier?.id,
    refetchInterval: 30000,
  });

  // Fetch completed orders for today
  const { data: todayCompletedOrders } = useQuery({
    queryKey: ["courier-today-completed", courier?.id],
    queryFn: async () => {
      if (!courier?.id) return [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("courier_id", courier.id)
        .eq("status", "delivered")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!courier?.id,
  });

  // Fetch order history (last 30 days)
  const { data: orderHistory } = useQuery({
    queryKey: ["courier-order-history", courier?.id],
    queryFn: async () => {
      if (!courier?.id) return [];
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            price
          )
        `)
        .eq("courier_id", courier.id)
        .in("status", ["delivered", "cancelled"])
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!courier?.id,
  });

  // Fetch statistics data (last 7 days)
  const { data: weeklyStats } = useQuery({
    queryKey: ["courier-weekly-stats", courier?.id],
    queryFn: async () => {
      if (!courier?.id) return [];
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const start = startOfDay(date);
        const end = endOfDay(date);
        
        const { data, error } = await supabase
          .from("orders")
          .select("total_price")
          .eq("courier_id", courier.id)
          .eq("status", "delivered")
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString());
        
        if (error) throw error;
        
        days.push({
          day: format(date, "EEE"),
          date: format(date, "dd.MM"),
          orders: data?.length || 0,
          earnings: data?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0,
        });
      }
      return days;
    },
    enabled: !!courier?.id,
  });

  // Calculate earnings summary
  const earningsSummary = {
    today: todayCompletedOrders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0,
    week: weeklyStats?.reduce((sum, d) => sum + d.earnings, 0) || 0,
    ordersToday: todayCompletedOrders?.length || 0,
    ordersWeek: weeklyStats?.reduce((sum, d) => sum + d.orders, 0) || 0,
  };

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus, oldStatus }: { orderId: string; newStatus: string; oldStatus: string }) => {
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);
      
      if (orderError) throw orderError;

      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: user?.id,
        });
      
      if (historyError) throw historyError;
    },
    onSuccess: (_, variables) => {
      const statusMessages: Record<string, string> = {
        on_the_way: "Buyurtma qabul qilindi va yo'lga chiqildi",
        delivered: "Buyurtma muvaffaqiyatli yetkazildi",
      };
      toast.success(statusMessages[variables.newStatus] || "Status yangilandi");
      queryClient.invalidateQueries({ queryKey: ["courier-orders"] });
      queryClient.invalidateQueries({ queryKey: ["courier-today-completed"] });
      queryClient.invalidateQueries({ queryKey: ["courier-order-history"] });
      queryClient.invalidateQueries({ queryKey: ["courier-weekly-stats"] });
    },
    onError: (error) => {
      console.error("Status update error:", error);
      toast.error("Xatolik yuz berdi");
    },
  });

  const handleAcceptOrder = (orderId: string, currentStatus: string) => {
    updateStatusMutation.mutate({ orderId, newStatus: "on_the_way", oldStatus: currentStatus });
  };

  const handleDeliverOrder = (orderId: string, currentStatus: string) => {
    updateStatusMutation.mutate({ orderId, newStatus: "delivered", oldStatus: currentStatus });
  };

  const openInMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    // Try to detect mobile and open appropriate app
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    
    if (isAndroid) {
      window.open(`geo:0,0?q=${encoded}`, "_blank");
    } else if (isIOS) {
      window.open(`maps://maps.apple.com/?q=${encoded}`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email yoki parol noto'g'ri");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Muvaffaqiyatli kirildi");
      setEmail("");
      setPassword("");
    } catch (err) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Tizimdan chiqildi");
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Kuryer Paneli</CardTitle>
            <p className="text-muted-foreground">Hisobingizga kiring</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kirish...
                  </>
                ) : (
                  "Kirish"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (courierLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user is an admin - redirect them to admin panel
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ["user-role-check", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.role;
    },
    enabled: !!user?.id && !courier,
  });

  // Redirect admins to admin panel
  useEffect(() => {
    if (userRole && ['superadmin', 'manager', 'operator'].includes(userRole)) {
      toast.info("Admin paneliga yo'naltirilmoqda...");
      navigate('/admin');
    }
  }, [userRole, navigate]);

  // Show loading while checking role
  if (roleLoading && !courier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Courier not found - user is authenticated but not a courier (and not an admin)
  if (!courier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <User className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium text-destructive">Kuryer topilmadi</p>
              <p className="text-sm text-muted-foreground mt-2">
                Bu hisob kuryer sifatida ro'yxatdan o'tmagan yoki faol emas.
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Chiqish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeOrdersCount = orders?.length || 0;
  const completedCount = todayCompletedOrders?.length || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-lg">{courier.name}</h1>
            <p className="text-sm text-muted-foreground">{courier.phone}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-primary">{activeOrdersCount}</p>
              <p className="text-sm text-muted-foreground">Faol buyurtmalar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Bugun yetkazilgan</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="orders" className="text-xs sm:text-sm">
              <Package className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Faol</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              <History className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Tarix</span>
            </TabsTrigger>
            <TabsTrigger value="earnings" className="text-xs sm:text-sm">
              <DollarSign className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Daromad</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Statistika</span>
            </TabsTrigger>
          </TabsList>

          {/* Active Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <h2 className="font-semibold text-lg">Faol buyurtmalar</h2>
            
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onAccept={handleAcceptOrder}
                    onDeliver={handleDeliverOrder}
                    onOpenMaps={openInMaps}
                    isPending={updateStatusMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Hozircha faol buyurtmalar yo'q</p>
                </CardContent>
              </Card>
            )}

            {/* Completed today */}
            {todayCompletedOrders && todayCompletedOrders.length > 0 && (
              <div className="mt-8">
                <h2 className="font-semibold text-lg mb-4">Bugun yetkazilgan</h2>
                <div className="space-y-2">
                  {todayCompletedOrders.map((order: any) => (
                    <Card key={order.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{order.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm text-green-600">
                            {Number(order.total_price).toLocaleString()} so'm
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "HH:mm")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Buyurtmalar tarixi (30 kun)
            </h2>
            
            {orderHistory && orderHistory.length > 0 ? (
              <div className="space-y-3">
                {orderHistory.map((order: any) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "dd.MM.yyyy HH:mm")}
                          </p>
                        </div>
                        <Badge className={statusColors[order.status || "new"]}>
                          {statusLabels[order.status || "new"]}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[60%]">{order.address}</span>
                        <span className="font-semibold">{Number(order.total_price).toLocaleString()} so'm</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Tarix bo'sh</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daromad hisoboti
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Bugun</p>
                  <p className="text-2xl font-bold text-green-600">
                    {earningsSummary.today.toLocaleString()} so'm
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {earningsSummary.ordersToday} ta buyurtma
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Shu hafta</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {earningsSummary.week.toLocaleString()} so'm
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {earningsSummary.ordersWeek} ta buyurtma
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Weekly earnings chart */}
            {weeklyStats && weeklyStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Haftalik daromad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyStats}>
                        <XAxis dataKey="day" fontSize={12} />
                        <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toLocaleString()} so'm`, "Daromad"]}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statistika
            </h2>
            
            {weeklyStats && weeklyStats.length > 0 && (
              <>
                {/* Orders chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Haftalik yetkazishlar soni</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="day" fontSize={12} />
                          <YAxis fontSize={12} allowDecimals={false} />
                          <Tooltip 
                            formatter={(value: number) => [`${value} ta`, "Buyurtmalar"]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="orders" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats summary */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Clock className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">{earningsSummary.ordersWeek}</p>
                      <p className="text-xs text-muted-foreground">Haftalik buyurtmalar</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Calendar className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">
                        {weeklyStats.length > 0 ? Math.round(earningsSummary.ordersWeek / 7) : 0}
                      </p>
                      <p className="text-xs text-muted-foreground">O'rtacha kunlik</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Daily breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Kunlik tafsilot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {weeklyStats.map((day, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{day.day}</p>
                          <p className="text-xs text-muted-foreground">{day.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{day.orders} ta</p>
                          <p className="text-xs text-green-600">{day.earnings.toLocaleString()} so'm</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({ 
  order, 
  onAccept, 
  onDeliver, 
  onOpenMaps,
  isPending 
}: { 
  order: any; 
  onAccept: (id: string, status: string) => void;
  onDeliver: (id: string, status: string) => void;
  onOpenMaps: (address: string) => void;
  isPending: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-medium">#{order.id.slice(0, 8)}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), "HH:mm")}
            </p>
          </div>
          <Badge className={statusColors[order.status || "new"]}>
            {statusLabels[order.status || "new"]}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{order.user_fullname}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${order.phone}`} className="text-primary">
              {order.phone}
            </a>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <span>{order.address}</span>
              <Button 
                variant="link" 
                size="sm" 
                className="ml-2 h-auto p-0 text-xs"
                onClick={() => onOpenMaps(order.address)}
              >
                <Navigation className="h-3 w-3 mr-1" />
                Xaritada
              </Button>
            </div>
          </div>
          {order.delivery_zone && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>{order.delivery_zone}</span>
            </div>
          )}
        </div>

        {order.order_items && order.order_items.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Mahsulotlar:</p>
            <div className="space-y-1">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product_name} x{item.quantity}</span>
                  <span>{(item.price * item.quantity).toLocaleString()} so'm</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">
              {Number(order.total_price).toLocaleString()} so'm
            </p>
            {order.notes && (
              <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                {order.notes}
              </p>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            {(order.status === "ready" || order.status === "new" || order.status === "cooking") && (
              <Button
                onClick={() => onAccept(order.id, order.status)}
                disabled={isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Truck className="h-4 w-4 mr-2" />
                )}
                Qabul qildim
              </Button>
            )}
            {order.status === "on_the_way" && (
              <Button
                onClick={() => onDeliver(order.id, order.status)}
                disabled={isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Yetkazib berdim
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
