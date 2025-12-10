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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Plus, Search, Loader2, ArrowUpCircle, ArrowDownCircle, RefreshCw, Trash, Download, CalendarIcon, RotateCcw, Filter, BarChart3 } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';
import { uz } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryInvalidation } from '@/hooks/useQueryInvalidation';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const movementTypes = [
  { value: 'in', label: 'Kirim', icon: ArrowUpCircle, color: 'text-emerald-600 bg-emerald-100' },
  { value: 'out', label: 'Chiqim', icon: ArrowDownCircle, color: 'text-red-600 bg-red-100' },
  { value: 'return', label: 'Qaytarish', icon: RotateCcw, color: 'text-purple-600 bg-purple-100' },
  { value: 'adjustment', label: 'Tuzatish', icon: RefreshCw, color: 'text-blue-600 bg-blue-100' },
  { value: 'waste', label: 'Isrof', icon: Trash, color: 'text-orange-600 bg-orange-100' },
];

const dateFilters = [
  { value: 'all', label: 'Barchasi' },
  { value: 'today', label: 'Bugun' },
  { value: 'yesterday', label: 'Kecha' },
  { value: 'week', label: 'Oxirgi 7 kun' },
  { value: 'month', label: 'Oxirgi 30 kun' },
  { value: 'custom', label: 'Tanlash' },
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
  ingredients?: { name: string; unit: string; current_stock: number };
  suppliers?: { name: string };
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
}

interface Supplier {
  id: string;
  name: string;
}

