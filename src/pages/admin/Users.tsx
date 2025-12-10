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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Search, Loader2, Shield, UserCog, User, Download, 
  Users as UsersIcon, Ban, CheckCircle, Info, Bike, Calendar, Clock,
  Mail, Filter, HelpCircle
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
  is_blocked?: boolean;
  last_sign_in?: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

const roleLabels: Record<AppRole, { label: string; icon: typeof Shield; color: string; description: string }> = {
  superadmin: { 
    label: 'Super Admin', 
    icon: Shield, 
    color: 'text-red-400 bg-red-500/20',
    description: "Barcha huquqlarga ega: foydalanuvchilarni boshqarish, sozlamalar, mahsulotlar, buyurtmalar"
  },
  manager: { 
    label: 'Manager', 
    icon: UserCog, 
    color: 'text-blue-400 bg-blue-500/20',
    description: "Mahsulotlar, kategoriyalar, buyurtmalar, ombor va kuryerlarni boshqarish"
  },
  operator: { 
    label: 'Operator', 
    icon: User, 
    color: 'text-green-400 bg-green-500/20',
    description: "Buyurtmalarni qabul qilish va statusini o'zgartirish, omborni ko'rish"
  },
  courier: { 
    label: 'Kuryer', 
    icon: Bike, 
    color: 'text-purple-400 bg-purple-500/20',
    description: "O'ziga tayinlangan buyurtmalarni ko'rish va yetkazib berish"
  },
};

const Users = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('operator');
  const [inviteEmail, setInviteEmail] = useState('');
  const [searchMode, setSearchMode] = useState<'uuid' | 'select'>('select');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState<Profile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
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

  // Fetch all profiles for user selection
  const { data: allProfiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
    enabled: userRole === 'superadmin',
  });

  // Search user by UUID or email
  const searchUserById = async (userId: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      setFoundUser(data);
      if (!data) {
        toast.error("Foydalanuvchi topilmadi");
      }
    } catch (error: any) {
      toast.error("Qidirish xatosi: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Filter profiles that don't have the selected role yet
  const availableProfiles = useMemo(() => {
    if (!allProfiles || !userRoles) return [];
    const existingUserIds = userRoles.map(ur => ur.user_id);
    return allProfiles.filter(p => !existingUserIds.includes(p.user_id));
  }, [allProfiles, userRoles]);

  // Filtered profiles based on search
  const filteredProfiles = useMemo(() => {
    if (!userSearchQuery) return availableProfiles.slice(0, 10);
    return availableProfiles.filter(p => 
      p.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      p.phone?.includes(userSearchQuery) ||
      p.user_id.includes(userSearchQuery)
    ).slice(0, 10);
  }, [availableProfiles, userSearchQuery]);

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Check if user already has a role
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success("Foydalanuvchi roli qo'shildi");
      setIsDialogOpen(false);
      setSelectedUserId('');
      setNewUserRole('operator');
      setFoundUser(null);
      setUserSearchQuery('');
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
    if (!selectedUserId.trim()) {
      toast.error("Foydalanuvchi tanlang");
      return;
    }
    addRoleMutation.mutate({ userId: selectedUserId.trim(), role: newUserRole });
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ism, telefon yoki ID bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40 bg-muted/50">
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
                Rol qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="glass max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Foydalanuvchiga rol qo'shish
                </DialogTitle>
                <DialogDescription>
                  Ro'yxatdan o'tgan foydalanuvchini tanlang va unga rol bering
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as 'uuid' | 'select')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="select">Ro'yxatdan tanlash</TabsTrigger>
                  <TabsTrigger value="uuid">UUID kiritish</TabsTrigger>
                </TabsList>

                <TabsContent value="select" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Foydalanuvchini qidirish</Label>
                    <Input
                      placeholder="Ism yoki telefon..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="bg-muted/50"
                    />
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredProfiles.length > 0 ? (
                      filteredProfiles.map(profile => (
                        <div
                          key={profile.id}
                          onClick={() => {
                            setSelectedUserId(profile.user_id);
                            setFoundUser(profile);
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedUserId === profile.user_id 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{profile.full_name || 'Noma\'lum'}</p>
                              <p className="text-sm text-muted-foreground">{profile.phone || '-'}</p>
                            </div>
                            {selectedUserId === profile.user_id && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        {userSearchQuery ? "Topilmadi" : "Yangi foydalanuvchilar yo'q"}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="uuid" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="userId">Foydalanuvchi ID (UUID)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="userId"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="bg-muted/50"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => searchUserById(selectedUserId)}
                        disabled={isSearching || !selectedUserId}
                      >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {foundUser && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-sm text-green-400 mb-1">Foydalanuvchi topildi:</p>
                      <p className="font-medium">{foundUser.full_name || 'Noma\'lum'}</p>
                      <p className="text-sm text-muted-foreground">{foundUser.phone || '-'}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <form onSubmit={handleAddRole} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Rolni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([role, { label, icon: Icon, color, description }]) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${color.split(' ')[0]}`} />
                            <span>{label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {roleLabels[newUserRole]?.description}
                  </p>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary"
                  disabled={addRoleMutation.isPending || !selectedUserId}
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
      </div>

      {/* Role Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(roleLabels).map(([role, { label, icon: Icon, color, description }]) => {
          const count = roleStats[role] || 0;
          return (
            <Tooltip key={role}>
              <TooltipTrigger asChild>
                <Card className="glass border-border/50 cursor-help">
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
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Total Users */}
      <Card className="glass border-border/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary/20">
              <UsersIcon className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jami foydalanuvchilar</p>
              <p className="text-3xl font-display">{userRoles?.length || 0}</p>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
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
      <Card className="glass border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg">Foydalanuvchilar ro'yxati</CardTitle>
          <Badge variant="outline">{filteredUsers.length} ta</Badge>
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
                    <TableHead>Telefon</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Qo'shilgan sana</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((ur) => {
                    const roleInfo = roleLabels[ur.role] || roleLabels.operator;
                    const RoleIcon = roleInfo.icon;
                    return (
                      <TableRow key={ur.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ur.full_name || 'Noma\'lum'}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {ur.user_id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ur.phone || '-'}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full ${roleInfo.color}`}
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
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(ur.created_at), 'dd.MM.yyyy')}
                          </div>
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
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            Rollar haqida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(roleLabels).map(([role, { label, icon: Icon, color, description }]) => (
              <div key={role} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
