import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Users, HelpCircle, Award, FileText } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  image_url: string | null;
  experience: string | null;
  sort_order: number;
  is_active: boolean;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

interface AwardItem {
  id: string;
  title: string;
  organization: string | null;
  year: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function AboutContent() {
  const queryClient = useQueryClient();

  // Team Members
  const { data: teamMembers, isLoading: teamLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  // FAQ Items
  const { data: faqItems, isLoading: faqLoading } = useQuery({
    queryKey: ['faq-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as FaqItem[];
    },
  });

  // Awards
  const { data: awards, isLoading: awardsLoading } = useQuery({
    queryKey: ['awards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('awards')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as AwardItem[];
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display">Biz haqimizda kontent</h1>
          <p className="text-muted-foreground mt-1">
            Jamoa, FAQ va Mukofotlarni boshqaring
          </p>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Sayt ma'lumotlari
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Jamoa
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="awards" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Mukofotlar
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AboutSettingsSection />
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <TeamSection members={teamMembers || []} isLoading={teamLoading} />
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <FaqSection items={faqItems || []} isLoading={faqLoading} />
          </TabsContent>

          {/* Awards Tab */}
          <TabsContent value="awards">
            <AwardsSection items={awards || []} isLoading={awardsLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// About Settings Section Component
function AboutSettingsSection() {
  const queryClient = useQueryClient();

  const aboutSettingsKeys = [
    { key: 'about_title', label: 'Biz haqimizda sarlavha', type: 'input' },
    { key: 'about_text_1', label: 'Biz haqimizda matn 1', type: 'textarea' },
    { key: 'about_text_2', label: 'Biz haqimizda matn 2', type: 'textarea' },
    { key: 'about_page_title', label: 'Sahifa sarlavhasi', type: 'input' },
    { key: 'about_page_description', label: 'Sahifa tavsifi', type: 'textarea' },
    { key: 'contact_title', label: "Aloqa bo'limi sarlavhasi", type: 'input' },
    { key: 'contact_description', label: "Aloqa bo'limi tavsifi", type: 'textarea' },
  ];

  const { data: settings, isLoading } = useQuery({
    queryKey: ['about-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', aboutSettingsKeys.map(s => s.key));
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});

  // Initialize form when settings load
  useState(() => {
    if (settings) {
      const initial: Record<string, string> = {};
      settings.forEach(s => {
        initial[s.key] = s.value || '';
      });
      setForm(initial);
    }
  });

  // Update form when settings change
  const currentSettings = settings || [];
  if (currentSettings.length > 0 && Object.keys(form).length === 0) {
    const initial: Record<string, string> = {};
    currentSettings.forEach(s => {
      initial[s.key] = s.value || '';
    });
    if (Object.keys(initial).length > 0) {
      setForm(initial);
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const setting of aboutSettingsKeys) {
        const value = form[setting.key] || '';
        const existing = settings?.find(s => s.key === setting.key);
        
        if (existing) {
          await supabase
            .from('site_settings')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', setting.key);
        } else {
          await supabase
            .from('site_settings')
            .insert({ key: setting.key, value });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['about-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast.success('Saqlandi');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biz haqimizda bo'limi</CardTitle>
        <p className="text-muted-foreground text-sm">Restoran haqida ma'lumot</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {aboutSettingsKeys.map((setting) => (
          <div key={setting.key}>
            <Label className="mb-2 block">{setting.label}</Label>
            {setting.type === 'textarea' ? (
              <Textarea
                value={form[setting.key] || ''}
                onChange={(e) => setForm({ ...form, [setting.key]: e.target.value })}
                rows={3}
              />
            ) : (
              <Input
                value={form[setting.key] || ''}
                onChange={(e) => setForm({ ...form, [setting.key]: e.target.value })}
              />
            )}
          </div>
        ))}

        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending}
          className="w-full"
        >
          {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Saqlash
        </Button>
      </CardContent>
    </Card>
  );
}

// Team Section Component
function TeamSection({ members, isLoading }: { members: TeamMember[]; isLoading: boolean }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: '', position: '', image_url: '', experience: '', sort_order: 0, is_active: true });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from('team_members').update(data).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('team_members').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Saqlandi');
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success("O'chirildi");
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const resetForm = () => {
    setForm({ name: '', position: '', image_url: '', experience: '', sort_order: 0, is_active: true });
    setEditingMember(null);
  };

  const openEdit = (member: TeamMember) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      position: member.position,
      image_url: member.image_url || '',
      experience: member.experience || '',
      sort_order: member.sort_order,
      is_active: member.is_active,
    });
    setIsOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Jamoa a'zolari</CardTitle>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Qo'shish</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMember ? 'Tahrirlash' : "Yangi a'zo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Ism</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Lavozim</Label>
                <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <div>
                <Label>Tajriba</Label>
                <Input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="10 yil tajriba" />
              </div>
              <div>
                <Label>Rasm</Label>
                <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="team" />
              </div>
              <div>
                <Label>Tartib raqami</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
                <Label>Faol</Label>
              </div>
              <Button onClick={() => saveMutation.mutate(editingMember ? { ...form, id: editingMember.id } : form)} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Saqlash
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rasm</TableHead>
              <TableHead>Ism</TableHead>
              <TableHead>Lavozim</TableHead>
              <TableHead>Tajriba</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  {member.image_url && <img src={member.image_url} alt={member.name} className="w-12 h-12 rounded-full object-cover" />}
                </TableCell>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.position}</TableCell>
                <TableCell>{member.experience}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {member.is_active ? 'Faol' : 'Nofaol'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(member)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(member.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// FAQ Section Component
function FaqSection({ items, isLoading }: { items: FaqItem[]; isLoading: boolean }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', sort_order: 0, is_active: true });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from('faq_items').update(data).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('faq_items').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items'] });
      toast.success('Saqlandi');
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faq_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items'] });
      toast.success("O'chirildi");
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const resetForm = () => {
    setForm({ question: '', answer: '', sort_order: 0, is_active: true });
    setEditingItem(null);
  };

  const openEdit = (item: FaqItem) => {
    setEditingItem(item);
    setForm({ question: item.question, answer: item.answer, sort_order: item.sort_order, is_active: item.is_active });
    setIsOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ko'p beriladigan savollar</CardTitle>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Qo'shish</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Tahrirlash' : 'Yangi savol'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Savol</Label>
                <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
              </div>
              <div>
                <Label>Javob</Label>
                <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} />
              </div>
              <div>
                <Label>Tartib raqami</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
                <Label>Faol</Label>
              </div>
              <Button onClick={() => saveMutation.mutate(editingItem ? { ...form, id: editingItem.id } : form)} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Saqlash
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Savol</TableHead>
              <TableHead>Javob</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium max-w-[200px] truncate">{item.question}</TableCell>
                <TableCell className="max-w-[300px] truncate">{item.answer}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {item.is_active ? 'Faol' : 'Nofaol'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Awards Section Component
function AwardsSection({ items, isLoading }: { items: AwardItem[]; isLoading: boolean }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AwardItem | null>(null);
  const [form, setForm] = useState({ title: '', organization: '', year: '', sort_order: 0, is_active: true });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from('awards').update(data).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('awards').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awards'] });
      toast.success('Saqlandi');
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('awards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awards'] });
      toast.success("O'chirildi");
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const resetForm = () => {
    setForm({ title: '', organization: '', year: '', sort_order: 0, is_active: true });
    setEditingItem(null);
  };

  const openEdit = (item: AwardItem) => {
    setEditingItem(item);
    setForm({ title: item.title, organization: item.organization || '', year: item.year || '', sort_order: item.sort_order, is_active: item.is_active });
    setIsOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mukofotlar</CardTitle>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Qo'shish</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Tahrirlash' : 'Yangi mukofot'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nomi</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Tashkilot</Label>
                <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
              </div>
              <div>
                <Label>Yil</Label>
                <Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2023" />
              </div>
              <div>
                <Label>Tartib raqami</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
                <Label>Faol</Label>
              </div>
              <Button onClick={() => saveMutation.mutate(editingItem ? { ...form, id: editingItem.id } : form)} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Saqlash
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomi</TableHead>
              <TableHead>Tashkilot</TableHead>
              <TableHead>Yil</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>{item.organization}</TableCell>
                <TableCell>{item.year}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {item.is_active ? 'Faol' : 'Nofaol'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