const StockMovements = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [dateFilter, setDateFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [ingredientFilter, setIngredientFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date>();
  const [customDateTo, setCustomDateTo] = useState<Date>();
  const [compareData, setCompareData] = useState<{ ingredientId: string; actual: string }[]>([]);
  const { invalidateGroup } = useQueryInvalidation();

  useRealtimeSubscription(['stock_movements', 'ingredients']);

  const { data: movements, isLoading } = useQuery({
    queryKey: queryKeys.stockMovements,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, ingredients(name, unit, current_stock), suppliers(name)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as StockMovement[];
    },
  });

  const { data: ingredients } = useQuery({
    queryKey: queryKeys.adminIngredients,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, unit, current_stock')
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
      const { error } = await supabase.from('stock_movements').insert(movement as any);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup('stockMovements');
      toast.success("Harakat qo'shildi");
      setIsDialogOpen(false);
      setSelectedIngredient('');
    },
    onError: (error: any) => toast.error("Xatolik: " + error.message),
  });

  const saveComparisonMutation = useMutation({
    mutationFn: async (items: { ingredient_id: string; expected: number; actual: number }[]) => {
      const records = items.map(item => ({
        ingredient_id: item.ingredient_id,
        expected_quantity: item.expected,
        actual_quantity: item.actual,
        difference: item.actual - item.expected,
      }));
      const { error } = await supabase.from('inventory_counts').insert(records);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inventarizatsiya saqlandi");
      setIsCompareDialogOpen(false);
      setCompareData([]);
    },
    onError: (error: any) => toast.error("Xatolik: " + error.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const quantity = Number(formData.get('quantity'));
    const unitCost = Number(formData.get('unit_cost')) || null;

    saveMutation.mutate({
      ingredient_id: formData.get('ingredient_id') as string,
      movement_type: formData.get('movement_type') as string,
      quantity,
      unit_cost: unitCost,
      total_cost: unitCost ? quantity * unitCost : null,
      supplier_id: formData.get('supplier_id') as string || null,
      expiry_date: formData.get('expiry_date') as string || null,
      notes: formData.get('notes') as string || null,
    });
  };

  const handleComparisonSubmit = () => {
    const items = compareData
      .filter(d => d.actual !== '')
      .map(d => {
        const ing = ingredients?.find(i => i.id === d.ingredientId);
        return {
          ingredient_id: d.ingredientId,
          expected: ing?.current_stock || 0,
          actual: Number(d.actual),
        };
      });
    
    if (items.length === 0) {
      toast.error("Kamida bitta mahsulot uchun haqiqiy miqdorni kiriting");
      return;
    }
    saveComparisonMutation.mutate(items);
  };

  const getDateRange = () => {
    const today = new Date();
    switch (dateFilter) {
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'yesterday':
        return { from: startOfDay(subDays(today, 1)), to: endOfDay(subDays(today, 1)) };
      case 'week':
        return { from: startOfDay(subDays(today, 7)), to: endOfDay(today) };
      case 'month':
        return { from: startOfDay(subDays(today, 30)), to: endOfDay(today) };
      case 'custom':
        if (customDateFrom && customDateTo) {
          return { from: startOfDay(customDateFrom), to: endOfDay(customDateTo) };
        }
        return null;
      default:
        return null;
    }
  };

  const filteredMovements = movements?.filter(m => {
    const matchesSearch = m.ingredients?.name.toLowerCase().includes(search.toLowerCase()) ||
      m.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesType = activeTab === 'all' || m.movement_type === activeTab;
    const matchesSupplier = supplierFilter === 'all' || m.supplier_id === supplierFilter;
    const matchesIngredient = ingredientFilter === 'all' || m.ingredient_id === ingredientFilter;
    
    const dateRange = getDateRange();
    const matchesDate = !dateRange || isWithinInterval(new Date(m.created_at), { start: dateRange.from, end: dateRange.to });

    return matchesSearch && matchesType && matchesSupplier && matchesIngredient && matchesDate;
  });

  const exportToCSV = () => {
    if (!filteredMovements || filteredMovements.length === 0) {
      toast.error("Eksport qilish uchun ma'lumot yo'q");
      return;
    }

    const headers = ['Sana', 'Mahsulot', 'Tur', 'Miqdor', 'Birlik', 'Narxi', 'Jami', 'Yetkazuvchi', 'Izoh'];
    const rows = filteredMovements.map(m => [
      format(new Date(m.created_at), 'dd.MM.yyyy HH:mm'),
      m.ingredients?.name || '',
      getMovementType(m.movement_type).label,
      m.quantity,
      m.ingredients?.unit || '',
      m.unit_cost || '',
      m.total_cost || '',
      m.suppliers?.name || '',
      m.notes || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `harakatlar_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV fayl yuklandi");
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  const getMovementType = (type: string) => movementTypes.find(t => t.value === type) || movementTypes[0];
  const selectedIng = ingredients?.find(i => i.id === selectedIngredient);

  const totalIn = filteredMovements?.filter(m => m.movement_type === 'in').reduce((sum, m) => sum + (m.total_cost || 0), 0) || 0;
  const totalOut = filteredMovements?.filter(m => m.movement_type === 'out').reduce((sum, m) => sum + (m.total_cost || 0), 0) || 0;
  const totalReturn = filteredMovements?.filter(m => m.movement_type === 'return').reduce((sum, m) => sum + (m.total_cost || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Jami kirim</div>
            <div className="text-2xl font-bold text-emerald-600">{formatPrice(totalIn)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Jami chiqim</div>
            <div className="text-2xl font-bold text-red-600">{formatPrice(totalOut)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Qaytarilgan</div>
            <div className="text-2xl font-bold text-purple-600">{formatPrice(totalReturn)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="text-sm text-slate-500">Harakatlar soni</div>
            <div className="text-2xl font-bold text-slate-900">{filteredMovements?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex gap-3 flex-1 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-50 border-slate-200 text-slate-900"
            />
          </div>

          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200 text-slate-900">
              <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              {dateFilters.map(df => (
                <SelectItem key={df.value} value={df.value}>{df.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[130px] justify-start text-left font-normal bg-slate-50 border-slate-200", !customDateFrom && "text-slate-400")}>
                    {customDateFrom ? format(customDateFrom, 'dd.MM.yyyy') : 'Dan'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} locale={uz} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <span className="text-slate-400">—</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[130px] justify-start text-left font-normal bg-slate-50 border-slate-200", !customDateTo && "text-slate-400")}>
                    {customDateTo ? format(customDateTo, 'dd.MM.yyyy') : 'Gacha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} locale={uz} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Supplier Filter */}
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 text-slate-900">
              <SelectValue placeholder="Yetkazuvchi" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="all">Barcha yetkazuvchilar</SelectItem>
              {suppliers?.map(sup => (
                <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ingredient Filter */}
          <Select value={ingredientFilter} onValueChange={setIngredientFilter}>
            <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 text-slate-900">
              <SelectValue placeholder="Mahsulot" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="all">Barcha mahsulotlar</SelectItem>
              {ingredients?.map(ing => (
                <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Movement Type Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-slate-900">Hammasi</TabsTrigger>
            <TabsTrigger value="in" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 text-emerald-600">Kirim</TabsTrigger>
            <TabsTrigger value="out" className="data-[state=active]:bg-white data-[state=active]:text-red-600 text-red-600">Chiqim</TabsTrigger>
            <TabsTrigger value="return" className="data-[state=active]:bg-white data-[state=active]:text-purple-600 text-purple-600">Qaytarish</TabsTrigger>
            <TabsTrigger value="waste" className="data-[state=active]:bg-white data-[state=active]:text-orange-600 text-orange-600">Isrof</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" onClick={exportToCSV} className="border-slate-200 text-slate-700 hover:bg-slate-50">
          <Download className="h-4 w-4 mr-2" />
          CSV eksport
        </Button>

        <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
              <BarChart3 className="h-4 w-4 mr-2" />
              Inventarizatsiya
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white border-slate-200 max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-slate-900">Inventarizatsiya - Qoldiqlarni solishtirish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Haqiqiy qoldiqni kiriting va tizim qoldig'i bilan solishtiring</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mahsulot</TableHead>
                    <TableHead>Birlik</TableHead>
                    <TableHead>Tizim qoldig'i</TableHead>
                    <TableHead>Haqiqiy qoldiq</TableHead>
                    <TableHead>Farq</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredients?.map(ing => {
                    const data = compareData.find(d => d.ingredientId === ing.id);
                    const actual = data?.actual ? Number(data.actual) : null;
                    const diff = actual !== null ? actual - ing.current_stock : null;
                    return (
                      <TableRow key={ing.id}>
                        <TableCell className="font-medium text-slate-900">{ing.name}</TableCell>
                        <TableCell className="text-slate-500">{ing.unit}</TableCell>
                        <TableCell className="text-slate-900">{ing.current_stock}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={data?.actual || ''}
                            onChange={(e) => {
                              setCompareData(prev => {
                                const existing = prev.find(d => d.ingredientId === ing.id);
                                if (existing) {
                                  return prev.map(d => d.ingredientId === ing.id ? { ...d, actual: e.target.value } : d);
                                }
                                return [...prev, { ingredientId: ing.id, actual: e.target.value }];
                              });
                            }}
                            className="w-24 bg-slate-50 border-slate-200 text-slate-900"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          {diff !== null && (
                            <span className={cn(
                              "font-medium",
                              diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-slate-500"
                            )}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Button onClick={handleComparisonSubmit} className="w-full bg-gradient-primary" disabled={saveComparisonMutation.isPending}>
                {saveComparisonMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Inventarizatsiyani saqlash
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedIngredient(''); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary ml-auto">
              <Plus className="h-4 w-4 mr-2" />
              Yangi harakat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-slate-900">Ombor harakati qo'shish</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Mahsulot</Label>
                <Select name="ingredient_id" required value={selectedIngredient} onValueChange={setSelectedIngredient}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                    <SelectValue placeholder="Mahsulotni tanlang" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {ingredients?.map(ing => (
                      <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Harakat turi</Label>
                  <Select name="movement_type" defaultValue="in">
                    <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {movementTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Miqdor {selectedIng && `(${selectedIng.unit})`}</Label>
                  <Input name="quantity" type="number" step="0.01" required className="bg-slate-50 border-slate-200 text-slate-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Narxi (birlik)</Label>
                  <Input name="unit_cost" type="number" className="bg-slate-50 border-slate-200 text-slate-900" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Yaroqlilik muddati</Label>
                  <Input name="expiry_date" type="date" className="bg-slate-50 border-slate-200 text-slate-900" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Yetkazib beruvchi</Label>
                <Select name="supplier_id">
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                    <SelectValue placeholder="Tanlang (ixtiyoriy)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {suppliers?.map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Izoh</Label>
                <Textarea name="notes" className="bg-slate-50 border-slate-200 text-slate-900" />
              </div>

              <Button type="submit" className="w-full bg-gradient-primary" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Saqlash
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="bg-white border-slate-200 overflow-hidden">
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
                        <TableCell className="text-slate-500 whitespace-nowrap">
                          {format(new Date(mov.created_at), 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">{mov.ingredients?.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${typeInfo.color}`}>
                            <TypeIcon className="h-3.5 w-3.5" />
                            {typeInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-900">{mov.quantity} {mov.ingredients?.unit}</TableCell>
                        <TableCell className="text-slate-500">{mov.unit_cost ? formatPrice(mov.unit_cost) : '-'}</TableCell>
                        <TableCell className="text-emerald-600 font-medium">{mov.total_cost ? formatPrice(mov.total_cost) : '-'}</TableCell>
                        <TableCell className="text-slate-500">{mov.suppliers?.name || '-'}</TableCell>
                        <TableCell className="text-slate-500 max-w-[200px] truncate">{mov.notes || '-'}</TableCell>
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
        <div className="text-center py-12 text-slate-500">Harakatlar topilmadi</div>
      )}
    </div>
  );
};

export default StockMovements;
