-- Adds Razorpay online-payment support to the existing orders table.
-- Run manually in the Supabase SQL editor (this repo has no migration tool —
-- see supabase/setup_orders.sql, supabase/setup_admin_tables.sql for the
-- same manual-script convention).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_signature text;
