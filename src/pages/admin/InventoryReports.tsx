import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingDown, DollarSign, Trash2, Download, History } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { queryKeys } from '@/lib/queryKeys';

const periodOptions = [
  { value: '7', label: 'Oxirgi 7 kun' },
  { value: '30', label: 'Oxirgi 30 kun' },
  { value: '90', label: 'Oxirgi 3 oy' },
];

const InventoryReports = () => {
  const [period, setPeriod] = useState('30');
  const startDate = startOfDay(subDays(new Date(), parseInt(period)));
  const endDate = endOfDay(new Date());

  // Sarflanish hisoboti
  const { data: usageReport, isLoading: usageLoading } = useQuery({
    queryKey: ['usage-report', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('ingredient_id, quantity, ingredients(name, unit, cost_per_unit)')
        .eq('movement_type', 'out')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (error) throw error;

      // Group by ingredient
      const grouped = data?.reduce((acc, mov) => {
        const key = mov.ingredient_id;
        if (!acc[key]) {
          acc[key] = {
            name: mov.ingredients?.name || 'Noma\'lum',
            unit: mov.ingredients?.unit || '',
            cost: mov.ingredients?.cost_per_unit || 0,
            totalQty: 0,
            totalCost: 0,
          };
        }
        acc[key].totalQty += mov.quantity;
        acc[key].totalCost += mov.quantity * acc[key].cost;
        return acc;
      }, {} as Record<string, any>) || {};

      return Object.values(grouped).sort((a: any, b: any) => b.totalCost - a.totalCost);
    },
  });

  // Isrof hisoboti
  const { data: wasteReport, isLoading: wasteLoading } = useQuery({
    queryKey: ['waste-report', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('ingredient_id, quantity, notes, created_at, ingredients(name, unit, cost_per_unit)')
        .eq('movement_type', 'waste')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Tannarx hisoboti
  const { data: costReport, isLoading: costLoading } = useQuery({
    queryKey: ['cost-report'],
    queryFn: async () => {
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, price, discount_price')
        .eq('is_active', true);
      
      if (prodError) throw prodError;

      const { data: productIngredients, error: piError } = await supabase
        .from('product_ingredients')
        .select('product_id, quantity_needed, ingredients(name, cost_per_unit, unit)');
      
      if (piError) throw piError;

      // Calculate cost per product
      return products?.map(product => {
        const ingredients = productIngredients?.filter(pi => pi.product_id === product.id) || [];
        const ingredientCost = ingredients.reduce((sum, pi) => {
          return sum + (pi.quantity_needed * (pi.ingredients?.cost_per_unit || 0));
        }, 0);
        const sellingPrice = product.discount_price || product.price;
        const profit = sellingPrice - ingredientCost;
        const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

        return {
          name: product.name,
          ingredientCost,
          sellingPrice,
          profit,
          margin,
          ingredients: ingredients.map(pi => ({
            name: pi.ingredients?.name,
            qty: pi.quantity_needed,
            unit: pi.ingredients?.unit,
            cost: pi.quantity_needed * (pi.ingredients?.cost_per_unit || 0),
          })),
        };
      }).sort((a, b) => b.margin - a.margin);
    },
  });

  // Narx tarixi
  const { data: priceHistory, isLoading: priceLoading } = useQuery({
    queryKey: ['price-history', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredient_price_history')
        .select('*, ingredients(name, unit)')
        .gte('changed_at', startDate.toISOString())
        .order('changed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  const totalUsageCost = usageReport?.reduce((sum: number, item: any) => sum + item.totalCost, 0) || 0;
  const totalWasteCost = wasteReport?.reduce((sum, item: any) => {
    return sum + (item.quantity * (item.ingredients?.cost_per_unit || 0));
  }, 0) || 0;

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-slate-900">Ombor hisobotlari</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48 bg-slate-50 border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Umumiy sarflanish</p>
              <p className="text-2xl font-display text-slate-900">{formatPrice(totalUsageCost)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Umumiy isrof</p>
              <p className="text-2xl font-display text-slate-900">{formatPrice(totalWasteCost)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">O'rtacha marja</p>
              <p className="text-2xl font-display text-slate-900">
                {costReport?.length ? (costReport.reduce((s, c) => s + c.margin, 0) / costReport.length).toFixed(1) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Sarflanish</TabsTrigger>
          <TabsTrigger value="waste">Isrof</TabsTrigger>
          <TabsTrigger value="cost">Tannarx</TabsTrigger>
          <TabsTrigger value="price-history">Narx tarixi</TabsTrigger>
        </TabsList>

        {/* Sarflanish */}
        <TabsContent value="usage">
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Sarflanish hisoboti</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV(usageReport || [], 'sarflanish')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mahsulot</TableHead>
                      <TableHead>Miqdor</TableHead>
                      <TableHead>Birlik narxi</TableHead>
                      <TableHead>Jami qiymat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageReport?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                        <TableCell>{item.totalQty.toFixed(2)} {item.unit}</TableCell>
                        <TableCell className="text-slate-600">{formatPrice(item.cost)}</TableCell>
                        <TableCell className="text-emerald-600 font-medium">{formatPrice(item.totalCost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Isrof */}
        <TabsContent value="waste">
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Isrof hisoboti</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV(wasteReport?.map(w => ({
                  sana: format(new Date(w.created_at), 'dd.MM.yyyy'),
                  mahsulot: w.ingredients?.name,
                  miqdor: w.quantity,
                  birlik: w.ingredients?.unit,
                  qiymat: w.quantity * (w.ingredients?.cost_per_unit || 0),
                  izoh: w.notes
                })) || [], 'isrof')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {wasteLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Mahsulot</TableHead>
                      <TableHead>Miqdor</TableHead>
                      <TableHead>Qiymat</TableHead>
                      <TableHead>Izoh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wasteReport?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-slate-500 whitespace-nowrap">
                          {format(new Date(item.created_at), 'dd.MM.yyyy')}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">{item.ingredients?.name}</TableCell>
                        <TableCell>{item.quantity} {item.ingredients?.unit}</TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {formatPrice(item.quantity * (item.ingredients?.cost_per_unit || 0))}
                        </TableCell>
                        <TableCell className="text-slate-500 max-w-[200px] truncate">{item.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tannarx */}
        <TabsContent value="cost">
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Tannarx hisoboti</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV(costReport?.map(c => ({
                  taom: c.name,
                  tannarx: c.ingredientCost,
                  narx: c.sellingPrice,
                  foyda: c.profit,
                  marja: c.margin.toFixed(1) + '%'
                })) || [], 'tannarx')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {costLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Taom</TableHead>
                      <TableHead>Tannarx</TableHead>
                      <TableHead>Sotish narxi</TableHead>
                      <TableHead>Foyda</TableHead>
                      <TableHead>Marja</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costReport?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                        <TableCell className="text-slate-600">{formatPrice(item.ingredientCost)}</TableCell>
                        <TableCell className="text-slate-900">{formatPrice(item.sellingPrice)}</TableCell>
                        <TableCell className={item.profit > 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {formatPrice(item.profit)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.margin >= 50 ? 'bg-emerald-100 text-emerald-700' :
                            item.margin >= 30 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.margin.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Narx tarixi */}
        <TabsContent value="price-history">
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Narx o'zgarishlari tarixi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {priceLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : priceHistory?.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Narx o'zgarishlari mavjud emas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Mahsulot</TableHead>
                      <TableHead>Eski narx</TableHead>
                      <TableHead>Yangi narx</TableHead>
                      <TableHead>O'zgarish</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceHistory?.map((item: any) => {
                      const change = item.new_price - item.old_price;
                      const changePercent = item.old_price > 0 ? (change / item.old_price) * 100 : 0;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-slate-500 whitespace-nowrap">
                            {format(new Date(item.changed_at), 'dd.MM.yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900">
                            {item.ingredients?.name}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {formatPrice(item.old_price)}/{item.ingredients?.unit}
                          </TableCell>
                          <TableCell className="text-slate-900">
                            {formatPrice(item.new_price)}/{item.ingredients?.unit}
                          </TableCell>
                          <TableCell>
                            <span className={change > 0 ? 'text-red-600' : 'text-emerald-600'}>
                              {change > 0 ? '+' : ''}{formatPrice(change)} ({changePercent.toFixed(1)}%)
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryReports;