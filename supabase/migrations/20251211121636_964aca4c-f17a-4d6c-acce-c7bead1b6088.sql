-- =============================================
-- ORDERS JADVALIGA QO'SHIMCHA HIMOYA
-- =============================================

-- 1. Kuryerlar uchun cheklangan ko'rish siyosatini yangilash
-- Kuryerlar faqat o'z buyurtmalarini ko'radi, lekin to'liq ma'lumotlar bilan
DROP POLICY IF EXISTS "Couriers can view their assigned orders" ON public.orders;

CREATE POLICY "Couriers can view their assigned orders"
ON public.orders
FOR SELECT
USING (
  courier_id IN (
    SELECT couriers.id FROM couriers 
    WHERE couriers.user_id = auth.uid()
  )
);

-- 2. Kuryerlar faqat status o'zgartirishi mumkin (boshqa ma'lumotlarni emas)
CREATE POLICY "Couriers can update order status"
ON public.orders
FOR UPDATE
USING (
  courier_id IN (
    SELECT couriers.id FROM couriers 
    WHERE couriers.user_id = auth.uid()
  )
)
WITH CHECK (
  courier_id IN (
    SELECT couriers.id FROM couriers 
    WHERE couriers.user_id = auth.uid()
  )
);

-- 3. Buyurtmalarni o'chirish faqat superadmin va manager uchun
CREATE POLICY "Only managers can delete orders"
ON public.orders
FOR DELETE
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- 4. Audit log jadvali - mijoz ma'lumotlariga kirishni kuzatish
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  user_id uuid,
  user_role text,
  ip_address text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit log uchun RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Faqat superadmin audit loglarni ko'rishi mumkin
CREATE POLICY "Only superadmin can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Tizim audit log yozishi mumkin (trigger orqali)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- 5. Buyurtma ko'rilganda audit log yozish funksiyasi
CREATE OR REPLACE FUNCTION public.log_order_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Faqat SELECT operatsiyalarini log qilish
  INSERT INTO public.audit_logs (table_name, record_id, action, user_id, details)
  VALUES (
    'orders',
    NEW.id,
    TG_OP,
    auth.uid(),
    jsonb_build_object(
      'phone_accessed', NEW.phone IS NOT NULL,
      'address_accessed', NEW.address IS NOT NULL
    )
  );
  RETURN NEW;
END;
$$;