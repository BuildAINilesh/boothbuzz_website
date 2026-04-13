-- Layout / floor-plan images for event detail gallery (separate from cover event_image_url).
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS layout_image_url TEXT;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS layout_image_urls TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.events.layout_image_url IS 'Single layout/floor-plan image URL (optional; merged with layout_image_urls in app)';
COMMENT ON COLUMN public.events.layout_image_urls IS 'Additional layout / venue map image URLs';
