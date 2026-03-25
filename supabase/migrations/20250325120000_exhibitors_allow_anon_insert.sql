-- Public exhibitor form uses the anon key (no login). If INSERT is only allowed for
-- `authenticated`, registration fails with: new row violates row-level security policy.
-- This policy explicitly allows anonymous self-registration.

DROP POLICY IF EXISTS "Allow anon insert for exhibitor registration" ON public.exhibitors;

CREATE POLICY "Allow anon insert for exhibitor registration"
  ON public.exhibitors
  FOR INSERT
  TO anon
  WITH CHECK (true);
