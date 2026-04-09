-- Client testimonials (Gallery "What clients say" section)
-- Columns align with Supabase dashboard: content, author_name, author_title, is_published, avatar_url.

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_title TEXT,
  image_url TEXT,
  avatar_url TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_sort_order ON public.testimonials (sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON public.testimonials (is_published) WHERE is_published = true;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read testimonials" ON public.testimonials;
CREATE POLICY "Allow public read testimonials"
  ON public.testimonials
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Seed (idempotent-ish: only if table empty)
INSERT INTO public.testimonials (content, author_name, author_title, image_url, rating, sort_order, is_published)
SELECT v.content, v.author_name, v.author_title, v.image_url, v.rating, v.sort_order, true
FROM (
  VALUES
    ($q$BoothBuzz transformed our society's parking area into a vibrant marketplace. Flawless organization and overwhelming community response.$q$, 'Priya Sharma', 'Society Secretary, Sunrise Apartments', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 5, 1),
    ($q$As a home baker, this exhibition gave me the perfect platform. I received 50+ orders and made wonderful connections.$q$, 'Meera Patel', 'Home Baker & Exhibitor', 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 5, 2),
    ($q$The art exhibition brought our community together like never before. Well-organized and incredibly supportive team.$q$, 'Rajesh Kumar', 'Resident, Green Valley Society', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 5, 3),
    ($q$Our jewelry exhibition was a huge success. We sold 80% of inventory and gained many new customers.$q$, 'Anita Desai', 'Jewelry Designer, Sparkle Creations', 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 5, 4),
    ($q$The food festival was phenomenal. Our restaurant gained 100+ new regular customers from this single event.$q$, 'Chef Vikram Singh', 'Owner, Spice Garden Restaurant', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 5, 5)
) AS v(content, author_name, author_title, image_url, rating, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.testimonials LIMIT 1);
