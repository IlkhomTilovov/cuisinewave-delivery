import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Save, Home, UtensilsCrossed, Info, Truck, Gift, Phone, Share2, Plus, Pencil, Trash2, Users, HelpCircle, Award, LayoutGrid, ImageIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
}

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

// Logo va branding sozlamalari
const brandingSettings = [
  { key: 'site_logo', title: 'Sayt logosi', type: 'image' },
  { key: 'site_favicon', title: 'Favicon (32x32)', type: 'image' },
  { key: 'site_name', title: 'Sayt nomi', type: 'input' },
  { key: 'site_tagline', title: 'Tagline', type: 'input' },
];

// Bosh sahifa kontenti
const homePageSettings = {
  hero: [
    { key: 'hero_background_image', title: 'Hero fon rasmi', type: 'image' },
    { key: 'hero_title', title: 'Sarlavha', type: 'input' },
    { key: 'hero_subtitle', title: 'Ikkinchi sarlavha', type: 'input' },
    { key: 'hero_description', title: 'Tavsif matni', type: 'textarea' },
  ],
  about: [
    { key: 'about_section_image', title: 'Rasm', type: 'image' },
    { key: 'about_title', title: 'Sarlavha', type: 'input' },
    { key: 'about_text_1', title: 'Matn 1', type: 'textarea' },
    { key: 'about_text_2', title: 'Matn 2', type: 'textarea' },
  ],
  reservation: [
    { key: 'reservation_banner_image', title: 'Banner rasmi', type: 'image' },
    { key: 'reservation_title', title: 'Sarlavha', type: 'input' },
    { key: 'reservation_description', title: 'Tavsif', type: 'textarea' },
  ],
  stats: [
    { key: 'stat_years_value', title: 'Yillar (qiymat)', type: 'input' },
    { key: 'stat_years_label', title: 'Yillar (label)', type: 'input' },
    { key: 'stat_clients_value', title: 'Mijozlar (qiymat)', type: 'input' },
    { key: 'stat_clients_label', title: 'Mijozlar (label)', type: 'input' },
    { key: 'stat_dishes_value', title: 'Taomlar (qiymat)', type: 'input' },
    { key: 'stat_dishes_label', title: 'Taomlar (label)', type: 'input' },
    { key: 'stat_awards_value', title: 'Mukofotlar (qiymat)', type: 'input' },
    { key: 'stat_awards_label', title: 'Mukofotlar (label)', type: 'input' },
  ],
};

// Menyu sahifasi kontenti
const menuPageSettings = [
  { key: 'menu_title', title: 'Sahifa sarlavhasi', type: 'input' },
  { key: 'menu_description', title: 'Sahifa tavsifi', type: 'textarea' },
];

// Biz haqimizda sahifasi kontenti
const aboutPageSettings = [
  { key: 'about_page_title', title: 'Sahifa sarlavhasi', type: 'input' },
  { key: 'about_page_description', title: 'Sahifa tavsifi', type: 'textarea' },
  { key: 'team_section_title', title: "Jamoa bo'limi sarlavhasi", type: 'input' },
  { key: 'team_section_description', title: "Jamoa bo'limi tavsifi", type: 'textarea' },
  { key: 'history_section_title', title: "Tarix bo'limi sarlavhasi", type: 'input' },
  { key: 'history_section_description', title: "Tarix bo'limi tavsifi", type: 'textarea' },
  { key: 'awards_section_title', title: "Mukofotlar bo'limi sarlavhasi", type: 'input' },
  { key: 'awards_section_description', title: "Mukofotlar bo'limi tavsifi", type: 'textarea' },
  { key: 'faq_section_title', title: "FAQ bo'limi sarlavhasi", type: 'input' },
  { key: 'faq_section_description', title: "FAQ bo'limi tavsifi", type: 'textarea' },
  { key: 'gallery_section_title', title: "Galereya bo'limi sarlavhasi", type: 'input' },
  { key: 'gallery_section_description', title: "Galereya bo'limi tavsifi", type: 'textarea' },
];

