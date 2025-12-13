import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Search, Loader2, Shield, UserCog, User, Download, 
  Users as UsersIcon, Info, Bike, Calendar, Eye, EyeOff,
  Filter, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

type AppRole = 'superadmin' | 'manager' | 'operator' | 'courier';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
  full_name?: string;
  phone?: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

const roleLabels: Record<AppRole, { label: string; icon: typeof Shield; color: string; badgeColor: string; description: string }> = {
  superadmin: { 
    label: 'Super Admin', 
    icon: Shield, 
    color: 'text-red-600 bg-red-100',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
    description: "Barcha huquqlarga ega: foydalanuvchilarni boshqarish, sozlamalar, mahsulotlar, buyurtmalar"
  },
  manager: { 
    label: 'Manager', 
    icon: UserCog, 
    color: 'text-blue-600 bg-blue-100',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    description: "Mahsulotlar, kategoriyalar, buyurtmalar, ombor va kuryerlarni boshqarish"
  },
  operator: { 
    label: 'Operator', 
    icon: User, 
    color: 'text-green-600 bg-green-100',
    badgeColor: 'bg-green-100 text-green-700 border-green-200',
    description: "Buyurtmalarni qabul qilish va statusini o'zgartirish, omborni ko'rish"
  },
  courier: { 
    label: 'Kuryer', 
    icon: Bike, 
    color: 'text-purple-600 bg-purple-100',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    description: "O'ziga tayinlangan buyurtmalarni ko'rish va yetkazib berish"
  },
};

