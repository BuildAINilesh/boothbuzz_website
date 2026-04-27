-- Link exhibitors with Supabase Auth users and enable exhibitor self-service portal access.
ALTER TABLE public.exhibitors
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_exhibitors_user_id_unique
ON public.exhibitors(user_id)
WHERE user_id IS NOT NULL;

-- Exhibitors: only own profile.
DROP POLICY IF EXISTS "Exhibitor can view own profile" ON public.exhibitors;
CREATE POLICY "Exhibitor can view own profile"
ON public.exhibitors
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Exhibitor can update own profile" ON public.exhibitors;
CREATE POLICY "Exhibitor can update own profile"
ON public.exhibitors
FOR UPDATE
USING (auth.uid() = user_id);

-- Event registrations: exhibitors can read and insert only their own rows.
DROP POLICY IF EXISTS "Exhibitor can view own registrations" ON public.event_registrations;
CREATE POLICY "Exhibitor can view own registrations"
ON public.event_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.exhibitors e
    WHERE e.id = event_registrations.exhibitor_id
      AND e.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Exhibitor can insert own registrations" ON public.event_registrations;
CREATE POLICY "Exhibitor can insert own registrations"
ON public.event_registrations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.exhibitors e
    WHERE e.id = event_registrations.exhibitor_id
      AND e.user_id = auth.uid()
  )
);