// Kontakt sahifasi kontenti
const contactPageSettings = [
  { key: 'contact_title', title: 'Sahifa sarlavhasi', type: 'input' },
  { key: 'contact_description', title: 'Sahifa tavsifi', type: 'textarea' },
  { key: 'restaurant_phone', title: 'Telefon raqam', type: 'input' },
  { key: 'restaurant_address', title: 'Manzil', type: 'input' },
  { key: 'working_hours', title: 'Ish vaqti', type: 'input' },
  { key: 'restaurant_email', title: 'Email', type: 'input' },
  { key: 'map_section_title', title: "Xarita bo'limi sarlavhasi", type: 'input' },
];

// Ijtimoiy tarmoqlar
const socialSettings = [
  { key: 'instagram_url', title: 'Instagram URL', type: 'input' },
  { key: 'telegram_url', title: 'Telegram URL', type: 'input' },
  { key: 'facebook_url', title: 'Facebook URL', type: 'input' },
];

// Yetkazib berish sahifasi kontenti
const deliveryPageSettings = {
  hero: [
    { key: 'delivery_page_image', title: 'Hero rasmi', type: 'image' },
    { key: 'delivery_page_title', title: 'Sahifa sarlavhasi', type: 'input' },
    { key: 'delivery_page_description', title: 'Sahifa tavsifi', type: 'textarea' },
  ],
  sections: [
    { key: 'delivery_zones_title', title: 'Hududlar bo\'limi sarlavhasi', type: 'input' },
    { key: 'delivery_zones_description', title: 'Hududlar bo\'limi tavsifi', type: 'textarea' },
    { key: 'delivery_payment_title', title: 'To\'lov bo\'limi sarlavhasi', type: 'input' },
    { key: 'delivery_payment_description', title: 'To\'lov bo\'limi tavsifi', type: 'textarea' },
    { key: 'delivery_steps_title', title: 'Qadamlar bo\'limi sarlavhasi', type: 'input' },
  ],
  cta: [
    { key: 'delivery_cta_title', title: 'CTA sarlavhasi', type: 'input' },
    { key: 'delivery_cta_description', title: 'CTA tavsifi', type: 'textarea' },
  ],
};

// Aksiyalar sahifasi kontenti
const promotionsPageSettings = {
  hero: [
    { key: 'promotions_page_title', title: 'Sahifa sarlavhasi', type: 'input' },
    { key: 'promotions_page_description', title: 'Sahifa tavsifi', type: 'textarea' },
  ],
  empty: [
    { key: 'promotions_empty_title', title: 'Bo\'sh holat sarlavhasi', type: 'input' },
    { key: 'promotions_empty_description', title: 'Bo\'sh holat tavsifi', type: 'textarea' },
  ],
  benefits: [
    { key: 'promotions_benefits_title', title: 'Afzalliklar bo\'limi sarlavhasi', type: 'input' },
  ],
};

// Footer kontenti
const footerSettings = [
  { key: 'footer_brand_description', title: 'Brand tavsifi', type: 'textarea' },
  { key: 'footer_links_title', title: 'Havolalar sarlavhasi', type: 'input' },
  { key: 'footer_contact_title', title: 'Bog\'lanish sarlavhasi', type: 'input' },
  { key: 'footer_social_title', title: 'Ijtimoiy tarmoqlar sarlavhasi', type: 'input' },
  { key: 'footer_social_description', title: 'Ijtimoiy tarmoqlar tavsifi', type: 'textarea' },
  { key: 'footer_copyright', title: 'Copyright matni', type: 'input' },
];

