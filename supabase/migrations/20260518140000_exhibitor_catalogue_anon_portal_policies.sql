-- Exhibitor portal uses the anon API key (dev OTP login has no auth.uid()).
-- Existing policies require auth.uid() = exhibitors.user_id → INSERT returns 401.
-- These policies allow anon CRUD when exhibitor_id is a valid exhibitor (portal pattern).

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exhibitor_catalogue_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exhibitor_catalogue_products TO authenticated;

CREATE POLICY "Portal anon read catalogue products"
  ON public.exhibitor_catalogue_products
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors e
      WHERE e.id = exhibitor_catalogue_products.exhibitor_id
    )
  );

CREATE POLICY "Portal anon insert catalogue products"
  ON public.exhibitor_catalogue_products
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exhibitors e
      WHERE e.id = exhibitor_catalogue_products.exhibitor_id
    )
  );

CREATE POLICY "Portal anon update catalogue products"
  ON public.exhibitor_catalogue_products
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors e
      WHERE e.id = exhibitor_catalogue_products.exhibitor_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exhibitors e
      WHERE e.id = exhibitor_catalogue_products.exhibitor_id
    )
  );

CREATE POLICY "Portal anon delete catalogue products"
  ON public.exhibitor_catalogue_products
  FOR DELETE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors e
      WHERE e.id = exhibitor_catalogue_products.exhibitor_id
    )
  );
