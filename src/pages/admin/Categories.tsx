import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Loader2, LayoutGrid, LayoutList } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryInvalidation } from '@/hooks/useQueryInvalidation';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

type Category = Tables<'categories'>;

const Categories = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [imageUrl, setImageUrl] = useState('');
  const { invalidateGroup } = useQueryInvalidation();

  // Real-time subscription for categories
  useRealtimeSubscription(['categories']);

  const { data: categories, isLoading } = useQuery({
    queryKey: queryKeys.adminCategories,
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
      invalidateGroup('categories');
      toast.success(editingCategory ? 'Kategoriya yangilandi' : "Kategoriya qo'shildi");
      setIsDialogOpen(false);
      setEditingCategory(null);
      setImageUrl('');
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
      invalidateGroup('categories');
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
      image_url: imageUrl || (formData.get('image_url') as string) || null,
      is_active: formData.get('is_active') === 'on',
      sort_order: Number(formData.get('sort_order')) || 0,
      meta_title: formData.get('meta_title') as string || null,
      meta_description: formData.get('meta_description') as string || null,
    };

    saveMutation.mutate(category);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setImageUrl(category.image_url || '');
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
              setEditingCategory(null);
              setImageUrl('');
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Yangi kategoriya
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto !bg-white border-slate-200">
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-slate-900">
                  {editingCategory ? "Kategoriyani tahrirlash" : "Yangi kategoriya qo'shish"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700">Nomi (RU)</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      defaultValue={editingCategory?.name} 
                      required 
                      className="bg-white border-slate-300 text-slate-900"
                      onChange={(e) => {
                        if (!editingCategory) {
                          const slugInput = document.getElementById('slug') as HTMLInputElement;
                          if (slugInput) slugInput.value = generateSlug(e.target.value);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_uz" className="text-slate-700">Nomi (UZ)</Label>
                    <Input id="name_uz" name="name_uz" defaultValue={editingCategory?.name_uz || ''} className="bg-white border-slate-300 text-slate-900" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-slate-700">Slug</Label>
                    <Input id="slug" name="slug" defaultValue={editingCategory?.slug} required className="bg-white border-slate-300 text-slate-900" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sort_order" className="text-slate-700">Tartib</Label>
                    <Input id="sort_order" name="sort_order" type="number" defaultValue={editingCategory?.sort_order || 0} className="bg-white border-slate-300 text-slate-900" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Rasm</Label>
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="w-full bg-slate-100">
                      <TabsTrigger value="upload" className="flex-1 data-[state=active]:bg-white">Yuklash</TabsTrigger>
                      <TabsTrigger value="url" className="flex-1 data-[state=active]:bg-white">URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-2">
                      <ImageUpload
                        value={imageUrl}
                        onChange={setImageUrl}
                        folder="categories"
                      />
                    </TabsContent>
                    <TabsContent value="url" className="mt-2">
                      <Input
                        name="image_url"
                        placeholder="https://..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="bg-white border-slate-300 text-slate-900"
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title" className="text-slate-700">Meta sarlavha</Label>
                    <Input id="meta_title" name="meta_title" defaultValue={editingCategory?.meta_title || ''} className="bg-white border-slate-300 text-slate-900" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_description" className="text-slate-700">Meta tavsif</Label>
                    <Input id="meta_description" name="meta_description" defaultValue={editingCategory?.meta_description || ''} className="bg-white border-slate-300 text-slate-900" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch id="is_active" name="is_active" defaultChecked={editingCategory?.is_active ?? true} />
                  <Label htmlFor="is_active" className="text-slate-700">Faol</Label>
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
                    <TableHead>Slug</TableHead>
                    <TableHead>Tartib</TableHead>
                    <TableHead>Holati</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                          {category.image_url ? (
                            <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">📁</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{category.name}</p>
                          {category.name_uz && (
                            <p className="text-xs text-slate-500">{category.name_uz}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 font-mono text-sm">
                        /{category.slug}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {category.sort_order}
                      </TableCell>
                      <TableCell>
                        {category.is_active ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-600">Faol</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600">Nofaol</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
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
          {filteredCategories?.map((category) => (
            <Card key={category.id} className="bg-white border-slate-200 overflow-hidden">
              <div className="aspect-video relative bg-slate-100">
                {category.image_url ? (
                  <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📁</div>
                )}
                {!category.is_active && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <span className="text-slate-500">Nofaol</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-display text-lg">{category.name}</h3>
                {category.name_uz && (
                  <p className="text-sm text-slate-500">{category.name_uz}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">/{category.slug}</p>
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
        <div className="text-center py-12 text-slate-500">
          Kategoriyalar topilmadi
        </div>
      )}
    </div>
  );
};

export default Categories;