export default function ContentManagement() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');
      
      if (error) throw error;
      return data as SiteSetting[];
    },
  });

  useEffect(() => {
    if (settings) {
      const initial: Record<string, string> = {};
      settings.forEach(s => {
        initial[s.key] = s.value || '';
      });
      setLocalSettings(initial);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updates: { key: string; value: string }[]) => {
      for (const { key, value } of updates) {
        const existing = settings?.find(s => s.key === key);
        if (existing) {
          const { error } = await supabase
            .from('site_settings')
            .update({ value })
            .eq('key', key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('site_settings')
            .insert({ key, value });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast.success("Kontent saqlandi");
      setHasChanges(false);
    },
    onError: () => {
      toast.error('Xatolik yuz berdi');
    },
  });

  const handleChange = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveAll = () => {
    const updates = Object.entries(localSettings)
      .filter(([key, value]) => {
        const original = settings?.find(s => s.key === key)?.value || '';
        return value !== original;
      })
      .map(([key, value]) => ({ key, value }));
    
    if (updates.length > 0) {
      updateMutation.mutate(updates);
    }
  };

  const getValue = (key: string) => localSettings[key] || '';

  const renderField = (config: { key: string; title: string; type: string }) => {
    if (config.type === 'image') {
      return (
        <div key={config.key} className="space-y-2">
          <Label className="text-slate-700">{config.title}</Label>
          <ImageUpload
            value={getValue(config.key)}
            onChange={(value) => handleChange(config.key, value)}
            folder="site-settings"
            className="max-w-md admin-upload"
          />
        </div>
      );
    }
    
    if (config.type === 'textarea') {
      return (
        <div key={config.key} className="space-y-2">
          <Label className="text-slate-700">{config.title}</Label>
          <Textarea
            value={getValue(config.key)}
            onChange={(e) => handleChange(config.key, e.target.value)}
            placeholder={config.title}
            rows={3}
            className="bg-white border-slate-300 text-slate-900"
          />
        </div>
      );
    }
    
    return (
      <div key={config.key} className="space-y-2">
        <Label className="text-slate-700">{config.title}</Label>
        <Input
          value={getValue(config.key)}
          onChange={(e) => handleChange(config.key, e.target.value)}
          placeholder={config.title}
          className="bg-white border-slate-300 text-slate-900"
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display text-slate-900">Kontent boshqaruvi</h1>
            <p className="text-slate-500 mt-1">
              Saytdagi barcha sahifalar kontentini boshqaring
            </p>
          </div>
          {hasChanges && (
            <Button onClick={handleSaveAll} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Saqlash
            </Button>
          )}
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="bg-slate-100 border border-slate-200 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="branding" className="flex items-center gap-2 data-[state=active]:bg-white">
              <ImageIcon className="w-4 h-4" />
              Logo & Branding
            </TabsTrigger>
            <TabsTrigger value="home" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Home className="w-4 h-4" />
              Bosh sahifa
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2 data-[state=active]:bg-white">
              <UtensilsCrossed className="w-4 h-4" />
              Menyu
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Info className="w-4 h-4" />
              Biz haqimizda
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Truck className="w-4 h-4" />
              Yetkazib berish
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Gift className="w-4 h-4" />
              Aksiyalar
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Phone className="w-4 h-4" />
              Kontakt
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2 data-[state=active]:bg-white">
              <LayoutGrid className="w-4 h-4" />
              Footer
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Share2 className="w-4 h-4" />
              Ijtimoiy
            </TabsTrigger>
          </TabsList>

          {/* Logo & Branding */}
          <TabsContent value="branding" className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Logo va Branding</CardTitle>
                <CardDescription className="text-slate-500">Sayt logosi, favicon va branding sozlamalari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {brandingSettings.map(renderField)}
                <p className="text-sm text-slate-500 mt-4">
                  * Favicon o'zgarishi uchun sahifani yangilang
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bosh sahifa */}
          <TabsContent value="home" className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Hero bo'limi</CardTitle>
                <CardDescription className="text-slate-500">Bosh sahifaning yuqori qismi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {homePageSettings.hero.map(renderField)}
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Biz haqimizda bo'limi</CardTitle>
                <CardDescription className="text-slate-500">Bosh sahifadagi biz haqimizda qismi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {homePageSettings.about.map(renderField)}
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Reservation bo'limi</CardTitle>
                <CardDescription className="text-slate-500">Stol band qilish banneri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {homePageSettings.reservation.map(renderField)}
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Statistika</CardTitle>
                <CardDescription className="text-slate-500">Restoran haqida statistik ma'lumotlar</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {homePageSettings.stats.map(renderField)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menyu sahifasi */}
          <TabsContent value="menu" className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Menyu sahifasi</CardTitle>
                <CardDescription className="text-slate-500">Menyu sahifasidagi sarlavha va tavsif</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {menuPageSettings.map(renderField)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Biz haqimizda sahifasi */}
          <TabsContent value="about" className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Sahifa sozlamalari</CardTitle>
                <CardDescription className="text-slate-500">Sahifa bo'limlari sarlavha va tavsiflari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {aboutPageSettings.map(renderField)}
              </CardContent>
            </Card>

            {/* Jamoa */}
            <TeamSection />

            {/* FAQ */}
            <FaqSection />

            {/* Mukofotlar */}
            <AwardsSection />
          </TabsContent>

          {/* Yetkazib berish sahifasi */}
          <TabsContent value="delivery" className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Hero bo'limi</CardTitle>
                <CardDescription className="text-slate-500">Sahifaning yuqori qismi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliveryPageSettings.hero.map(renderField)}
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Bo'limlar</CardTitle>
                <CardDescription className="text-slate-500">Sahifadagi bo'limlar sarlavhalari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliveryPageSettings.sections.map(renderField)}
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">CTA bo'limi</CardTitle>
                <CardDescription className="text-slate-500">Harakatga chaqiruvchi bo'lim</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliveryPageSettings.cta.map(renderField)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aksiyalar sahifasi */}
          <TabsContent value="promotions" className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Hero bo'limi</CardTitle>
                <CardDescription className="text-slate-500">Sahifaning yuqori qismi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {promotionsPageSettings.hero.map(renderField)}
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Bo'sh holat</CardTitle>
                <CardDescription className="text-slate-500">Aksiyalar bo'lmaganda ko'rsatiladigan matn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {promotionsPageSettings.empty.map(renderField)}
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Afzalliklar bo'limi</CardTitle>
                <CardDescription className="text-slate-500">Nima uchun bizni tanlashadi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {promotionsPageSettings.benefits.map(renderField)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kontakt sahifasi */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Kontakt ma'lumotlari</CardTitle>
                <CardDescription className="text-slate-500">Aloqa sahifasi va footer uchun ma'lumotlar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactPageSettings.map(renderField)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Footer */}
          <TabsContent value="footer" className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Footer sozlamalari</CardTitle>
                <CardDescription className="text-slate-500">Saytning pastki qismi (footer) matni</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {footerSettings.map(renderField)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ijtimoiy tarmoqlar */}
          <TabsContent value="social" className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Ijtimoiy tarmoqlar</CardTitle>
                <CardDescription className="text-slate-500">Restoran ijtimoiy tarmoq havolalari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {socialSettings.map(renderField)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Team Section Component
function TeamSection() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: '', position: '', image_url: '', experience: '', sort_order: 0, is_active: true });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_members').select('*').order('sort_order');
      if (error) throw error;
      return data as TeamMember[];
    },
  });

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
    return <Card className="bg-white border-slate-200 shadow-sm"><CardContent className="py-8"><div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div></CardContent></Card>;
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-slate-900 flex items-center gap-2"><Users className="w-5 h-5" /> Jamoa a'zolari</CardTitle>
          <CardDescription className="text-slate-500">Restoran jamoasi</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Qo'shish</Button>
          </DialogTrigger>
          <DialogContent className="!bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-900">{editingMember ? 'Tahrirlash' : "Yangi a'zo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-slate-700">Ism</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white border-slate-300 text-slate-900" /></div>
              <div><Label className="text-slate-700">Lavozim</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="bg-white border-slate-300 text-slate-900" /></div>
              <div><Label className="text-slate-700">Tajriba</Label><Input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="10 yil tajriba" className="bg-white border-slate-300 text-slate-900" /></div>
              <div><Label className="text-slate-700">Rasm</Label><ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="team" className="admin-upload" /></div>
              <div><Label className="text-slate-700">Tartib raqami</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="bg-white border-slate-300 text-slate-900" /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} /><Label className="text-slate-700">Faol</Label></div>
              <Button onClick={() => saveMutation.mutate(editingMember ? { ...form, id: editingMember.id } : form)} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Saqlash
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200">
              <TableHead className="text-slate-600">Rasm</TableHead>
              <TableHead className="text-slate-600">Ism</TableHead>
              <TableHead className="text-slate-600">Lavozim</TableHead>
              <TableHead className="text-slate-600">Holat</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} className="border-slate-200">
                <TableCell>{member.image_url && <img src={member.image_url} alt={member.name} className="w-10 h-10 rounded-full object-cover" />}</TableCell>
                <TableCell className="font-medium text-slate-900">{member.name}</TableCell>
                <TableCell className="text-slate-600">{member.position}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-xs ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{member.is_active ? 'Faol' : 'Nofaol'}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(member)}><Pencil className="w-4 h-4 text-slate-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(member.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
