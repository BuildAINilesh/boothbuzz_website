-- Customer orders from exhibitor catalogue (single exhibitor per cart).

CREATE TABLE IF NOT EXISTS public.exhibitor_customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id UUID NOT NULL REFERENCES public.exhibitors(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('exhibition_pickup', 'home_delivery')),
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_pincode TEXT,
  delivery_notes TEXT,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  payment_status TEXT NOT NULL DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'placed',
  customer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_orders_exhibitor_id
  ON public.exhibitor_customer_orders(exhibitor_id);

CREATE INDEX IF NOT EXISTS idx_customer_orders_created_at
  ON public.exhibitor_customer_orders(exhibitor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.exhibitor_customer_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.exhibitor_customer_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.exhibitor_catalogue_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_size TEXT,
  unit TEXT,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_order_items_order_id
  ON public.exhibitor_customer_order_items(order_id);

CREATE TRIGGER update_exhibitor_customer_orders_updated_at
  BEFORE UPDATE ON public.exhibitor_customer_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.exhibitor_customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibitor_customer_order_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.exhibitor_customer_orders TO anon, authenticated;
GRANT SELECT, INSERT ON public.exhibitor_customer_order_items TO anon, authenticated;

-- Website checkout (anon): place order for a valid exhibitor
CREATE POLICY "Public insert customer orders"
  ON public.exhibitor_customer_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.exhibitors e WHERE e.id = exhibitor_id)
  );

CREATE POLICY "Public insert customer order items"
  ON public.exhibitor_customer_order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exhibitor_customer_orders o
      WHERE o.id = order_id
    )
  );

-- Exhibitor portal (anon): list and update own exhibitor orders
CREATE POLICY "Portal anon read customer orders"
  ON public.exhibitor_customer_orders
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exhibitors e WHERE e.id = exhibitor_customer_orders.exhibitor_id)
  );

CREATE POLICY "Portal anon update customer orders"
  ON public.exhibitor_customer_orders
  FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.exhibitors e WHERE e.id = exhibitor_customer_orders.exhibitor_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.exhibitors e WHERE e.id = exhibitor_customer_orders.exhibitor_id)
  );

CREATE POLICY "Portal anon read customer order items"
  ON public.exhibitor_customer_order_items
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitor_customer_orders o
      WHERE o.id = exhibitor_customer_order_items.order_id
    )
  );

-- Authenticated exhibitor (when linked via user_id)
CREATE POLICY "Exhibitor read own customer orders"
  ON public.exhibitor_customer_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors e
      WHERE e.id = exhibitor_customer_orders.exhibitor_id
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Exhibitor update own customer orders"
  ON public.exhibitor_customer_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors e
      WHERE e.id = exhibitor_customer_orders.exhibitor_id
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Exhibitor read own customer order items"
  ON public.exhibitor_customer_order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitor_customer_orders o
      JOIN public.exhibitors e ON e.id = o.exhibitor_id
      WHERE o.id = exhibitor_customer_order_items.order_id
        AND e.user_id = auth.uid()
    )
  );
