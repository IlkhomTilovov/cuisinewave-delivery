import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from 'sonner';
import { Loader2, Save, Home, UtensilsCrossed, Info, Truck, Gift, Phone, Share2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
}

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

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="bg-slate-100 border border-slate-200 p-1">
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
            <TabsTrigger value="contact" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Phone className="w-4 h-4" />
              Kontakt
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2 data-[state=active]:bg-white">
              <Share2 className="w-4 h-4" />
              Ijtimoiy
            </TabsTrigger>
          </TabsList>

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
                <CardTitle className="text-slate-900">Biz haqimizda sahifasi</CardTitle>
                <CardDescription className="text-slate-500">Sahifa bo'limlari sarlavha va tavsiflari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {aboutPageSettings.map(renderField)}
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
