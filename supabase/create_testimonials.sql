-- 1. Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name text NOT NULL,
  condition_treated text,
  video_url text,
  thumbnail_url text,
  description text,
  language text DEFAULT 'hindi',
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Create storage bucket for testimonial-videos
--    Skip if already exists or run via dashboard "Storage" UI if this fails.
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonial-videos', 'testimonial-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed first testimonial using local path
INSERT INTO testimonials (
  patient_name, 
  condition_treated, 
  video_url, 
  language, 
  is_featured, 
  is_active, 
  description
) VALUES (
  'Grateful Patient',
  'Infertility — Son Born by Allah Grace',
  '/videos/WhatsApp Video 2026-03-10 at 3.32.29 PM.mp4',
  'hindi',
  true,
  true,
  'Before: "Beta paida hoga insha allah"
(Son will be born, God willing)
After: "Beta paida hua alhamdulillah"
(Son was born, praise be to Allah)

Hopeless hearts wish for a son was fulfilled.
Alhamdulillah, a son was born exactly as foretold.
All those who wish to grow their family —
get treated at Taseer Ayurved.
True Ayurveda is Taseer Ayurved.
Contact: 7405410856.
Please share so others may also benefit.'
);
