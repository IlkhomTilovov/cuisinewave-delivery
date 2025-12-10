import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Search, Loader2, ArrowUpCircle, ArrowDownCircle, RefreshCw, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryInvalidation } from '@/hooks/useQueryInvalidation';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const movementTypes = [
  { value: 'in', label: 'Kirim', icon: ArrowUpCircle, color: 'text-green-400 bg-green-500/20' },
  { value: 'out', label: 'Chiqim', icon: ArrowDownCircle, color: 'text-red-400 bg-red-500/20' },
  { value: 'adjustment', label: 'Tuzatish', icon: RefreshCw, color: 'text-blue-400 bg-blue-500/20' },
  { value: 'waste', label: 'Isrof', icon: Trash, color: 'text-orange-400 bg-orange-500/20' },
];

interface StockMovement {
  id: string;
  ingredient_id: string;
  movement_type: string;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  supplier_id: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  ingredients?: { name: string; unit: string };
  suppliers?: { name: string };
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface Supplier {
  id: string;
  name: string;
}

const StockMovements = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const { invalidateGroup } = useQueryInvalidation();

  // Real-time subscription
  useRealtimeSubscription(['stock_movements', 'ingredients']);

  const { data: movements, isLoading } = useQuery({
    queryKey: queryKeys.stockMovements,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, ingredients(name, unit), suppliers(name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as StockMovement[];
    },
  });

  const { data: ingredients } = useQuery({
    queryKey: queryKeys.adminIngredients,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, unit')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Ingredient[];
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: queryKeys.suppliers,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (movement: Partial<StockMovement>) => {
      const { error } = await supabase
        .from('stock_movements')
        .insert(movement as any);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup('stockMovements');
      toast.success("Harakat qo'shildi");
      setIsDialogOpen(false);
      setSelectedIngredient('');
    },
    onError: (error: any) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const quantity = Number(formData.get('quantity'));
    const unitCost = Number(formData.get('unit_cost')) || null;
    
    const movement: Partial<StockMovement> = {
      ingredient_id: formData.get('ingredient_id') as string,
      movement_type: formData.get('movement_type') as string,
      quantity,
      unit_cost: unitCost,
      total_cost: unitCost ? quantity * unitCost : null,
      supplier_id: formData.get('supplier_id') as string || null,
      expiry_date: formData.get('expiry_date') as string || null,
      notes: formData.get('notes') as string || null,
    };

    saveMutation.mutate(movement);
  };

  // Filter movements
  const filteredMovements = movements?.filter(m => {
    const matchesSearch = m.ingredients?.name.toLowerCase().includes(search.toLowerCase()) ||
      m.notes?.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab !== 'all') {
      return matchesSearch && m.movement_type === activeTab;
    }
    return matchesSearch;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  const getMovementType = (type: string) => {
    return movementTypes.find(t => t.value === type) || movementTypes[0];
  };

  const selectedIng = ingredients?.find(i => i.id === selectedIngredient);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">Hammasi</TabsTrigger>
              <TabsTrigger value="in" className="text-green-400">Kirim</TabsTrigger>
              <TabsTrigger value="out" className="text-red-400">Chiqim</TabsTrigger>
              <TabsTrigger value="waste" className="text-orange-400">Isrof</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedIngredient('');
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Yangi harakat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg glass">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Ombor harakati qo'shish
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ingredient_id">Mahsulot</Label>
                <Select 
                  name="ingredient_id" 
                  required
                  value={selectedIngredient}
                  onValueChange={setSelectedIngredient}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Mahsulotni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients?.map(ing => (
                      <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="movement_type">Harakat turi</Label>
                  <Select name="movement_type" defaultValue="in">
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {movementTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Miqdor {selectedIng && `(${selectedIng.unit})`}
                  </Label>
                  <Input 
                    id="quantity" 
                    name="quantity" 
                    type="number" 
                    step="0.01" 
                    required 
                    className="bg-muted/50" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Narxi (birlik)</Label>
                  <Input id="unit_cost" name="unit_cost" type="number" className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Yaroqlilik muddati</Label>
                  <Input id="expiry_date" name="expiry_date" type="date" className="bg-muted/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_id">Yetkazib beruvchi</Label>
                <Select name="supplier_id">
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Tanlang (ixtiyoriy)" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Izoh</Label>
                <Textarea id="notes" name="notes" className="bg-muted/50" />
              </div>

              <Button type="submit" className="w-full bg-gradient-primary" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Saqlash
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="glass border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Mahsulot</TableHead>
                    <TableHead>Tur</TableHead>
                    <TableHead>Miqdor</TableHead>
                    <TableHead>Narxi</TableHead>
                    <TableHead>Jami</TableHead>
                    <TableHead>Yetkazuvchi</TableHead>
                    <TableHead>Izoh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements?.map((mov) => {
                    const typeInfo = getMovementType(mov.movement_type);
                    const TypeIcon = typeInfo.icon;
                    
                    return (
                      <TableRow key={mov.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(mov.created_at), 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {mov.ingredients?.name}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${typeInfo.color}`}>
                            <TypeIcon className="h-3.5 w-3.5" />
                            {typeInfo.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {mov.quantity} {mov.ingredients?.unit}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {mov.unit_cost ? formatPrice(mov.unit_cost) : '-'}
                        </TableCell>
                        <TableCell className="text-secondary font-medium">
                          {mov.total_cost ? formatPrice(mov.total_cost) : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {mov.suppliers?.name || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {mov.notes || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredMovements?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          Harakatlar topilmadi
        </div>
      )}
    </div>
  );
};

export default StockMovements;
