import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Clock, Package, User, ChevronRight, LogOut } from "lucide-react";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  new: "Yangi",
  cooking: "Tayyorlanmoqda",
  on_the_way: "Yo'lda",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  cooking: "bg-yellow-500",
  on_the_way: "bg-purple-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

export default function CourierPanel() {
  const [phone, setPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Check if courier exists with this phone
  const { data: courier, isLoading: courierLoading } = useQuery({
    queryKey: ["courier-by-phone", verifiedPhone],
    queryFn: async () => {
      if (!verifiedPhone) return null;
      const { data, error } = await supabase
        .from("couriers")
        .select("*")
        .eq("phone", verifiedPhone)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!verifiedPhone,
  });

  // Fetch orders assigned to this courier
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["courier-orders", courier?.id],
    queryFn: async () => {
      if (!courier?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("courier_id", courier.id)
        .in("status", ["new", "cooking", "on_the_way"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!courier?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
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

  const handleLogin = async () => {
    setError("");
    
    // Validate phone format
    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError("Telefon raqam formati: +998XXXXXXXXX");
      return;
    }

    // Check if courier exists
    const { data, error } = await supabase
      .from("couriers")
      .select("id")
      .eq("phone", phone)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      setError("Bunday telefon raqamli kuryer topilmadi");
      return;
    }

    setVerifiedPhone(phone);
    localStorage.setItem("courier_phone", phone);
  };

  const handleLogout = () => {
    setVerifiedPhone(null);
    setPhone("");
    localStorage.removeItem("courier_phone");
  };

  // Check for saved phone on mount
  useState(() => {
    const savedPhone = localStorage.getItem("courier_phone");
    if (savedPhone) {
      setVerifiedPhone(savedPhone);
    }
  });

  // Login screen
  if (!verifiedPhone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Kuryer Paneli</CardTitle>
            <p className="text-muted-foreground">Telefon raqamingizni kiriting</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="tel"
                placeholder="+998901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-lg"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button onClick={handleLogin} className="w-full" size="lg">
              Kirish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (courierLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  // Courier not found
  if (!courier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-destructive">Kuryer topilmadi yoki faol emas</p>
            <Button onClick={handleLogout} variant="outline">
              Qayta urinish
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
          <p className="text-center text-muted-foreground py-8">Yuklanmoqda...</p>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
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
              {completedOrders.map((order) => (
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
