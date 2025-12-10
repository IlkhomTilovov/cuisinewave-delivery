import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Loader2, LayoutGrid, LayoutList, Package, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryInvalidation } from '@/hooks/useQueryInvalidation';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { ProductIngredients } from '@/components/admin/ProductIngredients';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

interface ProductIngredient {
  product_id: string;
  ingredient_id: string;
  quantity_needed: number;
  ingredients: { name: string; current_stock: number; unit: string };
}

const Products = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [imageUrl, setImageUrl] = useState('');
  const [ingredientsProductId, setIngredientsProductId] = useState<string | null>(null);
  const { invalidateGroup } = useQueryInvalidation();
  
  // Real-time subscription for products and categories
  useRealtimeSubscription(['products', 'categories', 'ingredients']);

  const { data: products, isLoading } = useQuery({
    queryKey: queryKeys.adminProducts,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: queryKeys.adminCategories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch product ingredients with stock info
  const { data: productIngredients } = useQuery({
    queryKey: ['product-ingredients-with-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_ingredients')
        .select('product_id, ingredient_id, quantity_needed, ingredients(name, current_stock, unit)');
      if (error) throw error;
      return data as ProductIngredient[];
    },
  });

  // Calculate ingredient availability for each product
  const ingredientAvailability = useMemo(() => {
    if (!productIngredients) return {};
    
    const availability: Record<string, { available: boolean; partial: boolean; missing: string[] }> = {};
    
    // Group by product_id
    const byProduct = productIngredients.reduce((acc, pi) => {
      if (!acc[pi.product_id]) acc[pi.product_id] = [];
      acc[pi.product_id].push(pi);
      return acc;
    }, {} as Record<string, ProductIngredient[]>);
    
    Object.entries(byProduct).forEach(([productId, ingredients]) => {
      const missing: string[] = [];
      let hasPartial = false;
      
      ingredients.forEach(ing => {
        if (ing.ingredients.current_stock < ing.quantity_needed) {
          missing.push(ing.ingredients.name);
        } else if (ing.ingredients.current_stock < ing.quantity_needed * 3) {
          hasPartial = true;
        }
      });
      
      availability[productId] = {
        available: missing.length === 0,
        partial: hasPartial && missing.length === 0,
        missing,
      };
    });
    
    return availability;
  }, [productIngredients]);
  const saveMutation = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(product)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(product as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateGroup('products');
      toast.success(editingProduct ? 'Mahsulot yangilandi' : "Mahsulot qo'shildi");
      setIsDialogOpen(false);
      setEditingProduct(null);
      setImageUrl('');
    },
    onError: (error) => {
      toast.error("Xatolik yuz berdi: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup('products');
      toast.success("Mahsulot o'chirildi");
    },
    onError: (error) => {
      toast.error("Xatolik yuz berdi: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const product: any = {
      name: formData.get('name') as string,
      name_uz: formData.get('name_uz') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      discount_price: formData.get('discount_price') ? Number(formData.get('discount_price')) : null,
      image_url: imageUrl || (formData.get('image_url') as string),
      category_id: formData.get('category_id') as string || null,
      is_active: formData.get('is_active') === 'on',
      is_popular: formData.get('is_popular') === 'on',
      sort_order: Number(formData.get('sort_order')) || 0,
      weight: formData.get('weight') as string || null,
      prep_time: formData.get('prep_time') as string || null,
      spice_level: Number(formData.get('spice_level')) || 0,
      calories: formData.get('calories') ? Number(formData.get('calories')) : null,
      meta_title: formData.get('meta_title') as string || null,
      meta_description: formData.get('meta_description') as string || null,
    };

    saveMutation.mutate(product);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setImageUrl(product.image_url || '');
    setIsDialogOpen(true);
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.name_uz?.toLowerCase().includes(search.toLowerCase())
  );

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
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex border border-slate-200 rounded-lg p-1 bg-white">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingProduct(null);
              setImageUrl('');
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Yangi mahsulot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto !bg-white border-slate-200 text-slate-900">
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-slate-900">
                  {editingProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700">Nomi (RU)</Label>
                    <Input id="name" name="name" defaultValue={editingProduct?.name} required className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_uz" className="text-slate-700">Nomi (UZ)</Label>
                    <Input id="name_uz" name="name_uz" defaultValue={editingProduct?.name_uz || ''} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-700">Tavsif</Label>
                  <Textarea id="description" name="description" defaultValue={editingProduct?.description || ''} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-slate-700">Narxi</Label>
                    <Input id="price" name="price" type="number" defaultValue={editingProduct?.price} required className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_price" className="text-slate-700">Chegirma narxi</Label>
                    <Input id="discount_price" name="discount_price" type="number" defaultValue={editingProduct?.discount_price || ''} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sort_order" className="text-slate-700">Tartib</Label>
                    <Input id="sort_order" name="sort_order" type="number" defaultValue={editingProduct?.sort_order || 0} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-slate-700">Og'irlik/Hajm</Label>
                    <Input id="weight" name="weight" placeholder="300g, 500ml" defaultValue={(editingProduct as any)?.weight || ''} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prep_time" className="text-slate-700">Tayyorlash vaqti</Label>
                    <Input id="prep_time" name="prep_time" placeholder="15-20 daq" defaultValue={(editingProduct as any)?.prep_time || ''} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spice_level" className="text-slate-700">Achchiqlik (0-3)</Label>
                    <Input id="spice_level" name="spice_level" type="number" min="0" max="3" defaultValue={(editingProduct as any)?.spice_level || 0} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calories" className="text-slate-700">Kaloriya (kCal)</Label>
                    <Input id="calories" name="calories" type="number" defaultValue={(editingProduct as any)?.calories || ''} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id" className="text-slate-700">Kategoriya</Label>
                  <Select name="category_id" defaultValue={editingProduct?.category_id || ''}>
                    <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                      <SelectValue placeholder="Kategoriyani tanlang" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Rasm</Label>
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="w-full bg-slate-100">
                      <TabsTrigger value="upload" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900">Yuklash</TabsTrigger>
                      <TabsTrigger value="url" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-slate-900">URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-2">
                      <ImageUpload
                        value={imageUrl}
                        onChange={setImageUrl}
                        folder="products"
                        className="admin-upload"
                      />
                    </TabsContent>
                    <TabsContent value="url" className="mt-2">
                      <Input
                        name="image_url"
                        placeholder="https://..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title" className="text-slate-700">Meta Title (SEO)</Label>
                    <Input id="meta_title" name="meta_title" defaultValue={editingProduct?.meta_title || ''} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_description" className="text-slate-700">Meta Description (SEO)</Label>
                    <Input id="meta_description" name="meta_description" defaultValue={editingProduct?.meta_description || ''} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch id="is_active" name="is_active" defaultChecked={editingProduct?.is_active ?? true} />
                    <Label htmlFor="is_active" className="text-slate-700">Faol</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="is_popular" name="is_popular" defaultChecked={editingProduct?.is_popular ?? false} />
                    <Label htmlFor="is_popular" className="text-slate-700">Mashhur</Label>
                  </div>
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

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : viewMode === 'table' ? (
        <Card className="bg-white border-slate-200 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rasm</TableHead>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Kategoriya</TableHead>
                    <TableHead>Narxi</TableHead>
                    <TableHead>Ingredientlar</TableHead>
                    <TableHead>Holati</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{product.name}</p>
                          {product.name_uz && (
                            <p className="text-xs text-slate-500">{product.name_uz}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {(product as any).categories?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {product.discount_price ? (
                          <div>
                            <span className="text-emerald-600 font-medium">{formatPrice(product.discount_price)}</span>
                            <span className="text-xs text-slate-400 line-through ml-2">{formatPrice(product.price)}</span>
                          </div>
                        ) : (
                          <span className="font-medium text-slate-900">{formatPrice(product.price)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5">
                                {ingredientAvailability[product.id] ? (
                                  ingredientAvailability[product.id].available ? (
                                    ingredientAvailability[product.id].partial ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
                                        <AlertTriangle className="h-3 w-3" />
                                        Kam
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Yetarli
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                                      <XCircle className="h-3 w-3" />
                                      Yetmaydi
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-500">
                                    Bog'lanmagan
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white border-slate-200 text-slate-900">
                              {ingredientAvailability[product.id] ? (
                                ingredientAvailability[product.id].available ? (
                                  ingredientAvailability[product.id].partial ? (
                                    <span>Kam qolgan ingredientlar bor</span>
                                  ) : (
                                    <span className="text-emerald-600">Barcha ingredientlar yetarli</span>
                                  )
                                ) : (
                                  <div>
                                    <span className="text-red-600 font-medium">Yetishmayapti:</span>
                                    <ul className="text-xs mt-1">
                                      {ingredientAvailability[product.id].missing.map(name => (
                                        <li key={name}>• {name}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )
                              ) : (
                                <span>Ingredientlar bog'lanmagan - "Ingredientlar" tugmasini bosing</span>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {product.is_active ? (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-600">Faol</span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600">Nofaol</span>
                          )}
                          {product.is_popular && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-600">Mashhur</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Ingredientlar"
                            className="border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            onClick={() => setIngredientsProductId(product.id)}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts?.map((product) => (
            <Card key={product.id} className="bg-white border-slate-200 overflow-hidden">
              <div className="aspect-video relative bg-slate-100">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                )}
                {!product.is_active && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <span className="text-slate-500">Nofaol</span>
                  </div>
                )}
                {product.is_popular && (
                  <span className="absolute top-2 left-2 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-600">
                    Mashhur
                  </span>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-display text-lg truncate">{product.name}</h3>
                <p className="text-sm text-slate-500 truncate">{(product as any).categories?.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {product.discount_price ? (
                      <>
                        <span className="text-emerald-600 font-medium">{formatPrice(product.discount_price)}</span>
                        <span className="text-sm text-slate-400 line-through">{formatPrice(product.price)}</span>
                      </>
                    ) : (
                      <span className="text-emerald-600 font-medium">{formatPrice(product.price)}</span>
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          {ingredientAvailability[product.id] ? (
                            ingredientAvailability[product.id].available ? (
                              ingredientAvailability[product.id].partial ? (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              )
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )
                          ) : null}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white border-slate-200 text-slate-900">
                        {ingredientAvailability[product.id] ? (
                          ingredientAvailability[product.id].available ? (
                            ingredientAvailability[product.id].partial ? (
                              <span>Kam qolgan ingredientlar bor</span>
                            ) : (
                              <span className="text-emerald-600">Barcha ingredientlar yetarli</span>
                            )
                          ) : (
                            <div>
                              <span className="text-red-600 font-medium">Yetishmayapti:</span>
                              <ul className="text-xs mt-1">
                                {ingredientAvailability[product.id].missing.map(name => (
                                  <li key={name}>• {name}</li>
                                ))}
                              </ul>
                            </div>
                          )
                        ) : (
                          <span>Ingredientlar bog'lanmagan</span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIngredientsProductId(product.id)}
                    title="Ingredientlar"
                  >
                    <Package className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openEditDialog(product)}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Tahrirlash
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
                        deleteMutation.mutate(product.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredProducts?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-slate-500">
          Mahsulotlar topilmadi
        </div>
      )}

      {/* Ingredients Dialog */}
      <Dialog open={!!ingredientsProductId} onOpenChange={(open) => !open && setIngredientsProductId(null)}>
        <DialogContent className="max-w-lg bg-white border-slate-200">
          {ingredientsProductId && (
            <ProductIngredients
              productId={ingredientsProductId}
              productName={products?.find(p => p.id === ingredientsProductId)?.name || ''}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
