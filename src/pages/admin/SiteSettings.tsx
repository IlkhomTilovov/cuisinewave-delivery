import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
}

const settingsConfig = [
  {
    key: 'hero_background_image',
    title: 'Hero fon rasmi',
    description: 'Bosh sahifaning yuqori qismidagi fon rasmi',
  },
  {
    key: 'about_section_image',
    title: 'Biz haqimizda rasmi',
    description: 'Biz haqimizda bo\'limidagi rasm',
  },
  {
    key: 'reservation_banner_image',
    title: 'Reservation banner rasmi',
    description: 'Stol band qilish bannerining fon rasmi',
  },
];

export default function SiteSettings() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', settingsConfig.map(s => s.key));
      
      if (error) throw error;
      return data as SiteSetting[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value })
        .eq('key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Sozlamalar saqlandi');
    },
    onError: () => {
      toast.error('Xatolik yuz berdi');
    },
  });

  const handleImageChange = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string) => {
    const value = localSettings[key];
    if (value) {
      updateMutation.mutate({ key, value });
    }
  };

  const getSettingValue = (key: string) => {
    if (localSettings[key]) return localSettings[key];
    return settings?.find(s => s.key === key)?.value || '';
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
        <div>
          <h1 className="text-3xl font-bold font-display">Sayt Sozlamalari</h1>
          <p className="text-muted-foreground mt-1">
            Saytdagi asosiy rasmlarni boshqaring
          </p>
        </div>

        <div className="grid gap-6">
          {settingsConfig.map((config) => (
            <Card key={config.key}>
              <CardHeader>
                <CardTitle>{config.title}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ImageUpload
                    value={getSettingValue(config.key)}
                    onChange={(value) => handleImageChange(config.key, value)}
                    folder="site-settings"
                    className="max-w-md"
                  />
                  {localSettings[config.key] && localSettings[config.key] !== settings?.find(s => s.key === config.key)?.value && (
                    <Button 
                      onClick={() => handleSave(config.key)}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Saqlash
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
