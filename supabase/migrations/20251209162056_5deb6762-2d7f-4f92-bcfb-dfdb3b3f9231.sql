-- Mahsulotlarga yangi maydonlar qo'shish
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS weight text,
ADD COLUMN IF NOT EXISTS prep_time text,
ADD COLUMN IF NOT EXISTS spice_level integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS calories integer;