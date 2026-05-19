-- Exhibitor product catalogue: sellable items linked to an exhibitor.
-- Portal CRUD requires exhibitors.user_id = auth.uid() (see RLS below).
-- Dev OTP login without Supabase Auth cannot write until user_id is linked.

CREATE TABLE IF NOT EXISTS public.exhibitor_catalogue_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id UUID NOT NULL REFERENCES public.exhibitors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(12, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  description TEXT,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  sku TEXT,
  category TEXT,
  unit TEXT,
  stock_quantity INTEGER CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalogue_products_exhibitor_id
  ON public.exhibitor_catalogue_products(exhibitor_id);

CREATE INDEX IF NOT EXISTS idx_catalogue_products_exhibitor_active
  ON public.exhibitor_catalogue_products(exhibitor_id, is_active)
  WHERE is_active = true;

COMMENT ON TABLE public.exhibitor_catalogue_products IS 'Sellable products per exhibitor for future customer storefront';

CREATE TRIGGER update_exhibitor_catalogue_products_updated_at
  BEFORE UPDATE ON public.exhibitor_catalogue_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.exhibitor_catalogue_products ENABLE ROW LEVEL SECURITY;

-- Future customer browsing: active products only
CREATE POLICY "Public read active catalogue products"
  ON public.exhibitor_catalogue_products
  FOR SELECT
  USING (is_active = true);

-- Exhibitor portal: full access to own products (including drafts / inactive)
CREATE POLICY "Exhibitor can view own catalogue products"
  ON public.exhibitor_catalogue_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors e
      WHERE e.id = exhibitor_catalogue_products.exhibitor_id
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Exhibitor can insert own catalogue products"
  ON public.exhibitor_catalogue_products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exhibitors e
      WHERE e.id = exhibitor_catalogue_products.exhibitor_id
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Exhibitor can update own catalogue products"
  ON public.exhibitor_catalogue_products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors e
      WHERE e.id = exhibitor_catalogue_products.exhibitor_id
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Exhibitor can delete own catalogue products"
  ON public.exhibitor_catalogue_products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors e
      WHERE e.id = exhibitor_catalogue_products.exhibitor_id
        AND e.user_id = auth.uid()
    )
  );
