import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Package, User, LogOut, Loader2, Eye, EyeOff, Mail } from "lucide-react";
import { format } from "date-fns";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

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

  // Fetch orders assigned to this courier
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
  const { data: completedOrders } = useQuery({
    queryKey: ["courier-completed-orders", courier?.id],
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

  // Courier not found - user is authenticated but not a courier
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
  const completedCount = completedOrders?.length || 0;

  return (
    <div className="min-h-screen bg-background">
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
        <div className="grid grid-cols-2 gap-4 mb-6">
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

        {/* Active Orders */}
        <h2 className="font-semibold text-lg mb-4">Faol buyurtmalar</h2>
        
        {ordersLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Card key={order.id} className="overflow-hidden">
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
                      <span>{order.address}</span>
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

                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <p className="font-semibold">
                      {Number(order.total_price).toLocaleString()} so'm
                    </p>
                    {order.notes && (
                      <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {order.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
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
        {completedOrders && completedOrders.length > 0 && (
          <div className="mt-8">
            <h2 className="font-semibold text-lg mb-4">Bugun yetkazilgan</h2>
            <div className="space-y-2">
              {completedOrders.map((order: any) => (
                <Card key={order.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{order.address}</p>
                    </div>
                    <p className="font-medium text-sm">
                      {Number(order.total_price).toLocaleString()} so'm
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
