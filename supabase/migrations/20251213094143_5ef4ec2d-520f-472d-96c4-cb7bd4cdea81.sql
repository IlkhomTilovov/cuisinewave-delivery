-- O'ta ochiq INSERT siyosatini o'chirish
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Faqat autentifikatsiya qilingan foydalanuvchilarga ruxsat beruvchi yangi siyosat
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);