const Users = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUserRole, setNewUserRole] = useState<AppRole>('operator');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const { userRole } = useAuth();

  // Fetch user roles with profiles
  const { data: userRoles, isLoading } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch profiles for each user
      const usersWithProfiles = await Promise.all(
        data.map(async (ur) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', ur.user_id)
            .maybeSingle();
          
          return {
            ...ur,
            full_name: profile?.full_name || null,
            phone: profile?.phone || null,
            email: profile?.full_name || ur.user_id.slice(0, 8) + '...',
          };
        })
      );

      return usersWithProfiles as UserRole[];
    },
    enabled: userRole === 'superadmin',
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

  // Create new user with role via edge function
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      toast.error("Email va parol kiritilishi shart");
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setIsCreating(true);
    
    try {
      const response = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: newUserEmail.trim(),
          password: newUserPassword,
          fullName: newUserFullName.trim() || null,
          role: newUserRole
        }
      });

      const { data, error } = response;

      // Handle edge function errors (including non-2xx responses)
      if (error || data?.error) {
        const errorMessage = error?.message || data?.error || 'Xatolik yuz berdi';
        
        if (errorMessage.includes('already registered') || 
            errorMessage.includes('already been registered') ||
            errorMessage.includes('email_exists')) {
          toast.error("Bu email allaqachon ro'yxatdan o'tgan");
        } else if (errorMessage.includes('non-2xx')) {
          // Edge function returned error status - check data for actual error
          if (data?.error) {
            if (data.error.includes('already registered') || data.error.includes('already been registered')) {
              toast.error("Bu email allaqachon ro'yxatdan o'tgan");
            } else {
              toast.error("Xatolik: " + data.error);
            }
          } else {
            toast.error("Bu email allaqachon ro'yxatdan o'tgan yoki boshqa xatolik yuz berdi");
          }
        } else {
          toast.error("Xatolik: " + errorMessage);
        }
        return;
      }
      
      if (!data?.success) {
        toast.error("Xatolik: " + (data?.error || "Noma'lum xatolik"));
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success("Foydalanuvchi muvaffaqiyatli yaratildi");
      
      // Reset form
      setIsDialogOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserRole('operator');
      
    } catch (error: unknown) {
      console.error("Create user error:", error);
      const errorMessage = error instanceof Error ? error.message : "Xatolik yuz berdi";
      if (errorMessage.includes('already registered') || errorMessage.includes('already been registered')) {
        toast.error("Bu email allaqachon ro'yxatdan o'tgan");
      } else {
        toast.error("Xatolik: " + errorMessage);
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Export users to CSV
  const handleExport = () => {
    if (!userRoles?.length) {
      toast.error("Eksport qilish uchun ma'lumot yo'q");
      return;
    }

    const headers = ['Ism', 'Telefon', 'Rol', 'User ID', "Qo'shilgan sana"];
    const rows = userRoles.map(ur => [
      ur.full_name || '-',
      ur.phone || '-',
      roleLabels[ur.role]?.label || ur.role,
      ur.user_id,
      format(new Date(ur.created_at), 'dd.MM.yyyy HH:mm')
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `foydalanuvchilar_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Eksport qilindi');
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!userRoles) return [];
    return userRoles.filter(ur => {
      const matchesSearch = 
        ur.email?.toLowerCase().includes(search.toLowerCase()) ||
        ur.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        ur.phone?.includes(search) ||
        ur.user_id.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || ur.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [userRoles, search, roleFilter]);

  // Role statistics
  const roleStats = useMemo(() => {
    if (!userRoles) return {};
    return Object.keys(roleLabels).reduce((acc, role) => {
      acc[role] = userRoles.filter(ur => ur.role === role).length;
      return acc;
    }, {} as Record<string, number>);
  }, [userRoles]);

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
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Ism, telefon yoki ID bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-slate-300 text-slate-900"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40 bg-white border-slate-300 text-slate-900">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              {Object.entries(roleLabels).map(([role, { label }]) => (
                <SelectItem key={role} value={role}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Eksport
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Foydalanuvchi qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="!bg-white border-slate-200 max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-slate-900">
                  Yangi foydalanuvchi
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Email va parol orqali yangi foydalanuvchi yarating
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-700">Ism (ixtiyoriy)</Label>
                  <Input
                    id="fullName"
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                    placeholder="Foydalanuvchi ismi"
                    className="bg-white border-slate-300 text-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="foydalanuvchi@example.com"
                    className="bg-white border-slate-300 text-slate-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">Parol *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Kamida 6 ta belgi"
                      className="bg-white border-slate-300 text-slate-900 pr-10"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-700">Rol *</Label>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                    <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                      <SelectValue placeholder="Rolni tanlang" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {Object.entries(roleLabels).map(([role, { label, icon: Icon, color }]) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${color.split(' ')[0]}`} />
                            <span className="text-slate-900">{label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {roleLabels[newUserRole]?.description}
                  </p>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary"
                  disabled={isCreating}
                >
                  {isCreating && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Yaratish
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Role Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(roleLabels).map(([role, { label, icon: Icon, color, description }]) => {
          const count = roleStats[role] || 0;
          return (
            <Tooltip key={role}>
              <TooltipTrigger asChild>
                <Card className="bg-white border-slate-200 cursor-help shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className="text-2xl font-display text-slate-900">{count}</p>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Total Users */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-100">
              <UsersIcon className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Jami foydalanuvchilar</p>
              <p className="text-3xl font-display text-slate-900">{userRoles?.length || 0}</p>
            </div>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Bugun: {userRoles?.filter(ur => {
                const today = new Date();
                const created = new Date(ur.created_at);
                return created.toDateString() === today.toDateString();
              }).length || 0}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg text-slate-900">Foydalanuvchilar ro'yxati</CardTitle>
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">{filteredUsers.length} ta</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50">
                    <TableHead className="text-slate-700">Foydalanuvchi</TableHead>
                    <TableHead className="text-slate-700">Telefon</TableHead>
                    <TableHead className="text-slate-700">Rol</TableHead>
                    <TableHead className="text-slate-700">Qo'shilgan sana</TableHead>
                    <TableHead className="text-right text-slate-700">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((ur) => {
                    const roleInfo = roleLabels[ur.role] || roleLabels.operator;
                    const RoleIcon = roleInfo.icon;
                    return (
                      <TableRow key={ur.id} className="border-slate-200 hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{ur.full_name || 'Noma\'lum'}</p>
                            <p className="text-xs text-slate-400 font-mono">
                              {ur.user_id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {ur.phone || '-'}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border ${roleInfo.badgeColor}`}
                              >
                                <RoleIcon className="h-3.5 w-3.5" />
                                {roleInfo.label}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{roleInfo.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-slate-500 text-sm">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(ur.created_at), 'dd.MM.yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
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
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
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

      {/* Role Descriptions Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg text-slate-900 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-slate-500" />
            Rollar haqida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(roleLabels).map(([role, { label, icon: Icon, color, description }]) => (
              <div key={role} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-slate-900">{label}</span>
                </div>
                <p className="text-sm text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
