-- Ingredient narx tarixi jadvali
CREATE TABLE public.ingredient_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ingredient_price_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view price history" 
ON public.ingredient_price_history 
FOR SELECT 
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Admins can insert price history" 
ON public.ingredient_price_history 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Trigger: narx o'zgarganda tarixga yozish
CREATE OR REPLACE FUNCTION public.track_ingredient_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.cost_per_unit IS DISTINCT FROM NEW.cost_per_unit THEN
    INSERT INTO public.ingredient_price_history (ingredient_id, old_price, new_price, changed_by)
    VALUES (NEW.id, OLD.cost_per_unit, NEW.cost_per_unit, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER track_ingredient_price
BEFORE UPDATE ON public.ingredients
FOR EACH ROW
EXECUTE FUNCTION public.track_ingredient_price_change();

-- Inventarizatsiya jadvali
CREATE TABLE public.inventory_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  expected_quantity NUMERIC NOT NULL,
  actual_quantity NUMERIC NOT NULL,
  difference NUMERIC GENERATED ALWAYS AS (actual_quantity - expected_quantity) STORED,
  notes TEXT,
  counted_by UUID REFERENCES auth.users(id),
  counted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_applied BOOLEAN DEFAULT false
);

ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory counts" 
ON public.inventory_counts 
FOR ALL 
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- Low stock notification log
CREATE TABLE public.low_stock_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  current_stock NUMERIC NOT NULL,
  min_stock NUMERIC NOT NULL,
  notified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_type TEXT DEFAULT 'telegram'
);

ALTER TABLE public.low_stock_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications" 
ON public.low_stock_notifications 
FOR ALL 
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Index for better query performance
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at);
CREATE INDEX idx_stock_movements_movement_type ON public.stock_movements(movement_type);
CREATE INDEX idx_ingredient_price_history_ingredient ON public.ingredient_price_history(ingredient_id);
CREATE INDEX idx_inventory_counts_ingredient ON public.inventory_counts(ingredient_id);