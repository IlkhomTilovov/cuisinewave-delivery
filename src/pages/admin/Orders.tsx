import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { 
  Search, Loader2, Eye, MapPin, Phone, User, Clock, CreditCard, 
  CalendarIcon, Download, Printer, ShoppingBag, TrendingUp, 
  Package, X, Trash2, Volume2, VolumeX
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';
import { uz } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryInvalidation } from '@/hooks/useQueryInvalidation';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

type Order = Tables<'orders'>;
type OrderItem = Tables<'order_items'>;

const statusOptions = [
  { value: 'new', label: 'Yangi', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'cooking', label: 'Tayyorlanmoqda', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'on_the_way', label: "Yo'lda", color: 'bg-purple-500/20 text-purple-400' },
  { value: 'delivered', label: 'Yetkazildi', color: 'bg-green-500/20 text-green-400' },
  { value: 'cancelled', label: 'Bekor qilindi', color: 'bg-red-500/20 text-red-400' },
];

const dateFilterOptions = [
  { value: 'all', label: 'Barcha vaqt' },
  { value: 'today', label: 'Bugun' },
  { value: 'yesterday', label: 'Kecha' },
  { value: 'week', label: 'Oxirgi 7 kun' },
  { value: 'month', label: 'Oxirgi 30 kun' },
  { value: 'custom', label: 'Maxsus sana' },
];

