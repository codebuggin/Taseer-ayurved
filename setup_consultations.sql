-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS consultations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  concern text,
  message text NOT NULL,
  status text DEFAULT 'pending',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Ensure all requested columns exist if table already existed
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS concern text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Enable RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin read consultations" ON consultations;
DROP POLICY IF EXISTS "Public insert consultations" ON consultations;

-- Create Policies
CREATE POLICY "Admin read consultations" 
ON consultations
FOR SELECT 
USING (auth.jwt() ->> 'email' = 'admin@taseer.com');

-- Admin needs update access to mark rows as read/resolved
DROP POLICY IF EXISTS "Admin update consultations" ON consultations;
CREATE POLICY "Admin update consultations"
ON consultations
FOR UPDATE
USING (auth.jwt() ->> 'email' = 'admin@taseer.com');

-- Admin needs delete access to permanently remove spam or old consultations
DROP POLICY IF EXISTS "Admin delete consultations" ON consultations;
CREATE POLICY "Admin delete consultations"
ON consultations
FOR DELETE
USING (auth.jwt() ->> 'email' = 'admin@taseer.com');

CREATE POLICY "Public insert consultations"
ON consultations
FOR INSERT
WITH CHECK (true);