function FaqSection() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', sort_order: 0, is_active: true });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['faq-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('faq_items').select('*').order('sort_order');
      if (error) throw error;
      return data as FaqItem[];
    },
  });

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
    return <Card className="bg-white border-slate-200 shadow-sm"><CardContent className="py-8"><div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div></CardContent></Card>;
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-slate-900 flex items-center gap-2"><HelpCircle className="w-5 h-5" /> FAQ</CardTitle>
          <CardDescription className="text-slate-500">Ko'p beriladigan savollar</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Qo'shish</Button>
          </DialogTrigger>
          <DialogContent className="!bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-900">{editingItem ? 'Tahrirlash' : 'Yangi savol'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-slate-700">Savol</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="bg-white border-slate-300 text-slate-900" /></div>
              <div><Label className="text-slate-700">Javob</Label><Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} className="bg-white border-slate-300 text-slate-900" /></div>
              <div><Label className="text-slate-700">Tartib raqami</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="bg-white border-slate-300 text-slate-900" /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} /><Label className="text-slate-700">Faol</Label></div>
              <Button onClick={() => saveMutation.mutate(editingItem ? { ...form, id: editingItem.id } : form)} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Saqlash
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200">
              <TableHead className="text-slate-600">Savol</TableHead>
              <TableHead className="text-slate-600">Javob</TableHead>
              <TableHead className="text-slate-600">Holat</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="border-slate-200">
                <TableCell className="font-medium text-slate-900 max-w-[200px] truncate">{item.question}</TableCell>
                <TableCell className="text-slate-600 max-w-[300px] truncate">{item.answer}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{item.is_active ? 'Faol' : 'Nofaol'}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4 text-slate-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
