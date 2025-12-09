import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type Category = Tables<'categories'>;

const Products = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
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
    queryKey: ['admin-categories'],
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
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(editingProduct ? 'Mahsulot yangilandi' : "Mahsulot qo'shildi");
      setIsDialogOpen(false);
      setEditingProduct(null);
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
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success("Mahsulot o'chirildi");
    },
    onError: (error) => {
      toast.error("Xatolik yuz berdi: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const product: Partial<Product> = {
      name: formData.get('name') as string,
      name_uz: formData.get('name_uz') as string,
      description: formData.get('description') as string,
      description_uz: formData.get('description_uz') as string,
      price: Number(formData.get('price')),
      discount_price: formData.get('discount_price') ? Number(formData.get('discount_price')) : null,
      image_url: formData.get('image_url') as string,
      category_id: formData.get('category_id') as string || null,
      ingredients: formData.get('ingredients') as string,
      is_active: formData.get('is_active') === 'on',
      is_popular: formData.get('is_popular') === 'on',
      sort_order: Number(formData.get('sort_order')) || 0,
    };

    saveMutation.mutate(product);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingProduct(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Yangi mahsulot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {editingProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nomi (RU)</Label>
                  <Input id="name" name="name" defaultValue={editingProduct?.name} required className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_uz">Nomi (UZ)</Label>
                  <Input id="name_uz" name="name_uz" defaultValue={editingProduct?.name_uz || ''} className="bg-muted/50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Tavsif (RU)</Label>
                  <Textarea id="description" name="description" defaultValue={editingProduct?.description || ''} className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_uz">Tavsif (UZ)</Label>
                  <Textarea id="description_uz" name="description_uz" defaultValue={editingProduct?.description_uz || ''} className="bg-muted/50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Narxi</Label>
                  <Input id="price" name="price" type="number" defaultValue={editingProduct?.price} required className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_price">Chegirma narxi</Label>
                  <Input id="discount_price" name="discount_price" type="number" defaultValue={editingProduct?.discount_price || ''} className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Tartib</Label>
                  <Input id="sort_order" name="sort_order" type="number" defaultValue={editingProduct?.sort_order || 0} className="bg-muted/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Kategoriya</Label>
                <Select name="category_id" defaultValue={editingProduct?.category_id || ''}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Kategoriyani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Rasm URL</Label>
                <Input id="image_url" name="image_url" defaultValue={editingProduct?.image_url || ''} className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingredients">Tarkibi</Label>
                <Textarea id="ingredients" name="ingredients" defaultValue={editingProduct?.ingredients || ''} className="bg-muted/50" />
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch id="is_active" name="is_active" defaultChecked={editingProduct?.is_active ?? true} />
                  <Label htmlFor="is_active">Faol</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="is_popular" name="is_popular" defaultChecked={editingProduct?.is_popular ?? false} />
                  <Label htmlFor="is_popular">Mashhur</Label>
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

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts?.map((product) => (
            <Card key={product.id} className="glass border-border/50 overflow-hidden">
              <div className="aspect-video relative bg-muted">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                )}
                {!product.is_active && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <span className="text-muted-foreground">Nofaol</span>
                  </div>
                )}
                {product.is_popular && (
                  <span className="absolute top-2 left-2 px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                    Mashhur
                  </span>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-display text-lg truncate">{product.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{(product as any).categories?.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  {product.discount_price ? (
                    <>
                      <span className="text-secondary font-medium">{formatPrice(product.discount_price)}</span>
                      <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>
                    </>
                  ) : (
                    <span className="text-secondary font-medium">{formatPrice(product.price)}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
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
        <div className="text-center py-12 text-muted-foreground">
          Mahsulotlar topilmadi
        </div>
      )}
    </div>
  );
};

export default Products;
