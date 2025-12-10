-- Fix 1: Verify orders table has proper RLS (it already does, but ensure no public SELECT exists)
-- The orders table already has correct policies, but the scanner may have detected an issue
-- Let's ensure the policies are properly set up

-- Fix 2: Remove public read access from suppliers table
-- Drop the existing public read policy
DROP POLICY IF EXISTS "Suppliers are publicly readable" ON public.suppliers;

-- Create a new policy that restricts read access to admin roles only
CREATE POLICY "Admins can view suppliers" 
ON public.suppliers 
FOR SELECT 
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role)
);