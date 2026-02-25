-- Add event_image_url column to events table if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_image_url TEXT;

-- Add some sample event images (optional - you can update these with your own images)
UPDATE events 
SET event_image_url = CASE 
  WHEN title ILIKE '%food%' OR title ILIKE '%carnival%' THEN 'https://images.pexels.com/photos/753969/pexels-photo-753969.jpeg?auto=compress&cs=tinysrgb&w=800'
  WHEN title ILIKE '%tech%' OR title ILIKE '%innovation%' THEN 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800'
  WHEN title ILIKE '%health%' OR title ILIKE '%wellness%' THEN 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=800'
  WHEN title ILIKE '%cultural%' OR title ILIKE '%festival%' THEN 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800'
  WHEN title ILIKE '%art%' OR title ILIKE '%craft%' THEN 'https://images.pexels.com/photos/135620/pexels-photo-135620.jpeg?auto=compress&cs=tinysrgb&w=800'
  ELSE 'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop'
END
WHERE event_image_url IS NULL;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'event_image_url'; 