-- Remove the public read policy from ingredients table
DROP POLICY IF EXISTS "Ingredients are publicly readable" ON public.ingredients;

-- Create admin-only read policy
CREATE POLICY "Admins can read ingredients" ON public.ingredients
  FOR SELECT USING (
    has_role(auth.uid(), 'superadmin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'operator'::app_role)
  );