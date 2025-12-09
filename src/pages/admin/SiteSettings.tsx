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
import { Loader2, Save, Image, Phone, MapPin, Clock, Mail, Type, Share2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
}

const imageSettings = [
  { key: 'hero_background_image', title: 'Hero fon rasmi', description: 'Bosh sahifaning yuqori qismidagi fon rasmi' },
  { key: 'about_section_image', title: 'Biz haqimizda rasmi', description: "Biz haqimizda bo'limidagi rasm" },
  { key: 'reservation_banner_image', title: 'Reservation banner rasmi', description: 'Stol band qilish bannerining fon rasmi' },
];

const contactSettings = [
  { key: 'restaurant_phone', title: 'Telefon raqam', icon: Phone, type: 'input' },
  { key: 'restaurant_address', title: 'Manzil', icon: MapPin, type: 'input' },
  { key: 'working_hours', title: 'Ish vaqti', icon: Clock, type: 'input' },
  { key: 'restaurant_email', title: 'Email', icon: Mail, type: 'input' },
];

const heroSettings = [
  { key: 'hero_title', title: 'Hero sarlavha', type: 'input' },
  { key: 'hero_subtitle', title: 'Hero ikkinchi sarlavha', type: 'input' },
  { key: 'hero_description', title: 'Hero tavsif matni', type: 'textarea' },
];

const aboutSettings = [
  { key: 'about_title', title: 'Biz haqimizda sarlavha', type: 'input' },
  { key: 'about_text_1', title: 'Biz haqimizda matn 1', type: 'textarea' },
  { key: 'about_text_2', title: 'Biz haqimizda matn 2', type: 'textarea' },
  { key: 'about_page_title', title: 'Sahifa sarlavhasi', type: 'input' },
  { key: 'about_page_description', title: 'Sahifa tavsifi', type: 'textarea' },
  { key: 'contact_title', title: "Aloqa bo'limi sarlavhasi", type: 'input' },
  { key: 'contact_description', title: "Aloqa bo'limi tavsifi", type: 'textarea' },
];

const menuSettings = [
  { key: 'menu_title', title: 'Menyu sahifasi sarlavhasi', type: 'input' },
  { key: 'menu_description', title: 'Menyu sahifasi tavsifi', type: 'textarea' },
];

const reservationSettings = [
  { key: 'reservation_title', title: 'Reservation sarlavhasi', type: 'input' },
  { key: 'reservation_description', title: 'Reservation tavsifi', type: 'textarea' },
];

const socialSettings = [
  { key: 'instagram_url', title: 'Instagram', type: 'input' },
  { key: 'telegram_url', title: 'Telegram', type: 'input' },
  { key: 'facebook_url', title: 'Facebook', type: 'input' },
];

export default function SiteSettings() {
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
        const { error } = await supabase
          .from('site_settings')
          .update({ value })
          .eq('key', key);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast.success('Sozlamalar saqlandi');
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
            <h1 className="text-3xl font-bold font-display">Sayt Sozlamalari</h1>
            <p className="text-muted-foreground mt-1">
              Saytdagi barcha ma'lumotlarni boshqaring
            </p>
          </div>
          {hasChanges && (
            <Button onClick={handleSaveAll} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Barchasini saqlash
            </Button>
          )}
        </div>

        <Tabs defaultValue="images" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Rasmlar
            </TabsTrigger>
            <TabsTrigger value="hero" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Hero
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Menyu
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Biz haqimizda
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Kontakt
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Ijtimoiy
            </TabsTrigger>
          </TabsList>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            {imageSettings.map((config) => (
              <Card key={config.key}>
                <CardHeader>
                  <CardTitle>{config.title}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    value={getValue(config.key)}
                    onChange={(value) => handleChange(config.key, value)}
                    folder="site-settings"
                    className="max-w-md"
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Hero Tab */}
          <TabsContent value="hero" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero bo'limi</CardTitle>
                <CardDescription>Bosh sahifaning yuqori qismi matni</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {heroSettings.map((config) => (
                  <div key={config.key} className="space-y-2">
                    <Label>{config.title}</Label>
                    {config.type === 'textarea' ? (
                      <Textarea
                        value={getValue(config.key)}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        placeholder={config.title}
                        rows={3}
                      />
                    ) : (
                      <Input
                        value={getValue(config.key)}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        placeholder={config.title}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Reservation bo'limi</CardTitle>
                <CardDescription>Stol band qilish bo'limi matni</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reservationSettings.map((config) => (
                  <div key={config.key} className="space-y-2">
                    <Label>{config.title}</Label>
                    {config.type === 'textarea' ? (
                      <Textarea
                        value={getValue(config.key)}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        placeholder={config.title}
                        rows={3}
                      />
                    ) : (
                      <Input
                        value={getValue(config.key)}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        placeholder={config.title}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Tab */}
          <TabsContent value="menu" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Menyu sahifasi</CardTitle>
                <CardDescription>Menyu sahifasidagi matnlar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {menuSettings.map((config) => (
                  <div key={config.key} className="space-y-2">
                    <Label>{config.title}</Label>
                    {config.type === 'textarea' ? (
                      <Textarea
                        value={getValue(config.key)}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        placeholder={config.title}
                        rows={3}
                      />
                    ) : (
                      <Input
                        value={getValue(config.key)}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        placeholder={config.title}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Biz haqimizda bo'limi</CardTitle>
                <CardDescription>Restoran haqida ma'lumot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {aboutSettings.map((config) => (
                  <div key={config.key} className="space-y-2">
                    <Label>{config.title}</Label>
                    {config.type === 'textarea' ? (
                      <Textarea
                        value={getValue(config.key)}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        placeholder={config.title}
                        rows={3}
                      />
                    ) : (
                      <Input
                        value={getValue(config.key)}
                        onChange={(e) => handleChange(config.key, e.target.value)}
                        placeholder={config.title}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kontakt ma'lumotlari</CardTitle>
                <CardDescription>Restoran aloqa ma'lumotlari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactSettings.map((config) => (
                  <div key={config.key} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <config.icon className="w-4 h-4" />
                      {config.title}
                    </Label>
                    <Input
                      value={getValue(config.key)}
                      onChange={(e) => handleChange(config.key, e.target.value)}
                      placeholder={config.title}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ijtimoiy tarmoqlar</CardTitle>
                <CardDescription>Restoran ijtimoiy tarmoq havolalari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {socialSettings.map((config) => (
                  <div key={config.key} className="space-y-2">
                    <Label>{config.title}</Label>
                    <Input
                      value={getValue(config.key)}
                      onChange={(e) => handleChange(config.key, e.target.value)}
                      placeholder={`https://${config.title.toLowerCase()}.com/...`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
