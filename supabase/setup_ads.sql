-- Setup Ads and Offers Tables/Columns

-- 1. Add columns to products table for Section A
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sale_label text,
ADD COLUMN IF NOT EXISTS sale_active boolean DEFAULT false;

-- 2. Promotions table is already present from previous fixes, but recreating it cleanly here just in case.
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
