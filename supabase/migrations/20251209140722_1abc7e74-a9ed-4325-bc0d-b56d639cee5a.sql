-- Create ingredients table (Xom ashyolar)
CREATE TABLE public.ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_uz TEXT,
  unit TEXT NOT NULL DEFAULT 'kg', -- kg, litr, dona, g, ml
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  expiry_alert_days INTEGER DEFAULT 7,
  category TEXT, -- go'sht, sabzavot, sous, non, ichimlik, qadoq
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers table (Yetkazib beruvchilar)
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock movements table (Ombor harakatlari)
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- 'in' (kirim), 'out' (chiqim), 'adjustment' (tuzatish), 'waste' (isrof)
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  supplier_id UUID REFERENCES public.suppliers(id),
  expiry_date DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_ingredients table (Mahsulot-Ingredient bog'lanishi)
CREATE TABLE public.product_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_needed NUMERIC NOT NULL DEFAULT 1,
  UNIQUE(product_id, ingredient_id)
);

-- Enable RLS
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ingredients
CREATE POLICY "Ingredients are publicly readable"
ON public.ingredients FOR SELECT USING (true);

CREATE POLICY "Admins can manage ingredients"
ON public.ingredients FOR ALL
USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'operator'));

-- RLS Policies for suppliers
CREATE POLICY "Suppliers are publicly readable"
ON public.suppliers FOR SELECT USING (true);

CREATE POLICY "Admins can manage suppliers"
ON public.suppliers FOR ALL
USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies for stock_movements
CREATE POLICY "Stock movements are viewable by admins"
ON public.stock_movements FOR SELECT
USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'operator'));

CREATE POLICY "Admins can manage stock movements"
ON public.stock_movements FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'operator'));

CREATE POLICY "Admins can update stock movements"
ON public.stock_movements FOR UPDATE
USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can delete stock movements"
ON public.stock_movements FOR DELETE
USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies for product_ingredients
CREATE POLICY "Product ingredients are publicly readable"
ON public.product_ingredients FOR SELECT USING (true);

CREATE POLICY "Admins can manage product ingredients"
ON public.product_ingredients FOR ALL
USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'manager'));

-- Create function to update ingredient stock
CREATE OR REPLACE FUNCTION public.update_ingredient_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.movement_type = 'in' THEN
    UPDATE public.ingredients 
    SET current_stock = current_stock + NEW.quantity,
        cost_per_unit = COALESCE(NEW.unit_cost, cost_per_unit),
        updated_at = now()
    WHERE id = NEW.ingredient_id;
  ELSIF NEW.movement_type IN ('out', 'waste') THEN
    UPDATE public.ingredients 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.ingredient_id;
  ELSIF NEW.movement_type = 'adjustment' THEN
    UPDATE public.ingredients 
    SET current_stock = NEW.quantity,
        updated_at = now()
    WHERE id = NEW.ingredient_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for automatic stock update
CREATE TRIGGER on_stock_movement_insert
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ingredient_stock();

-- Create function to deduct ingredients when order is placed
CREATE OR REPLACE FUNCTION public.deduct_ingredients_for_order(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_item RECORD;
  ingredient_rec RECORD;
BEGIN
  -- Loop through order items
  FOR order_item IN 
    SELECT oi.product_id, oi.quantity 
    FROM public.order_items oi 
    WHERE oi.order_id = p_order_id
  LOOP
    -- Deduct ingredients for each product
    FOR ingredient_rec IN
      SELECT pi.ingredient_id, pi.quantity_needed * order_item.quantity as total_qty
      FROM public.product_ingredients pi
      WHERE pi.product_id = order_item.product_id
    LOOP
      INSERT INTO public.stock_movements (
        ingredient_id, 
        movement_type, 
        quantity, 
        notes
      ) VALUES (
        ingredient_rec.ingredient_id,
        'out',
        ingredient_rec.total_qty,
        'Buyurtma: ' || p_order_id::text
      );
    END LOOP;
  END LOOP;
END;
$$;