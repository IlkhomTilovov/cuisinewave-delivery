-- Fix: Order Items SELECT policy too permissive
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Admins can view order items" ON public.order_items;

-- Create proper policy that checks for admin roles
CREATE POLICY "Admins can view order items" ON public.order_items 
  FOR SELECT TO authenticated 
  USING (
    public.has_role(auth.uid(), 'superadmin') 
    OR public.has_role(auth.uid(), 'manager') 
    OR public.has_role(auth.uid(), 'operator')
  );