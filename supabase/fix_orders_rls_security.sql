-- SECURITY FIX — already applied directly to the live project via the Supabase
-- CLI (`supabase db query`) on 2026-07-12. Checked in here so a fresh copy of
-- this project ends up with the same protections and the fix is documented.
--
-- Two issues found while wiring up Razorpay online payments:
--
-- 1. "Public read orders" (USING (true)) let ANYONE with just the public anon
--    key read every row of `orders` — every customer's name, phone, email,
--    and address. Verified by querying /rest/v1/orders with only the anon
--    key and getting real customer data back. The existing
--    "Users can view their own orders" policy already covers legitimate
--    reads (own orders, or admin), so this one is just dropped.
--
-- 2. "Public insert orders" and "Anyone can insert orders" both had
--    WITH CHECK (true) — completely unrestricted. Combined with the anon
--    key, this let anyone insert a row with payment_status: 'paid' and a
--    fabricated payment_id directly, skipping Razorpay (and real payment)
--    entirely. It also let a client set razorpay_order_id directly at
--    insert time, which — combined with a replayed signature from a
--    different (e.g. much cheaper) real payment — could be used to mark an
--    unrelated order as paid. The fix restricts what a client-side INSERT
--    is allowed to set: payment_status can only start as 'cod' or
--    'created', and razorpay_order_id / razorpay_signature can only be
--    attached later, server-side, by the create-order / verify-payment
--    Edge Functions (which use the service-role key and bypass RLS).

DROP POLICY IF EXISTS "Public read orders" ON orders;
DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;

CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (
    payment_status IN ('cod', 'created')
    AND razorpay_order_id IS NULL
    AND razorpay_signature IS NULL
  );
