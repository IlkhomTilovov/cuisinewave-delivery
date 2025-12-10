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
import { toast } from 'sonner';
import { Search, Plus, Loader2, Phone, User, Car, Bike, Edit, Trash2, Package } from 'lucide-react';

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

const Couriers = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kuryer qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="h-4 w-4 mr-2" />
              Kuryer qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
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
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Jami kuryerlar</p>
            <p className="text-2xl font-display font-bold">{couriers?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Faol</p>
            <p className="text-2xl font-display font-bold text-green-400">
              {couriers?.filter(c => c.is_active && c.is_available).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Band</p>
            <p className="text-2xl font-display font-bold text-orange-400">
              {couriers?.filter(c => c.is_active && !c.is_available).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Jami buyurtmalar</p>
            <p className="text-2xl font-display font-bold text-secondary">
              {couriers?.reduce((sum, c) => sum + c.current_orders_count, 0) || 0}
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
            const isBusy = courier.current_orders_count >= courier.max_orders;
            
            return (
              <Card key={courier.id} className={`glass border-border/50 ${!courier.is_active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/20">
                        <VehicleIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold">{courier.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
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
                    <Badge className={courier.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {courier.is_active ? 'Faol' : 'Nofaol'}
                    </Badge>
                    <Badge className={courier.is_available && !isBusy ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}>
                      {isBusy ? 'Band' : courier.is_available ? 'Bo\'sh' : 'Band'}
                    </Badge>
                    <Badge variant="outline" className="ml-auto">
                      <Package className="h-3 w-3 mr-1" />
                      {courier.current_orders_count}/{courier.max_orders}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Faol:</span>
                      <Switch 
                        checked={courier.is_active} 
                        onCheckedChange={() => toggleActive(courier)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Bo'sh:</span>
                      <Switch 
                        checked={courier.is_available} 
                        onCheckedChange={() => toggleAvailable(courier)}
                        disabled={!courier.is_active}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredCouriers?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          Kuryerlar topilmadi
        </div>
      )}
    </div>
  );
};

export default Couriers;
