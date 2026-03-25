-- Store multiple sub-categories selected by exhibitor registration form.
ALTER TABLE public.exhibitors
ADD COLUMN IF NOT EXISTS sub_categories TEXT[] DEFAULT '{}'::text[];
