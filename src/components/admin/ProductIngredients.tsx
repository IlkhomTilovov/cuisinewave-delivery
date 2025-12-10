import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Package } from 'lucide-react';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryInvalidation } from '@/hooks/useQueryInvalidation';

interface ProductIngredientsProps {
  productId: string;
  productName: string;
}

interface ProductIngredient {
  id: string;
  ingredient_id: string;
  product_id: string;
  quantity_needed: number;
  ingredients?: {
    name: string;
    unit: string;
  };
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

export function ProductIngredients({ productId, productName }: ProductIngredientsProps) {
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [quantity, setQuantity] = useState('');
  const { invalidateGroup } = useQueryInvalidation();

  // Fetch product ingredients
  const { data: productIngredients, isLoading } = useQuery({
    queryKey: ['product-ingredients', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_ingredients')
        .select('*, ingredients(name, unit)')
        .eq('product_id', productId);
      if (error) throw error;
      return data as ProductIngredient[];
    },
  });

  // Fetch all ingredients
  const { data: allIngredients } = useQuery({
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

  // Add ingredient mutation
  const addMutation = useMutation({
    mutationFn: async ({ ingredientId, qty }: { ingredientId: string; qty: number }) => {
      const { error } = await supabase
        .from('product_ingredients')
        .insert({
          product_id: productId,
          ingredient_id: ingredientId,
          quantity_needed: qty,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup('products');
      toast.success("Ingredient qo'shildi");
      setSelectedIngredient('');
      setQuantity('');
    },
    onError: (error: any) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  // Update quantity mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      const { error } = await supabase
        .from('product_ingredients')
        .update({ quantity_needed: qty })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup('products');
      toast.success("Miqdor yangilandi");
    },
    onError: (error: any) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  // Delete ingredient mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_ingredients')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup('products');
      toast.success("Ingredient o'chirildi");
    },
    onError: (error: any) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const handleAdd = () => {
    if (!selectedIngredient || !quantity || Number(quantity) <= 0) {
      toast.error("Ingredient va miqdorni kiriting");
      return;
    }
    addMutation.mutate({ ingredientId: selectedIngredient, qty: Number(quantity) });
  };

  // Filter out already added ingredients
  const availableIngredients = allIngredients?.filter(
    ing => !productIngredients?.some(pi => pi.ingredient_id === ing.id)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {productName} - Ingredientlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new ingredient */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Ingredient</Label>
            <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Tanlang..." />
              </SelectTrigger>
              <SelectContent>
                {availableIngredients?.map(ing => (
                  <SelectItem key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-24 space-y-1">
            <Label className="text-xs">Miqdor</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="bg-muted/50"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={addMutation.isPending}
            className="bg-gradient-primary"
          >
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Ingredients list */}
        {productIngredients && productIngredients.length > 0 ? (
          <div className="space-y-2">
            {productIngredients.map((pi) => (
              <div
                key={pi.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex-1">
                  <span className="font-medium text-sm">{pi.ingredients?.name}</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={pi.quantity_needed}
                  className="w-20 h-8 text-sm bg-muted/50"
                  onBlur={(e) => {
                    const newQty = Number(e.target.value);
                    if (newQty !== pi.quantity_needed && newQty > 0) {
                      updateMutation.mutate({ id: pi.id, qty: newQty });
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground w-10">
                  {pi.ingredients?.unit}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => deleteMutation.mutate(pi.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Hali ingredientlar qo'shilmagan
          </p>
        )}
      </CardContent>
    </Card>
  );
}
