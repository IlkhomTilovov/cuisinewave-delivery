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
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Banner = Tables<'banners'>;

const Banners = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const queryClient = useQueryClient();

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (banner: Partial<Banner>) => {
      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(banner)
          .eq('id', editingBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banners')
          .insert(banner as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success(editingBanner ? 'Banner yangilandi' : "Banner qo'shildi");
      setIsDialogOpen(false);
      setEditingBanner(null);
    },
    onError: (error) => {
      toast.error("Xatolik yuz berdi: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success("Banner o'chirildi");
    },
    onError: (error) => {
      toast.error("Xatolik yuz berdi: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const banner: Partial<Banner> = {
      title: formData.get('title') as string || null,
      subtitle: formData.get('subtitle') as string || null,
      image_url: formData.get('image_url') as string || null,
      link: formData.get('link') as string || null,
      is_active: formData.get('is_active') === 'on',
      sort_order: Number(formData.get('sort_order')) || 0,
    };

    saveMutation.mutate(banner);
  };

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingBanner(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Yangi banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg glass">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {editingBanner ? "Bannerni tahrirlash" : "Yangi banner qo'shish"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Sarlavha</Label>
                <Input id="title" name="title" defaultValue={editingBanner?.title || ''} className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Qo'shimcha matn</Label>
                <Input id="subtitle" name="subtitle" defaultValue={editingBanner?.subtitle || ''} className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Rasm URL</Label>
                <Input id="image_url" name="image_url" defaultValue={editingBanner?.image_url || ''} className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Havola</Label>
                <Input id="link" name="link" defaultValue={editingBanner?.link || ''} className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Tartib</Label>
                <Input id="sort_order" name="sort_order" type="number" defaultValue={editingBanner?.sort_order || 0} className="bg-muted/50" />
              </div>

              <div className="flex items-center gap-2">
                <Switch id="is_active" name="is_active" defaultChecked={editingBanner?.is_active ?? true} />
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

      {/* Banners Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners?.map((banner) => (
            <Card key={banner.id} className="glass border-border/50 overflow-hidden">
              <div className="aspect-[21/9] relative bg-muted">
                {banner.image_url ? (
                  <img src={banner.image_url} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🖼️</div>
                )}
                {!banner.is_active && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <span className="text-muted-foreground">Nofaol</span>
                  </div>
                )}
                {banner.title && (
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex flex-col justify-end p-4">
                    <h3 className="font-display text-xl text-foreground">{banner.title}</h3>
                    {banner.subtitle && (
                      <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                    )}
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {banner.link && (
                      <a href={banner.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-secondary">
                        <ExternalLink className="h-4 w-4" /> Havola
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(banner)}
                    >
                      <Pencil className="h-4 w-4 mr-1" /> Tahrirlash
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
                          deleteMutation.mutate(banner.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {banners?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          Bannerlar topilmadi
        </div>
      )}
    </div>
  );
};

export default Banners;
