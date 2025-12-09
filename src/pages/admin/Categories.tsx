import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;

const Categories = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (category: Partial<Category>) => {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(category)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(category as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      toast.success(editingCategory ? 'Kategoriya yangilandi' : "Kategoriya qo'shildi");
      setIsDialogOpen(false);
      setEditingCategory(null);
    },
    onError: (error) => {
      toast.error("Xatolik yuz berdi: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      toast.success("Kategoriya o'chirildi");
    },
    onError: (error) => {
      toast.error("Xatolik yuz berdi: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const category: Partial<Category> = {
      name: formData.get('name') as string,
      name_uz: formData.get('name_uz') as string,
      slug: formData.get('slug') as string,
      image_url: formData.get('image_url') as string || null,
      is_active: formData.get('is_active') === 'on',
      sort_order: Number(formData.get('sort_order')) || 0,
      meta_title: formData.get('meta_title') as string || null,
      meta_description: formData.get('meta_description') as string || null,
    };

    saveMutation.mutate(category);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const filteredCategories = categories?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.name_uz?.toLowerCase().includes(search.toLowerCase())
  );

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
          if (!open) setEditingCategory(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Yangi kategoriya
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg glass">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {editingCategory ? "Kategoriyani tahrirlash" : "Yangi kategoriya qo'shish"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nomi (RU)</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={editingCategory?.name} 
                    required 
                    className="bg-muted/50"
                    onChange={(e) => {
                      if (!editingCategory) {
                        const slugInput = document.getElementById('slug') as HTMLInputElement;
                        if (slugInput) slugInput.value = generateSlug(e.target.value);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_uz">Nomi (UZ)</Label>
                  <Input id="name_uz" name="name_uz" defaultValue={editingCategory?.name_uz || ''} className="bg-muted/50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" defaultValue={editingCategory?.slug} required className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Tartib</Label>
                  <Input id="sort_order" name="sort_order" type="number" defaultValue={editingCategory?.sort_order || 0} className="bg-muted/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Rasm URL</Label>
                <Input id="image_url" name="image_url" defaultValue={editingCategory?.image_url || ''} className="bg-muted/50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta sarlavha</Label>
                  <Input id="meta_title" name="meta_title" defaultValue={editingCategory?.meta_title || ''} className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta tavsif</Label>
                  <Input id="meta_description" name="meta_description" defaultValue={editingCategory?.meta_description || ''} className="bg-muted/50" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch id="is_active" name="is_active" defaultChecked={editingCategory?.is_active ?? true} />
                <Label htmlFor="is_active">Faol</Label>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Saqlash
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories?.map((category) => (
            <Card key={category.id} className="glass border-border/50 overflow-hidden">
              <div className="aspect-video relative bg-muted">
                {category.image_url ? (
                  <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📁</div>
                )}
                {!category.is_active && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <span className="text-muted-foreground">Nofaol</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-display text-lg">{category.name}</h3>
                {category.name_uz && (
                  <p className="text-sm text-muted-foreground">{category.name_uz}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">/{category.slug}</p>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openEditDialog(category)}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Tahrirlash
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
                        deleteMutation.mutate(category.id);
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

      {filteredCategories?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          Kategoriyalar topilmadi
        </div>
      )}
    </div>
  );
};

export default Categories;
