# Razorpay Online Payments — Design

Date: 2026-07-12

## Context

Taseer Ayurved's checkout (`src/pages/CheckoutPage.jsx`) currently only supports Cash on Delivery — every order is inserted into the Supabase `orders` table with `payment_id: 'COD'`. The Razorpay npm package is installed but unused, and `supabase/functions/create-order/index.ts` exists only as an unfinished placeholder. The account has now been verified with Razorpay and the user wants online payments (card/UPI/netbanking/wallet) available as a second payment method alongside COD.

## Goals

- Let a customer pay online via Razorpay's Standard Checkout modal, without leaving the checkout page.
- Keep COD working exactly as it does today — this is additive, not a replacement.
- Never trust the browser for payment success — verify the Razorpay signature server-side before marking an order paid.
- Reuse existing patterns (Edge Functions, `orders` table, `send-invoice`) rather than introducing new infrastructure.

## Non-goals (this iteration)

- Razorpay webhook listener. Client-driven verification only; the rare "browser closes right after paying" edge case is a documented known gap, reconcilable manually via the Razorpay dashboard. Can be added later without reworking this design.
- Refunds/cancellation flows.
- Automated payment tests (repo has no test runner configured; verification is manual against Razorpay test mode).

## Architecture

Three pieces:

1. **`create-order` Edge Function** (rewrite of the existing placeholder) — takes a cart total, calls Razorpay's Orders API server-side using `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` (Supabase Edge Function secrets), returns a `razorpay_order_id`.
2. **`verify-payment` Edge Function** (new) — takes `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` from the frontend after checkout, recomputes the HMAC-SHA256 signature server-side with the Key Secret, and confirms it matches before the order can be marked paid.
3. **`CheckoutPage.jsx`** — loads Razorpay's `checkout.js`, enables the currently-disabled "Online Payment" radio option, and orchestrates the flow below.

The Key Secret never reaches the browser — it only lives in Supabase Edge Function secrets, exactly like the existing Edge Functions pattern.

## Data flow (online payment path)

1. Customer fills the delivery form, selects "Online Payment," submits.
2. Frontend inserts a row into `orders`: `status: 'pending'` (fulfillment, unchanged meaning), `payment_method: 'razorpay'`, `payment_status: 'created'`.
3. Frontend calls `create-order` with the server-trusted cart total (recomputed from `cartItems`, never taken as-is from the client for the actual charge amount). Gets back `razorpay_order_id`; this is saved onto the order row.
4. Razorpay Checkout modal opens using that order id; customer completes payment.
5. On success, Razorpay's callback hands the frontend `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`.
6. Frontend calls `verify-payment` with those three values.
   - **Valid signature** → order row updated: `payment_status: 'paid'`, `payment_id` set to the Razorpay payment id (reusing the existing column, keeping `order.payment_id || 'COD'` display logic in Admin/OrderHistory unchanged), `razorpay_signature` stored. Cart cleared, `send-invoice` fired (unchanged), redirect to `/order-success/:orderId`.
   - **Invalid signature** → order row updated: `payment_status: 'failed'`. Cart is preserved, customer sees an error and can retry.
7. If the customer closes the Razorpay modal without paying, the order row stays `payment_status: 'created'`, cart is preserved, customer can retry. A retry submits the form again, creating a fresh order row and a fresh Razorpay order — no reuse of a stale/abandoned Razorpay order id.

COD path is completely unchanged: `payment_method: 'cod'`, `payment_status: 'cod'`, `payment_id: 'COD'`.

## Schema changes

New SQL script at `supabase/setup_razorpay_payments.sql`, following the existing convention of manually-run scripts in that folder (e.g. `supabase/setup_orders.sql`) — no migration tool in this repo:

```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_signature text;
```

`payment_id` (existing column) and `status` (existing column, fulfillment state: pending/confirmed/shipped/delivered/cancelled) are unchanged in meaning.

## Error handling

- `create-order` recomputes the charge amount server-side from the `items` array sent (price × quantity per item, plus the same ₹500-free / ₹50-else shipping rule `CheckoutPage.jsx` already uses), so a tampered client-side `amount` field can't under-charge.
- `verify-payment` is the only path that can set `payment_status: 'paid'`. A signature mismatch always results in `'failed'`, never a silent pass-through.
- `orders` has row-level security (`supabase/setup_orders.sql`): only `admin@taseer.com` can UPDATE a row. `verify-payment` therefore uses the Supabase **service-role key** (auto-injected into every Edge Function as `SUPABASE_SERVICE_ROLE_KEY`, no extra secret to set) to bypass RLS and write the payment result — the anon key the frontend uses cannot perform this update directly, which is itself a safeguard against a client faking a "paid" status.
- Both Edge Functions return structured error JSON; the frontend surfaces a retry-capable error state (same `alert()`-based pattern the COD flow already uses) rather than losing the cart.

## Deployment

Requires the Supabase CLI linked to the project (not currently linked in this environment) and Razorpay API keys (not yet generated by the user). Both Edge Functions get deployed and secrets set via:

```bash
supabase link --project-ref <ref>
supabase secrets set RAZORPAY_KEY_ID=xxx RAZORPAY_KEY_SECRET=xxx
supabase functions deploy create-order
supabase functions deploy verify-payment
```

The `setup_razorpay_payments.sql` script is run manually against the Supabase project (SQL editor or CLI), matching how `setup_orders`-style scripts are already handled in this repo.

## Testing

Manual verification using Razorpay test-mode keys and their published test card/UPI numbers: place a test online order, confirm success path (`paid`, invoice fires, redirect), confirm a deliberately-failed test payment lands in `failed` with cart intact, confirm COD path is unaffected.
