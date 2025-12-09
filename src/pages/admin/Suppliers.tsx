import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Loader2, Phone, Mail, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

const Suppliers = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (supplier: Partial<Supplier>) => {
      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(supplier)
          .eq('id', editingSupplier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert(supplier as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      toast.success(editingSupplier ? 'Yetkazuvchi yangilandi' : "Yetkazuvchi qo'shildi");
      setIsDialogOpen(false);
      setEditingSupplier(null);
    },
    onError: (error: any) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      toast.success("Yetkazuvchi o'chirildi");
    },
    onError: (error: any) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const supplier: Partial<Supplier> = {
      name: formData.get('name') as string,
      contact_person: formData.get('contact_person') as string || null,
      phone: formData.get('phone') as string || null,
      email: formData.get('email') as string || null,
      address: formData.get('address') as string || null,
      notes: formData.get('notes') as string || null,
      is_active: formData.get('is_active') === 'on',
    };

    saveMutation.mutate(supplier);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(search.toLowerCase())
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
          if (!open) setEditingSupplier(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Yangi yetkazuvchi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg glass">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {editingSupplier ? "Yetkazuvchini tahrirlash" : "Yangi yetkazuvchi qo'shish"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Kompaniya nomi</Label>
                  <Input id="name" name="name" defaultValue={editingSupplier?.name} required className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Aloqa shaxsi</Label>
                  <Input id="contact_person" name="contact_person" defaultValue={editingSupplier?.contact_person || ''} className="bg-muted/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" name="phone" defaultValue={editingSupplier?.phone || ''} className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingSupplier?.email || ''} className="bg-muted/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Manzil</Label>
                <Input id="address" name="address" defaultValue={editingSupplier?.address || ''} className="bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Izohlar</Label>
                <Textarea id="notes" name="notes" defaultValue={editingSupplier?.notes || ''} className="bg-muted/50" />
              </div>

              <div className="flex items-center gap-2">
                <Switch id="is_active" name="is_active" defaultChecked={editingSupplier?.is_active ?? true} />
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

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="glass border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kompaniya</TableHead>
                    <TableHead>Aloqa shaxsi</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Manzil</TableHead>
                    <TableHead>Holati</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers?.map((sup) => (
                    <TableRow key={sup.id}>
                      <TableCell className="font-medium">{sup.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {sup.contact_person || '-'}
                      </TableCell>
                      <TableCell>
                        {sup.phone ? (
                          <a href={`tel:${sup.phone}`} className="flex items-center gap-1 text-secondary hover:underline">
                            <Phone className="h-3.5 w-3.5" />
                            {sup.phone}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {sup.email ? (
                          <a href={`mailto:${sup.email}`} className="flex items-center gap-1 text-secondary hover:underline">
                            <Mail className="h-3.5 w-3.5" />
                            {sup.email}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {sup.address || '-'}
                      </TableCell>
                      <TableCell>
                        {sup.is_active ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">Faol</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">Nofaol</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(sup)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
                                deleteMutation.mutate(sup.id);
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
      )}

      {filteredSuppliers?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          Yetkazuvchilar topilmadi
        </div>
      )}
    </div>
  );
};

export default Suppliers;
