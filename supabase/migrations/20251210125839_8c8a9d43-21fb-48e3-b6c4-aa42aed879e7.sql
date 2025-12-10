-- Create couriers table
CREATE TABLE public.couriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT DEFAULT 'car',
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  current_orders_count INTEGER DEFAULT 0,
  max_orders INTEGER DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;

-- Policies for couriers
CREATE POLICY "Admins can manage couriers" 
ON public.couriers 
FOR ALL 
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Operators can view couriers" 
ON public.couriers 
FOR SELECT 
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role)
);

-- Add courier_id column to orders table
ALTER TABLE public.orders ADD COLUMN courier_id UUID REFERENCES public.couriers(id);

-- Create index for faster queries
CREATE INDEX idx_orders_courier_id ON public.orders(courier_id);

-- Function to update courier orders count
CREATE OR REPLACE FUNCTION public.update_courier_orders_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease old courier count
  IF OLD.courier_id IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.courier_id IS DISTINCT FROM NEW.courier_id) THEN
    UPDATE public.couriers 
    SET current_orders_count = GREATEST(0, current_orders_count - 1)
    WHERE id = OLD.courier_id;
  END IF;
  
  -- Increase new courier count for active orders
  IF NEW.courier_id IS NOT NULL AND NEW.status NOT IN ('delivered', 'cancelled') THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.courier_id IS DISTINCT FROM NEW.courier_id) THEN
      UPDATE public.couriers 
      SET current_orders_count = current_orders_count + 1
      WHERE id = NEW.courier_id;
    END IF;
  END IF;
  
  -- Decrease count when order is completed/cancelled
  IF TG_OP = 'UPDATE' AND NEW.status IN ('delivered', 'cancelled') AND OLD.status NOT IN ('delivered', 'cancelled') THEN
    IF NEW.courier_id IS NOT NULL THEN
      UPDATE public.couriers 
      SET current_orders_count = GREATEST(0, current_orders_count - 1)
      WHERE id = NEW.courier_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for courier orders count
CREATE TRIGGER on_order_courier_change
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_courier_orders_count();