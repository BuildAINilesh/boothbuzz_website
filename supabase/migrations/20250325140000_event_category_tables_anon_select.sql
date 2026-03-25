-- Public exhibitor registration uses the anon API key. These tables had SELECT only for
-- authenticated, so the browser received zero rows with no obvious error.
DROP POLICY IF EXISTS "Allow anon read event_categories" ON public.event_categories;
CREATE POLICY "Allow anon read event_categories"
  ON public.event_categories
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon read event_subcategories" ON public.event_subcategories;
CREATE POLICY "Allow anon read event_subcategories"
  ON public.event_subcategories
  FOR SELECT
  TO anon
  USING (true);
