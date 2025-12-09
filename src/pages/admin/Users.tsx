import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Search, Loader2, Shield, UserCog, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

type AppRole = 'superadmin' | 'manager' | 'operator';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
}

const roleLabels: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  superadmin: { label: 'Super Admin', icon: Shield, color: 'text-red-400 bg-red-500/20' },
  manager: { label: 'Manager', icon: UserCog, color: 'text-blue-400 bg-blue-500/20' },
  operator: { label: 'Operator', icon: User, color: 'text-green-400 bg-green-500/20' },
};

const Users = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('operator');
  const queryClient = useQueryClient();
  const { userRole } = useAuth();

  const { data: userRoles, isLoading } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch emails from profiles for each user
      const usersWithEmails = await Promise.all(
        data.map(async (ur) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', ur.user_id)
            .single();
          return {
            ...ur,
            email: profile?.full_name || ur.user_id.slice(0, 8) + '...',
          };
        })
      );

      return usersWithEmails as UserRole[];
    },
    enabled: userRole === 'superadmin',
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success("Foydalanuvchi roli qo'shildi");
      setIsDialogOpen(false);
      setNewUserEmail('');
      setNewUserRole('operator');
    },
    onError: (error: any) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success("Foydalanuvchi roli o'chirildi");
    },
    onError: (error: any) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) {
      toast.error("Foydalanuvchi ID kiriting");
      return;
    }
    addRoleMutation.mutate({ userId: newUserEmail.trim(), role: newUserRole });
  };

  const filteredUsers = userRoles?.filter(
    (ur) =>
      ur.email?.toLowerCase().includes(search.toLowerCase()) ||
      ur.user_id.toLowerCase().includes(search.toLowerCase())
  );

  if (userRole !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-display mb-2">Ruxsat yo'q</h2>
        <p className="text-muted-foreground">
          Faqat Super Admin foydalanuvchilarni boshqara oladi
        </p>
      </div>
    );
  }

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Rol qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Foydalanuvchiga rol qo'shish
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddRole} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">Foydalanuvchi ID (UUID)</Label>
                <Input
                  id="userId"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  Foydalanuvchi ro'yxatdan o'tgandan so'ng uning ID sini kiriting
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Rolni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-primary"
                disabled={addRoleMutation.isPending}
              >
                {addRoleMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Qo'shish
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(roleLabels).map(([role, { label, icon: Icon, color }]) => {
          const count = userRoles?.filter((ur) => ur.role === role).length || 0;
          return (
            <Card key={role} className="glass border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-display">{count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg">Foydalanuvchilar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foydalanuvchi</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Qo'shilgan sana</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((ur) => {
                    const roleInfo = roleLabels[ur.role];
                    const RoleIcon = roleInfo.icon;
                    return (
                      <TableRow key={ur.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ur.email}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {ur.user_id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full ${roleInfo.color}`}
                          >
                            <RoleIcon className="h-3.5 w-3.5" />
                            {roleInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(ur.created_at), 'dd.MM.yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
                                deleteRoleMutation.mutate(ur.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Foydalanuvchilar topilmadi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
