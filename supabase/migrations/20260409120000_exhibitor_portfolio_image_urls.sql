-- Portfolio hero image + general uploaded photo gallery for exhibitors (public site).
ALTER TABLE public.exhibitors
ADD COLUMN IF NOT EXISTS portfolio_image_url TEXT;

ALTER TABLE public.exhibitors
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.exhibitors.portfolio_image_url IS 'Primary portfolio / showcase image URL for exhibitor cards';
COMMENT ON COLUMN public.exhibitors.image_urls IS 'Additional uploaded photo URLs for exhibitor detail gallery';
