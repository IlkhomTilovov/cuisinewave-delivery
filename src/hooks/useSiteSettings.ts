import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SiteSetting {
  key: string;
  value: string | null;
}

const defaultSettings: Record<string, string> = {
  hero_background_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop',
  about_section_image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200&auto=format&fit=crop',
  reservation_banner_image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop',
};

export function useSiteSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');
      
      if (error) throw error;
      return data as SiteSetting[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getSetting = (key: string): string => {
    const setting = settings?.find(s => s.key === key);
    return setting?.value || defaultSettings[key] || '';
  };

  return {
    getSetting,
    isLoading,
  };
}
