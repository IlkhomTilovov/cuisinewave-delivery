import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Search, Plus, Loader2, Phone, User, Car, Bike, Edit, Trash2, Package, ChevronDown, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;

interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  is_active: boolean;
  is_available: boolean;
  current_orders_count: number;
  max_orders: number;
  notes: string | null;
  created_at: string;
}

const vehicleTypes = [
  { value: 'car', label: 'Avtomobil', icon: Car },
  { value: 'motorcycle', label: 'Mototsikl', icon: Bike },
  { value: 'bicycle', label: 'Velosiped', icon: Bike },
  { value: 'walk', label: 'Piyoda', icon: User },
];

const statusLabels: Record<string, string> = {
  new: 'Yangi',
  cooking: 'Tayyorlanmoqda',
  on_the_way: "Yo'lda",
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-600',
  cooking: 'bg-orange-100 text-orange-600',
  on_the_way: 'bg-purple-100 text-purple-600',
  delivered: 'bg-emerald-100 text-emerald-600',
  cancelled: 'bg-red-100 text-red-600',
};

const Couriers = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [expandedCourier, setExpandedCourier] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '+998',
    vehicle_type: 'car',
    max_orders: 5,
    notes: '',
  });
  
  const queryClient = useQueryClient();

  const { data: couriers, isLoading } = useQuery({
    queryKey: ['couriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('couriers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Courier[];
    },
  });

  // Fetch all active orders with courier assignments
  const { data: courierOrders } = useQuery({
    queryKey: ['courier-orders-all'],
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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('couriers').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couriers'] });
      toast.success("Kuryer qo'shildi");
      resetForm();
    },
    onError: (error) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Courier> }) => {
      const { error } = await supabase
        .from('couriers')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couriers'] });
      toast.success('Kuryer yangilandi');
      resetForm();
    },
    onError: (error) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('couriers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couriers'] });
      toast.success("Kuryer o'chirildi");
    },
    onError: (error) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '+998',
      vehicle_type: 'car',
      max_orders: 5,
      notes: '',
    });
    setEditingCourier(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourier) {
      updateMutation.mutate({ id: editingCourier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (courier: Courier) => {
    setEditingCourier(courier);
    setFormData({
      name: courier.name,
      phone: courier.phone,
      vehicle_type: courier.vehicle_type,
      max_orders: courier.max_orders,
      notes: courier.notes || '',
    });
    setIsDialogOpen(true);
  };

  const toggleActive = (courier: Courier) => {
    updateMutation.mutate({ id: courier.id, data: { is_active: !courier.is_active } });
  };

  const toggleAvailable = (courier: Courier) => {
    updateMutation.mutate({ id: courier.id, data: { is_available: !courier.is_available } });
  };

  const filteredCouriers = couriers?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const getVehicleInfo = (type: string) => {
    return vehicleTypes.find(v => v.value === type) || vehicleTypes[0];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Kuryer qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="h-4 w-4 mr-2" />
              Kuryer qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingCourier ? "Kuryerni tahrirlash" : "Yangi kuryer"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ism *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Kuryer ismi"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    let phone = e.target.value;
                    if (!phone.startsWith('+998')) {
                      phone = '+998' + phone.replace(/\D/g, '').slice(0, 9);
                    } else {
                      const digits = phone.slice(4).replace(/\D/g, '').slice(0, 9);
                      phone = '+998' + digits;
                    }
                    setFormData({ ...formData, phone });
                  }}
                  placeholder="+998901234567"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Transport turi</Label>
                <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_orders">Maksimal buyurtmalar soni</Label>
                <Input
                  id="max_orders"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.max_orders}
                  onChange={(e) => setFormData({ ...formData, max_orders: parseInt(e.target.value) || 5 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Izoh</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Qo'shimcha ma'lumot..."
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Bekor qilish
                </Button>
                <Button type="submit" variant="gold" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCourier ? 'Saqlash' : "Qo'shish"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Jami kuryerlar</p>
            <p className="text-2xl font-display font-bold text-slate-900">{couriers?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Faol</p>
            <p className="text-2xl font-display font-bold text-emerald-600">
              {couriers?.filter(c => c.is_active && c.is_available).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Band</p>
            <p className="text-2xl font-display font-bold text-orange-600">
              {couriers?.filter(c => c.is_active && !c.is_available).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Faol buyurtmalar</p>
            <p className="text-2xl font-display font-bold text-blue-600">
              {courierOrders?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Couriers List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCouriers?.map((courier) => {
            const vehicleInfo = getVehicleInfo(courier.vehicle_type);
            const VehicleIcon = vehicleInfo.icon;
            const courierOrdersList = ordersByCourier[courier.id] || [];
            const hasOrders = courierOrdersList.length > 0;
            const isExpanded = expandedCourier === courier.id;
            
            return (
              <Card key={courier.id} className={`bg-white border-slate-200 ${!courier.is_active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-100">
                        <VehicleIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-slate-900">{courier.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {courier.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(courier)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(courier.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={courier.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}>
                      {courier.is_active ? 'Faol' : 'Nofaol'}
                    </Badge>
                    <Badge className={courier.is_available ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}>
                      {courier.is_available ? 'Bo\'sh' : 'Band'}
                    </Badge>
                    <Badge variant="outline" className="ml-auto">
                      <Package className="h-3 w-3 mr-1" />
                      {courierOrdersList.length}/{courier.max_orders}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Faol:</span>
                      <Switch 
                        checked={courier.is_active} 
                        onCheckedChange={() => toggleActive(courier)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Bo'sh:</span>
                      <Switch 
                        checked={courier.is_available} 
                        onCheckedChange={() => toggleAvailable(courier)}
                        disabled={!courier.is_active}
                      />
                    </div>
                  </div>

                  {/* Orders Section */}
                  {hasOrders && (
                    <Collapsible 
                      open={isExpanded} 
                      onOpenChange={() => setExpandedCourier(isExpanded ? null : courier.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" size="sm">
                          <span className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Buyurtmalar ({courierOrdersList.length})
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-2">
                        {courierOrdersList.map((order) => (
                          <div 
                            key={order.id} 
                            className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{order.user_fullname}</span>
                              <Badge className={statusColors[order.status || 'new']} >
                                {statusLabels[order.status || 'new']}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{order.address}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1 text-slate-500">
                                <Clock className="h-3 w-3" />
                                {format(new Date(order.created_at), 'HH:mm')}
                              </span>
                              <span className="font-semibold text-emerald-600">
                                {formatPrice(Number(order.total_price))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {!hasOrders && (
                    <div className="text-center py-2 text-xs text-slate-500">
                      Faol buyurtmalar yo'q
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredCouriers?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-slate-500">
          Kuryerlar topilmadi
        </div>
      )}
    </div>
  );
};

export default Couriers;
