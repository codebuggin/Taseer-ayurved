-- PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS promotions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message text NOT NULL,
  is_active boolean DEFAULT false,
  bg_color text DEFAULT '#0d5c3a',
  text_color text DEFAULT '#ffffff',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public read active promotions" ON promotions FOR SELECT USING (is_active = true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admin manage promotions" ON promotions FOR ALL USING (auth.jwt() ->> 'email' = 'admin@taseer.com');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- TESTIMONIAL VIDEOS STORAGE
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonial-videos', 'testimonial-videos', true)
ON CONFLICT DO NOTHING;

DO $$ BEGIN
    CREATE POLICY "Public read testimonial videos" ON storage.objects FOR SELECT USING (bucket_id = 'testimonial-videos');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admin upload testimonial videos" ON storage.objects FOR INSERT WITH CHECK (
        bucket_id = 'testimonial-videos' AND auth.jwt() ->> 'email' = 'admin@taseer.com'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
