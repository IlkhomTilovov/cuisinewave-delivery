-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  image_url TEXT,
  experience TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faq_items table
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create awards table
CREATE TABLE public.awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  organization TEXT,
  year TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Team members are publicly readable" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "FAQ items are publicly readable" ON public.faq_items FOR SELECT USING (true);
CREATE POLICY "Awards are publicly readable" ON public.awards FOR SELECT USING (true);

-- Admin manage policies
CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL 
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can manage faq items" ON public.faq_items FOR ALL 
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can manage awards" ON public.awards FOR ALL 
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Insert default data
INSERT INTO public.team_members (name, position, image_url, experience, sort_order) VALUES
('Akbar Karimov', 'Bosh oshpaz', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop', '15 yil tajriba', 1),
('Dilnoza Rahimova', 'Sous-chef', 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=400&h=400&fit=crop', '10 yil tajriba', 2),
('Jasur Toshmatov', 'Konditer ustasi', 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=400&h=400&fit=crop', '8 yil tajriba', 3),
('Malika Saidova', 'Restoran menejeri', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop', '12 yil tajriba', 4);

INSERT INTO public.faq_items (question, answer, sort_order) VALUES
('Ish vaqtingiz qanday?', 'Biz har kuni soat 10:00 dan 23:00 gacha ishlaymiz. Dam olish kunlari ham ochiqmiz.', 1),
('Stol band qilish kerakmi?', 'Ha, ayniqsa hafta oxiri va bayram kunlarida oldindan stol band qilishni tavsiya etamiz. Telefon yoki saytimiz orqali band qilishingiz mumkin.', 2),
('Yetkazib berish xizmati bormi?', 'Ha, shahar bo''ylab yetkazib berish xizmatimiz mavjud. Minimal buyurtma summasi 50,000 so''m.', 3),
('Vegetarian taomlar bormi?', 'Ha, menyumizda vegetarianlar uchun maxsus taomlar bo''limi mavjud.', 4),
('To''lov usullari qanday?', 'Naqd pul, bank kartalari (Uzcard, Humo, Visa, Mastercard) va Click, Payme orqali to''lash mumkin.', 5);

INSERT INTO public.awards (title, organization, year, sort_order) VALUES
('Yilning eng yaxshi restorani', 'O''zbekiston Restoratorlar Assotsiatsiyasi', '2023', 1),
('Eng yaxshi xizmat ko''rsatish', 'Hospitality Awards', '2022', 2),
('Milliy taomlar ustasi', 'Gastronomiya festivali', '2021', 3),
('Mijozlar tanlovi', 'TripAdvisor', '2020', 4);