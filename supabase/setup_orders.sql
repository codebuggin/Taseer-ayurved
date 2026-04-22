-- Enable RLS for Orders if not already fully configured
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can insert an order (Guest checkout capability)
DO $$ BEGIN
    CREATE POLICY "Anyone can insert orders" 
    ON orders FOR INSERT 
    WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Users can view their own orders OR admins can view all
DO $$ BEGIN
    CREATE POLICY "Users can view own orders" 
    ON orders FOR SELECT 
    USING (
      auth.uid() = user_id 
      OR auth.jwt() ->> 'email' = 'admin@taseer.com'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Admin manage all orders (Update, Delete, Select)
DO $$ BEGIN
    CREATE POLICY "Admin manage all orders" 
    ON orders FOR ALL 
    USING (auth.jwt() ->> 'email' = 'admin@taseer.com');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
