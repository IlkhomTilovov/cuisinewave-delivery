import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Loader2, Package, AlertTriangle, TrendingDown, Download, Upload, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryInvalidation } from '@/hooks/useQueryInvalidation';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const unitOptions = [
  { value: 'kg', label: 'Kilogramm (kg)' },
  { value: 'g', label: 'Gramm (g)' },
  { value: 'litr', label: 'Litr' },
  { value: 'ml', label: 'Millilitr (ml)' },
  { value: 'dona', label: 'Dona' },
];

const categoryOptions = [
  { value: 'gost', label: "Go'sht" },
  { value: 'sabzavot', label: 'Sabzavotlar' },
  { value: 'sous', label: 'Souslar' },
  { value: 'non', label: 'Non/Bulochka' },
  { value: 'ichimlik', label: 'Ichimliklar' },
  { value: 'qadoq', label: 'Qadoqlash' },
  { value: 'boshqa', label: 'Boshqa' },
];

interface Ingredient {
  id: string;
  name: string;
  name_uz: string | null;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

const Inventory = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isNotifying, setIsNotifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { invalidateGroup } = useQueryInvalidation();

  useRealtimeSubscription(['ingredients', 'stock_movements']);

  const { data: ingredients, isLoading } = useQuery({
    queryKey: queryKeys.adminIngredients,
    queryFn: async () => {
      const { data, error } = await supabase.from('ingredients').select('*').order('name');
      if (error) throw error;
      return data as Ingredient[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (ingredient: Partial<Ingredient>) => {
      if (editingIngredient) {
        const { error } = await supabase.from('ingredients').update(ingredient).eq('id', editingIngredient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ingredients').insert(ingredient as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateGroup('ingredients');
      toast.success(editingIngredient ? 'Mahsulot yangilandi' : "Mahsulot qo'shildi");
      setIsDialogOpen(false);
      setEditingIngredient(null);
    },
    onError: (error: any) => toast.error("Xatolik: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ingredients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup('ingredients');
      toast.success("Mahsulot o'chirildi");
    },
    onError: (error: any) => toast.error("Xatolik: " + error.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveMutation.mutate({
      name: formData.get('name') as string,
      name_uz: formData.get('name_uz') as string || null,
      unit: formData.get('unit') as string,
      min_stock: Number(formData.get('min_stock')) || 0,
      cost_per_unit: Number(formData.get('cost_per_unit')) || 0,
      category: formData.get('category') as string || null,
      is_active: formData.get('is_active') === 'on',
    });
  };

  const filteredIngredients = ingredients?.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.name_uz?.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'low') return matchesSearch && i.current_stock <= i.min_stock;
    return matchesSearch;
  });

  const totalItems = ingredients?.length || 0;
  const lowStockItems = ingredients?.filter(i => i.current_stock <= i.min_stock).length || 0;
  const totalValue = ingredients?.reduce((sum, i) => sum + (i.current_stock * i.cost_per_unit), 0) || 0;
  const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + " so'm";

  const exportToCSV = () => {
    if (!ingredients?.length) return toast.error("Ma'lumot yo'q");
    const csv = [['Nomi', 'Qoldiq', 'Min', 'Birlik', 'Narx'].join(','), ...ingredients.map(i => [i.name, i.current_stock, i.min_stock, i.unit, i.cost_per_unit].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ombor_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const sendNotification = async () => {
    if (lowStockItems === 0) return toast.info("Kam qolgan mahsulot yo'q");
    setIsNotifying(true);
    try {
      const { data } = await supabase.functions.invoke('check-low-stock');
      toast.success(data?.notificationsSent > 0 ? 'Telegram xabar yuborildi' : 'Telegram sozlanmagan');
    } catch { toast.error('Xatolik'); }
    setIsNotifying(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600"><Package className="h-6 w-6" /></div>
            <div><p className="text-sm text-slate-500">Jami</p><p className="text-2xl font-display text-slate-900">{totalItems}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 text-red-600"><AlertTriangle className="h-6 w-6" /></div>
            <div><p className="text-sm text-slate-500">Kam qolgan</p><p className="text-2xl font-display text-slate-900">{lowStockItems}</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600"><TrendingDown className="h-6 w-6" /></div>
            <div><p className="text-sm text-slate-500">Qiymat</p><p className="text-2xl font-display text-slate-900">{formatPrice(totalValue)}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-slate-50 border-slate-200" />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">Hammasi</TabsTrigger>
              <TabsTrigger value="low" className="data-[state=active]:bg-white data-[state=active]:text-red-600 text-red-500">Kam ({lowStockItems})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} className="border-slate-200 text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4 mr-1" />Export</Button>
          <Button variant="outline" size="sm" onClick={sendNotification} disabled={isNotifying || lowStockItems === 0} className={`border-slate-200 ${lowStockItems > 0 ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-slate-400'}`}>
            {isNotifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4 mr-1" />}Telegram
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingIngredient(null); }}>
            <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="h-4 w-4 mr-2" />Yangi</Button></DialogTrigger>
            <DialogContent className="max-w-lg bg-white border-slate-200">
              <DialogHeader><DialogTitle className="text-slate-900">{editingIngredient ? "Tahrirlash" : "Qo'shish"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Nomi</Label>
                    <Input name="name" defaultValue={editingIngredient?.name} required className="bg-slate-50 border-slate-200 text-slate-900" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Nomi (UZ)</Label>
                    <Input name="name_uz" defaultValue={editingIngredient?.name_uz || ''} className="bg-slate-50 border-slate-200 text-slate-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Birlik</Label>
                    <Select name="unit" defaultValue={editingIngredient?.unit || 'kg'}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900"><SelectValue /></SelectTrigger>
                      <SelectContent>{unitOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Kategoriya</Label>
                    <Select name="category" defaultValue={editingIngredient?.category || ''}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                      <SelectContent>{categoryOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Min. zaxira</Label>
                    <Input name="min_stock" type="number" step="0.01" defaultValue={editingIngredient?.min_stock || 0} className="bg-slate-50 border-slate-200 text-slate-900" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Narxi</Label>
                    <Input name="cost_per_unit" type="number" defaultValue={editingIngredient?.cost_per_unit || 0} className="bg-slate-50 border-slate-200 text-slate-900" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch name="is_active" defaultChecked={editingIngredient?.is_active ?? true} />
                  <Label className="text-slate-700">Faol</Label>
                </div>
                <Button type="submit" className="w-full bg-gradient-primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Saqlash
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
        <Card className="bg-white border-slate-200 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nomi</TableHead><TableHead>Kategoriya</TableHead><TableHead>Qoldiq</TableHead><TableHead>Min</TableHead><TableHead>Narxi</TableHead><TableHead>Qiymat</TableHead><TableHead className="text-right">Amallar</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredIngredients?.map((ing) => {
                  const isLow = ing.current_stock <= ing.min_stock;
                  return (
                    <TableRow key={ing.id} className={isLow ? 'bg-red-50' : ''}>
                      <TableCell><div className="flex items-center gap-2">{isLow && <AlertTriangle className="h-4 w-4 text-red-600" />}<span className="font-medium text-slate-900">{ing.name}</span></div></TableCell>
                      <TableCell className="text-slate-500">{categoryOptions.find(c => c.value === ing.category)?.label || '-'}</TableCell>
                      <TableCell className={isLow ? 'text-red-600 font-medium' : 'text-slate-900'}>{ing.current_stock} {ing.unit}</TableCell>
                      <TableCell className="text-slate-500">{ing.min_stock} {ing.unit}</TableCell>
                      <TableCell className="text-slate-900">{formatPrice(ing.cost_per_unit)}/{ing.unit}</TableCell>
                      <TableCell className="text-emerald-600 font-medium">{formatPrice(ing.current_stock * ing.cost_per_unit)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingIngredient(ing); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => confirm("O'chirmoqchimisiz?") && deleteMutation.mutate(ing.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {filteredIngredients?.length === 0 && !isLoading && <div className="text-center py-12 text-slate-500">Mahsulotlar topilmadi</div>}
    </div>
  );
};

export default Inventory;