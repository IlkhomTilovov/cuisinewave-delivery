import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDynamicTitle(pageTitle?: string) {
  const { data: siteName } = useQuery({
    queryKey: ['site-name'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'site_name')
        .maybeSingle();
      
      if (error) throw error;
      return data?.value || 'Bella Vista';
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (siteName) {
      document.title = pageTitle ? `${pageTitle} | ${siteName}` : siteName;
    }
  }, [siteName, pageTitle]);

  return siteName;
}
