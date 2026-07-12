-- Enable RLS for Orders if not already fully configured
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can insert an order (Guest checkout capability).
--    WITH CHECK is deliberately NOT `true` — see supabase/fix_orders_rls_security.sql
--    (2026-07-12): an unrestricted check here let a client insert a row with
--    payment_status: 'paid' directly, skipping Razorpay entirely. This
--    restricts a client-side insert to the states a checkout can legitimately
--    start in; payment_status can only become 'paid'/'failed', and
--    razorpay_order_id/razorpay_signature can only be attached, later via the
--    create-order / verify-payment Edge Functions (service-role key, bypasses RLS).
DO $$ BEGIN
    CREATE POLICY "Anyone can insert orders"
    ON orders FOR INSERT
    WITH CHECK (
      payment_status IN ('cod', 'created')
      AND razorpay_order_id IS NULL
      AND razorpay_signature IS NULL
    );
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