const Orders = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  const { invalidateGroup } = useQueryInvalidation();

  // Real-time subscription for orders
  useRealtimeSubscription(['orders']);

  const { data: orders, isLoading } = useQuery({
    queryKey: queryKeys.adminOrders(statusFilter),
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ['order-items', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', selectedOrder.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOrder,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      
      // If order is delivered, deduct ingredients
      if (status === 'delivered') {
        const { error: deductError } = await supabase.rpc('deduct_ingredients_for_order', { p_order_id: id });
        if (deductError) console.error('Ingredient deduction error:', deductError);
      }
    },
    onSuccess: () => {
      invalidateGroup('orders');
      toast.success('Buyurtma holati yangilandi');
    },
    onError: (error) => {
      toast.error("Xatolik yuz berdi: " + error.message);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id);
      if (itemsError) throw itemsError;
      
      // Then delete order (this won't work due to RLS, but we try)
      // Note: Orders table doesn't have DELETE policy, so this will fail
      // We'll just mark it as cancelled instead
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup('orders');
      setSelectedOrder(null);
      toast.success('Buyurtma bekor qilindi');
    },
    onError: (error) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  // Date filtering logic
  const getDateFilteredOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return isWithinInterval(orderDate, { start: startOfDay(now), end: endOfDay(now) });
        case 'yesterday':
          const yesterday = subDays(now, 1);
          return isWithinInterval(orderDate, { start: startOfDay(yesterday), end: endOfDay(yesterday) });
        case 'week':
          return isWithinInterval(orderDate, { start: startOfDay(subDays(now, 7)), end: endOfDay(now) });
        case 'month':
          return isWithinInterval(orderDate, { start: startOfDay(subDays(now, 30)), end: endOfDay(now) });
        case 'custom':
          if (customDateRange.from && customDateRange.to) {
            return isWithinInterval(orderDate, { 
              start: startOfDay(customDateRange.from), 
              end: endOfDay(customDateRange.to) 
            });
          }
          return true;
        default:
          return true;
      }
    });
  }, [orders, dateFilter, customDateRange]);

  // Search filtering
  const filteredOrders = getDateFilteredOrders.filter(o => 
    o.user_fullname.toLowerCase().includes(search.toLowerCase()) ||
    o.phone.includes(search) ||
    o.address.toLowerCase().includes(search.toLowerCase())
  );

  // Statistics
  const stats = useMemo(() => {
    const todayOrders = orders?.filter(o => {
      const orderDate = new Date(o.created_at);
      return isWithinInterval(orderDate, { start: startOfDay(new Date()), end: endOfDay(new Date()) });
    }) || [];
    
    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
    const avgOrderValue = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;
    const newOrders = orders?.filter(o => o.status === 'new').length || 0;
    
    return {
      todayCount: todayOrders.length,
      todayRevenue,
      avgOrderValue,
      newOrders
    };
  }, [orders]);

  // Print order
  const handlePrint = () => {
    if (!selectedOrder || !orderItems) return;
    
    const printContent = `
      <html>
        <head>
          <title>Buyurtma #${selectedOrder.id.slice(0, 8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .total { font-size: 16px; font-weight: bold; margin-top: 15px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>Buyurtma #${selectedOrder.id.slice(0, 8)}</h1>
          <div class="info">
            <p><strong>Mijoz:</strong> ${selectedOrder.user_fullname}</p>
            <p><strong>Telefon:</strong> ${selectedOrder.phone}</p>
            <p><strong>Manzil:</strong> ${selectedOrder.address}</p>
            <p><strong>Vaqt:</strong> ${format(new Date(selectedOrder.created_at), 'dd.MM.yyyy HH:mm')}</p>
            ${selectedOrder.notes ? `<p><strong>Izoh:</strong> ${selectedOrder.notes}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Mahsulot</th>
                <th>Soni</th>
                <th>Narxi</th>
                <th>Jami</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(Number(item.price))}</td>
                  <td>${formatPrice(item.quantity * Number(item.price))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="total">Jami: ${formatPrice(Number(selectedOrder.total_price))}</p>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Export to CSV
  const handleExport = () => {
    if (!filteredOrders.length) {
      toast.error("Eksport qilish uchun buyurtmalar yo'q");
      return;
    }
    
    const headers = ['ID', 'Mijoz', 'Telefon', 'Manzil', 'Hudud', "To'lov turi", 'Jami summa', 'Holat', 'Izoh', 'Sana'];
    
    const rows = filteredOrders.map(order => [
      order.id.slice(0, 8),
      order.user_fullname,
      order.phone,
      `"${order.address.replace(/"/g, '""')}"`,
      order.delivery_zone || '',
      order.payment_type || 'cash',
      order.total_price,
      getStatusInfo(order.status || 'new').label,
      order.notes ? `"${order.notes.replace(/"/g, '""')}"` : '',
      format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `buyurtmalar_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Buyurtmalar eksport qilindi');
  };

  return (
    <div className="space-y-6">
      {/* Statistics Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <ShoppingBag className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bugungi buyurtmalar</p>
              <p className="text-2xl font-display font-bold">{stats.todayCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bugungi daromad</p>
              <p className="text-2xl font-display font-bold text-secondary">{formatPrice(stats.todayRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Package className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">O'rtacha summa</p>
              <p className="text-2xl font-display font-bold">{formatPrice(Math.round(stats.avgOrderValue))}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/20">
              <Clock className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Yangi buyurtmalar</p>
              <p className="text-2xl font-display font-bold text-orange-400">{stats.newOrders}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-muted/50">
              <SelectValue placeholder="Holat bo'yicha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-48 bg-muted/50">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sana bo'yicha" />
            </SelectTrigger>
            <SelectContent>
              {dateFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {dateFilter === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-auto bg-muted/50">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {customDateRange.from && customDateRange.to 
                    ? `${format(customDateRange.from, 'dd.MM')} - ${format(customDateRange.to, 'dd.MM')}`
                    : 'Sana tanlang'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: customDateRange.from, to: customDateRange.to }}
                  onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  locale={uz}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Jami: {filteredOrders.length} ta buyurtma
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status || 'new');
            return (
              <Card key={order.id} className="glass border-border/50">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-lg">{order.user_fullname}</h3>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" /> {order.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" /> {order.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" /> {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-display text-secondary">{formatPrice(Number(order.total_price))}</p>
                        <p className="text-xs text-muted-foreground capitalize">{order.payment_type}</p>
                      </div>
                      <Select 
                        value={order.status || 'new'} 
                        onValueChange={(status) => updateStatusMutation.mutate({ id: order.id, status })}
                      >
                        <SelectTrigger className="w-40 bg-muted/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredOrders.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          Buyurtmalar topilmadi
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl glass">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center justify-between">
              <span>Buyurtma #{selectedOrder?.id.slice(0, 8)}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Chop etish
                </Button>
                {selectedOrder?.status !== 'cancelled' && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => selectedOrder && deleteOrderMutation.mutate(selectedOrder.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Bekor qilish
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6" ref={printRef}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" /> Mijoz
                  </p>
                  <p className="font-medium">{selectedOrder.user_fullname}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-4 w-4" /> Telefon
                  </p>
                  <p className="font-medium">{selectedOrder.phone}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Manzil
                  </p>
                  <p className="font-medium">{selectedOrder.address}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-4 w-4" /> To'lov turi
                  </p>
                  <p className="font-medium capitalize">{selectedOrder.payment_type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Vaqt
                  </p>
                  <p className="font-medium">{format(new Date(selectedOrder.created_at), 'dd.MM.yyyy HH:mm')}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Izoh</p>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-display text-lg mb-3">Buyurtma tarkibi</h4>
                <div className="space-y-2">
                  {orderItems?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/50">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} x {formatPrice(Number(item.price))}</p>
                      </div>
                      <p className="font-medium text-secondary">{formatPrice(item.quantity * Number(item.price))}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                  <span className="font-display text-lg">Jami</span>
                  <span className="text-2xl font-display text-secondary">{formatPrice(Number(selectedOrder.total_price))}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
