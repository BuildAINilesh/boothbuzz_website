-- Website ads repository for section-wise, scrollable image/video creatives.
CREATE TABLE IF NOT EXISTS public.website_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL,
  title TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT,
  cta_text TEXT,
  cta_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS website_ads_section_active_sort_idx
  ON public.website_ads (section_key, is_active, sort_order, created_at);

ALTER TABLE public.website_ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read active website ads" ON public.website_ads;
CREATE POLICY "Allow public read active website ads"
  ON public.website_ads
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Seed 3 ads per section only when table is empty.
INSERT INTO public.website_ads
  (section_key, title, media_url, media_type, thumbnail_url, cta_text, cta_url, sort_order, is_active)
SELECT *
FROM (
  VALUES
    ('home_banner', 'Festival Stalls Launch', 'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=1200', 'image', NULL, 'Explore events', '#events', 1, true),
    ('home_banner', 'Craft Showcase Weekend', 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1200', 'image', NULL, 'Join now', '#exhibitors', 2, true),
    ('home_banner', 'Community Exhibition Highlights', 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200', 'image', NULL, 'View gallery', '#gallery', 3, true),

    ('upcoming_events', 'Upcoming Mega Expo', 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=1200', 'image', NULL, 'View details', '#events', 1, true),
    ('upcoming_events', 'Sponsor Spotlight Reel', 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', 'video', 'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Become sponsor', '#contact', 2, true),
    ('upcoming_events', 'Local Brands Connect', 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1200', 'image', NULL, 'Register booth', '#exhibitors', 3, true),

    ('past_events', 'Past Event Moments', 'https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg?auto=compress&cs=tinysrgb&w=1200', 'image', NULL, 'See highlights', '#gallery', 1, true),
    ('past_events', 'Customer Footfall Success', 'https://images.pexels.com/photos/787961/pexels-photo-787961.jpeg?auto=compress&cs=tinysrgb&w=1200', 'image', NULL, 'Plan your event', '#contact', 2, true),
    ('past_events', 'Exhibitor Success Stories', 'https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg?auto=compress&cs=tinysrgb&w=1200', 'image', NULL, 'Become exhibitor', '#exhibitors', 3, true),

    ('our_exhibitors', 'Handmade Decor Portfolio', 'https://images.pexels.com/photos/5709650/pexels-photo-5709650.jpeg?auto=compress&cs=tinysrgb&w=1200', 'image', NULL, 'Meet exhibitors', '#exhibitors', 1, true),
    ('our_exhibitors', 'Product Demo Reel', 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', 'video', 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Book a slot', '#exhibitors', 2, true),
    ('our_exhibitors', 'Fashion & Lifestyle Booths', 'https://images.pexels.com/photos/5872361/pexels-photo-5872361.jpeg?auto=compress&cs=tinysrgb&w=1200', 'image', NULL, 'View all exhibitors', '#exhibitors', 3, true),

    ('bottom_ads', 'Partner With BoothBuzz', 'https://images.pexels.com/photos/3182787/pexels-photo-3182787.jpeg?auto=compress&cs=tinysrgb&w=1200', 'image', NULL, 'Contact team', '#contact', 1, true),
    ('bottom_ads', 'Event Promo Video', 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4', 'video', 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Start campaign', '#contact', 2, true),
    ('bottom_ads', 'Book Next Season Ads', 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200', 'image', NULL, 'Advertise now', '#contact', 3, true)
) AS seed(section_key, title, media_url, media_type, thumbnail_url, cta_text, cta_url, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.website_ads LIMIT 1);
