import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Loader2, ClipboardCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryInvalidation } from '@/hooks/useQueryInvalidation';

interface Ingredient {
  id: string;
  name: string;
  current_stock: number;
  unit: string;
}

interface InventoryCount {
  id: string;
  ingredient_id: string;
  expected_quantity: number;
  actual_quantity: number;
  difference: number;
  notes: string | null;
  counted_at: string;
  is_applied: boolean;
  ingredients?: { name: string; unit: string };
}

const InventoryCount = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [countItems, setCountItems] = useState<{ [key: string]: number }>({});
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();
  const { invalidateGroup } = useQueryInvalidation();

  const { data: ingredients, isLoading: ingredientsLoading } = useQuery({
    queryKey: queryKeys.adminIngredients,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, current_stock, unit')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Ingredient[];
    },
  });

  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ['inventory-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_counts')
        .select('*, ingredients(name, unit)')
        .order('counted_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as InventoryCount[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(countItems).filter(([_, val]) => val !== undefined && val !== null);
      
      if (entries.length === 0) {
        throw new Error("Hech qanday mahsulot sanalmadi");
      }

      const inserts = entries.map(([ingredientId, actualQty]) => {
        const ingredient = ingredients?.find(i => i.id === ingredientId);
        return {
          ingredient_id: ingredientId,
          expected_quantity: ingredient?.current_stock || 0,
          actual_quantity: actualQty,
          notes: notes || null,
        };
      });

      const { error } = await supabase.from('inventory_counts').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-counts'] });
      toast.success("Inventarizatsiya saqlandi");
      setIsDialogOpen(false);
      setCountItems({});
      setNotes('');
    },
    onError: (error: any) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (count: InventoryCount) => {
      // Create stock adjustment
      const { error: movementError } = await supabase.from('stock_movements').insert({
        ingredient_id: count.ingredient_id,
        movement_type: 'adjustment',
        quantity: count.actual_quantity,
        notes: `Inventarizatsiya tuzatish: ${count.expected_quantity} -> ${count.actual_quantity}`,
      });
      if (movementError) throw movementError;

      // Mark as applied
      const { error: updateError } = await supabase
        .from('inventory_counts')
        .update({ is_applied: true })
        .eq('id', count.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-counts'] });
      invalidateGroup('stockMovements');
      toast.success("Tuzatish qo'llandi");
    },
    onError: (error: any) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const stats = {
    total: counts?.length || 0,
    applied: counts?.filter(c => c.is_applied).length || 0,
    pending: counts?.filter(c => !c.is_applied && c.difference !== 0).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Jami tekshirishlar</p>
              <p className="text-2xl font-display text-slate-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Qo'llangan</p>
              <p className="text-2xl font-display text-slate-900">{stats.applied}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Kutilmoqda</p>
              <p className="text-2xl font-display text-slate-900">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-slate-900">Inventarizatsiya tarixi</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Yangi tekshirish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Inventarizatsiya</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Har bir mahsulot uchun haqiqiy qoldiq miqdorini kiriting
              </p>
              
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mahsulot</TableHead>
                      <TableHead className="w-32">Tizimda</TableHead>
                      <TableHead className="w-32">Haqiqiy</TableHead>
                      <TableHead className="w-24">Farq</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredients?.map((ing) => {
                      const actual = countItems[ing.id];
                      const diff = actual !== undefined ? actual - ing.current_stock : null;
                      return (
                        <TableRow key={ing.id}>
                          <TableCell className="font-medium text-slate-900">{ing.name}</TableCell>
                          <TableCell className="text-slate-600">{ing.current_stock} {ing.unit}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              className="w-24 bg-slate-50 border-slate-200"
                              value={countItems[ing.id] ?? ''}
                              onChange={(e) => setCountItems(prev => ({
                                ...prev,
                                [ing.id]: e.target.value ? Number(e.target.value) : undefined
                              }))}
                            />
                          </TableCell>
                          <TableCell>
                            {diff !== null && (
                              <span className={diff === 0 ? 'text-slate-500' : diff > 0 ? 'text-emerald-600' : 'text-red-600'}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(2)} {ing.unit}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2">
                <Label>Izoh</Label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Inventarizatsiya haqida izoh..."
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              <Button 
                onClick={() => saveMutation.mutate()} 
                className="w-full bg-gradient-primary"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Saqlash
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* History Table */}
      {countsLoading ? (
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
                    <TableHead>Kutilgan</TableHead>
                    <TableHead>Haqiqiy</TableHead>
                    <TableHead>Farq</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counts?.map((count) => (
                    <TableRow key={count.id} className={count.difference !== 0 && !count.is_applied ? 'bg-orange-50' : ''}>
                      <TableCell className="text-slate-500 whitespace-nowrap">
                        {format(new Date(count.counted_at), 'dd.MM.yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {count.ingredients?.name}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {count.expected_quantity} {count.ingredients?.unit}
                      </TableCell>
                      <TableCell className="text-slate-900">
                        {count.actual_quantity} {count.ingredients?.unit}
                      </TableCell>
                      <TableCell>
                        <span className={count.difference === 0 ? 'text-slate-500' : count.difference > 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {count.difference > 0 ? '+' : ''}{count.difference} {count.ingredients?.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        {count.is_applied ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Qo'llandi
                          </span>
                        ) : count.difference === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                            To'g'ri
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">
                            <AlertTriangle className="h-3 w-3" />
                            Kutilmoqda
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!count.is_applied && count.difference !== 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => applyMutation.mutate(count)}
                            disabled={applyMutation.isPending}
                          >
                            Qo'llash
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {counts?.length === 0 && !countsLoading && (
        <div className="text-center py-12 text-slate-500">
          Inventarizatsiya tarixi mavjud emas
        </div>
      )}
    </div>
  );
};

export default InventoryCount;