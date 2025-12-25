import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SiteSetting {
  key: string;
  value: string | null;
}

const defaultSettings: Record<string, string> = {
  // Images
  hero_background_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop',
  hero_main_image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200&auto=format&fit=crop',
  about_section_image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200&auto=format&fit=crop',
  reservation_banner_image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop',
  // Contact
  restaurant_phone: '+998 90 123 45 67',
  restaurant_address: 'Toshkent sh., Chilanzar tumani',
  working_hours: '10:00 - 23:00',
  restaurant_email: 'info@bellavista.uz',
  // Hero text
  hero_title: 'Burger Plus',
  hero_subtitle: 'Fast Food',
  hero_description: "Eng yaxshi taomlar va mukammal xizmat ko'rsatish bilan sizni kutamiz. Unutilmas lazzat va atmosfera.",
  hero_badge_text: 'Premium Fast Food',
  hero_discount_percent: '-20%',
  hero_discount_text: 'Birinchi buyurtma',
  // About text
  about_title: 'Biz haqimizda',
  about_text_1: "Bella Vista – bu nafaqat restoran, balki mazali taomlar va iliq muhit uyg'unligi. Biz 15 yildan ortiq vaqt davomida mijozlarimizga eng yaxshi xizmat ko'rsatib kelmoqdamiz.",
  about_text_2: 'Bizning oshxonamizda faqat yangi va sifatli mahsulotlar ishlatiladi. Har bir taom sevgi va professional mahorat bilan tayyorlanadi.',
  about_page_title: 'Biz haqimizda',
  about_page_description: 'Bella Vista restoran tarixi va qadriyatlari',
  contact_title: "Biz bilan bog'laning",
  contact_description: "Savollaringiz bormi? Biz bilan bog'laning",
  // Menu
  menu_title: 'Bizning Menyu',
  menu_description: "Eng mazali taomlar to'plami",
  // Reservation
  reservation_title: 'Stol band qilish',
  reservation_description: "Oldindan joy band qiling va maxsus xizmatdan bahramand bo'ling",
  // Social
  instagram_url: 'https://instagram.com/bellavista',
  telegram_url: 'https://t.me/bellavista',
  facebook_url: 'https://facebook.com/bellavista',
  // Statistics
  stat_years_value: '15+',
  stat_years_label: 'Yillik tajriba',
  stat_clients_value: '50,000+',
  stat_clients_label: 'Mamnun mijozlar',
  stat_dishes_value: '120+',
  stat_dishes_label: 'Taomlar',
  stat_awards_value: '25+',
  stat_awards_label: 'Mukofotlar',
  // About page sections
  team_section_title: 'Bizning jamoa',
  team_section_description: 'Professional va tajribali jamoamiz sizga eng yaxshi xizmatni taqdim etadi',
  history_section_title: 'Bizning tarix',
  history_section_description: '2008-yildan buyon sizga xizmat qilmoqdamiz',
  awards_section_title: 'Mukofotlar va yutuqlar',
  awards_section_description: 'Bizning mehnatimiz tan olingan',
  video_section_title: 'Video tanishuv',
  video_section_description: 'Restoramiz bilan yaqindan tanishing',
  testimonials_section_title: 'Mijozlarimiz fikrlari',
  testimonials_section_description: 'Bizning xizmatimiz haqida nima deyishadi',
  gallery_section_title: 'Galereya',
  gallery_section_description: 'Restoramiz va taomlarimizdan lavhalar',
  faq_section_title: "Ko'p beriladigan savollar",
  faq_section_description: 'Savollaringizga javoblar',
  map_section_title: 'Bizning manzil',
  // Delivery page
  delivery_page_title: 'Yetkazib berish xizmati',
  delivery_page_description: 'Tez va ishonchli yetkazib berish xizmati. Issiq va mazali taomlarni eshigingizgacha yetkazib beramiz.',
  delivery_page_image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&h=400&fit=crop',
  delivery_zones_title: 'Yetkazib berish hududlari',
  delivery_zones_description: 'Toshkent shahri bo\'ylab yetkazib beramiz',
  delivery_payment_title: 'To\'lov usullari',
  delivery_payment_description: 'Sizga qulay usulda to\'lang',
  delivery_steps_title: 'Qanday ishlaydi?',
  delivery_cta_title: 'Hoziroq buyurtma bering!',
  delivery_cta_description: 'Mazali taomlarimizni uyingizda tatib ko\'ring',
  // Promotions page
  promotions_page_title: 'Aktsiyalar va chegirmalar',
  promotions_page_description: 'Eng yaxshi narxlarda mazali taomlardan bahramand bo\'ling',
  promotions_empty_title: 'Hozircha aktsiyalar yo\'q',
  promotions_empty_description: 'Tez orada yangi takliflar bilan qaytamiz!',
  promotions_benefits_title: 'Nima uchun bizni tanlashadi?',
  // Footer
  footer_brand_description: 'Eng mazali milliy taomlar va zamonaviy fast food – premium xizmat bilan.',
  footer_links_title: 'Havolalar',
  footer_contact_title: 'Bog\'lanish',
  footer_social_title: 'Ijtimoiy tarmoqlar',
  footer_social_description: 'Bizni kuzating va aksiyalardan xabardor bo\'ling!',
  footer_copyright: '© 2024 Bella Vista. Barcha huquqlar himoyalangan.',
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
    staleTime: 5 * 60 * 1000,
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