function AwardsSection() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AwardItem | null>(null);
  const [form, setForm] = useState({ title: '', organization: '', year: '', sort_order: 0, is_active: true });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['awards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('awards').select('*').order('sort_order');
      if (error) throw error;
      return data as AwardItem[];
    },
  });

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
    return <Card className="bg-white border-slate-200 shadow-sm"><CardContent className="py-8"><div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div></CardContent></Card>;
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-slate-900 flex items-center gap-2"><Award className="w-5 h-5" /> Mukofotlar</CardTitle>
          <CardDescription className="text-slate-500">Restoran mukofotlari</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Qo'shish</Button>
          </DialogTrigger>
          <DialogContent className="!bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-900">{editingItem ? 'Tahrirlash' : 'Yangi mukofot'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-slate-700">Nomi</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-white border-slate-300 text-slate-900" /></div>
              <div><Label className="text-slate-700">Tashkilot</Label><Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="bg-white border-slate-300 text-slate-900" /></div>
              <div><Label className="text-slate-700">Yil</Label><Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2023" className="bg-white border-slate-300 text-slate-900" /></div>
              <div><Label className="text-slate-700">Tartib raqami</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="bg-white border-slate-300 text-slate-900" /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} /><Label className="text-slate-700">Faol</Label></div>
              <Button onClick={() => saveMutation.mutate(editingItem ? { ...form, id: editingItem.id } : form)} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Saqlash
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200">
              <TableHead className="text-slate-600">Nomi</TableHead>
              <TableHead className="text-slate-600">Tashkilot</TableHead>
              <TableHead className="text-slate-600">Yil</TableHead>
              <TableHead className="text-slate-600">Holat</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="border-slate-200">
                <TableCell className="font-medium text-slate-900">{item.title}</TableCell>
                <TableCell className="text-slate-600">{item.organization}</TableCell>
                <TableCell className="text-slate-600">{item.year}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{item.is_active ? 'Faol' : 'Nofaol'}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4 text-slate-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
