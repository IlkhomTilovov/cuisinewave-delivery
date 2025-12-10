-- Create telegram cart items table
CREATE TABLE public.telegram_cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_chat_id BIGINT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_telegram_cart_chat_id ON public.telegram_cart_items(telegram_chat_id);

-- Enable RLS
ALTER TABLE public.telegram_cart_items ENABLE ROW LEVEL SECURITY;

-- Allow public access (bot handles auth via chat_id)
CREATE POLICY "Anyone can read telegram cart items" 
ON public.telegram_cart_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert telegram cart items" 
ON public.telegram_cart_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update telegram cart items" 
ON public.telegram_cart_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete telegram cart items" 
ON public.telegram_cart_items 
FOR DELETE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_telegram_cart_items_updated_at
BEFORE UPDATE ON public.telegram_cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();