-- Add user_id column to couriers table for Supabase Auth integration
ALTER TABLE public.couriers 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_couriers_user_id ON public.couriers(user_id);

-- Add RLS policy for couriers to view their own data
CREATE POLICY "Couriers can view their own profile"
ON public.couriers
FOR SELECT
USING (auth.uid() = user_id);

-- Add RLS policy for couriers to view orders assigned to them
CREATE POLICY "Couriers can view their assigned orders"
ON public.orders
FOR SELECT
USING (
  courier_id IN (
    SELECT id FROM public.couriers WHERE user_id = auth.uid()
  )
);

-- Add RLS policy for couriers to view order items of their assigned orders
CREATE POLICY "Couriers can view order items of assigned orders"
ON public.order_items
FOR SELECT
USING (
  order_id IN (
    SELECT id FROM public.orders WHERE courier_id IN (
      SELECT id FROM public.couriers WHERE user_id = auth.uid()
    )
  )
);