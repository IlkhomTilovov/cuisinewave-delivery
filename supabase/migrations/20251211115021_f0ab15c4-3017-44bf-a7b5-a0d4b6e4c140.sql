-- =============================================
-- XAVFSIZLIK TUZATISHLARI
-- =============================================

-- 1. orders jadvalidan "Anyone can create orders" siyosatini o'chirish
-- (create-order edge function service_role orqali ishlaydi)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Faqat create-order edge function orqali buyurtma yaratilsin
-- Service role barcha RLS siyosatlarini chetlab o'tadi

-- 2. order_items jadvalidan "Anyone can create order items" siyosatini o'chirish
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Faqat adminlar order_items yaratishi mumkin (edge function service_role ishlatadi)
CREATE POLICY "Admins can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role)
);

-- 3. order_status_history jadvalidan "Anyone can insert order history" siyosatini o'chirish
DROP POLICY IF EXISTS "Anyone can insert order history" ON public.order_status_history;

-- Faqat adminlar va kuryerlar status tarixini qo'shishi mumkin
CREATE POLICY "Admins and couriers can insert order history"
ON public.order_status_history
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR
  has_role(auth.uid(), 'courier'::app_role)
);

-- Kuryerlar o'z buyurtmalari tarixini ko'rishi mumkin
CREATE POLICY "Couriers can view order history of assigned orders"
ON public.order_status_history
FOR SELECT
USING (
  order_id IN (
    SELECT orders.id FROM orders 
    WHERE orders.courier_id IN (
      SELECT couriers.id FROM couriers 
      WHERE couriers.user_id = auth.uid()
    )
  )
);

-- 4. product_ingredients jadvalidan ommaviy o'qish siyosatini o'chirish
DROP POLICY IF EXISTS "Product ingredients are publicly readable" ON public.product_ingredients;

-- Faqat adminlar retseptlarni ko'rishi mumkin
CREATE POLICY "Admins can view product ingredients"
ON public.product_ingredients
FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role)
);

-- 5. Ta'minotchi ma'lumotlarini operatorlardan yashirish
DROP POLICY IF EXISTS "Admins can view suppliers" ON public.suppliers;

CREATE POLICY "Managers can view suppliers"
ON public.suppliers
FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);