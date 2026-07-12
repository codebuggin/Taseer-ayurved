# Razorpay Online Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Razorpay online payment (card/UPI/netbanking/wallet) as a second checkout option alongside the existing Cash on Delivery flow, with server-side signature verification before any order is marked paid.

**Architecture:** Razorpay Standard Checkout modal on `CheckoutPage.jsx`, backed by two Supabase Edge Functions — `create-order` (creates the Razorpay order, recomputing the charge amount server-side) and `verify-payment` (recomputes and checks the HMAC signature, then writes the paid/failed result using the service-role key, since `orders` RLS blocks anon UPDATEs).

**Tech Stack:** React 19 (existing `CheckoutPage.jsx`), Supabase Edge Functions (Deno), Razorpay Orders API + Standard Checkout (`checkout.js`), Supabase JS client (`@supabase/supabase-js` via esm.sh in Edge Functions).

**Spec:** `docs/superpowers/specs/2026-07-12-razorpay-online-payments-design.md`

## Global Constraints

- `RAZORPAY_KEY_SECRET` must never reach the browser — only `RAZORPAY_KEY_ID` (public) is ever returned to the frontend.
- The COD flow must keep working exactly as it does today — this is additive only.
- `orders` row-level security (`supabase/setup_orders.sql`) only allows `admin@taseer.com` to UPDATE a row. Any write to an `orders` row after the initial customer INSERT (setting `razorpay_order_id`, `payment_status`, `payment_id`, `razorpay_signature`) must happen inside an Edge Function using the Supabase **service-role key** (auto-injected into every Edge Function as `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_URL` — no extra secret needs to be set for this), never from the browser's anon-key client.
- Shipping rule used everywhere amount is computed: subtotal > ₹500 → free shipping; else ₹50 flat. This must match `CheckoutPage.jsx`'s existing `shippingCost` logic exactly.
- No automated test runner exists in this repo (Playwright is installed but not wired up — see `CLAUDE.md`). Every task is verified manually (curl for Edge Functions, browser + `npm run build`/`npm run lint` for the frontend), not with a test suite.
- This project is not a git repository (`git status` fails with "not a git repository"). Skip all `git add`/`git commit` steps — mark each task's final step as "done" once verified instead.
- No Razorpay API keys exist yet and the Supabase CLI is not linked in this environment. Tasks that need deployment or live keys end with a manual runbook step for the user to run themselves; they are not executed by the implementer.

---

## Task 1: Add payment columns to the `orders` table

**Files:**
- Create: `supabase/setup_razorpay_payments.sql`

**Interfaces:**
- Produces: `orders.payment_method` (text, default `'cod'`), `orders.payment_status` (text, default `'cod'`), `orders.razorpay_order_id` (text, nullable), `orders.razorpay_signature` (text, nullable). All later tasks read/write these exact column names.

- [ ] **Step 1: Write the SQL script**

```sql
-- Adds Razorpay online-payment support to the existing orders table.
-- Run manually in the Supabase SQL editor (this repo has no migration tool —
-- see supabase/setup_orders.sql, supabase/setup_admin_tables.sql for the
-- same manual-script convention).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_signature text;
```

- [ ] **Step 2: Verify the file**

Run: `cat supabase/setup_razorpay_payments.sql`
Expected: the exact SQL above, no syntax errors (four `ADD COLUMN IF NOT EXISTS` clauses on one `ALTER TABLE`).

- [ ] **Step 3: Manual runbook note for the user (not run by the implementer)**

Tell the user: "Run `supabase/setup_razorpay_payments.sql` in your Supabase project's SQL editor (or `supabase db execute -f supabase/setup_razorpay_payments.sql` once the CLI is linked) before testing the checkout flow. No existing RLS policy changes are needed — the two Edge Functions in Tasks 2 and 3 use the service-role key, which bypasses RLS entirely."

- [ ] **Step 4: Mark task done**

No git commit (no git repository in this project). This task is complete once Step 2's output matches.

---

## Task 2: Rewrite `create-order` to create a real Razorpay order and recompute the amount server-side

**Files:**
- Modify: `supabase/functions/create-order/index.ts` (currently a placeholder that accepts `{ amount, currency, receipt }` and trusts the client-supplied `amount` directly — this task replaces that trust with a server-side recompute and wires it to the `orders` table)

**Interfaces:**
- Consumes: `orders` table from Task 1 (`razorpay_order_id` column).
- Produces: HTTP endpoint `create-order` accepting `POST { order_id: string, items: { price: number, quantity: number }[], receipt?: string }`, returning `200 { razorpay_order_id: string, amount: number, currency: string, key_id: string }` on success or `400 { error: string }` on failure. `amount` is in paise (Razorpay's unit). `key_id` is the public Razorpay Key ID — safe to send to the browser. Task 5 (CheckoutPage) calls this exact shape.

- [ ] **Step 1: Write the new Edge Function**

Replace the full contents of `supabase/functions/create-order/index.ts` with:

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, items, receipt } = await req.json()

    if (!order_id || !Array.isArray(items) || items.length === 0) {
      throw new Error('order_id and a non-empty items array are required')
    }

    // Recompute the charge amount server-side — never trust a client-supplied total.
    // Matches the shipping rule in src/pages/CheckoutPage.jsx: free above ₹500, else ₹50.
    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + (Number(item.price) * Number(item.quantity))
    }, 0)
    const shipping = subtotal > 500 ? 0 : 50
    const total = subtotal + shipping

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !keySecret) {
      throw new Error('Razorpay keys not configured in Edge Function secrets.')
    }

    const auth = btoa(`${keyId}:${keySecret}`)
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(total * 100), // Razorpay expects amount in paise
        currency: 'INR',
        receipt: receipt || order_id
      })
    })

    const orderData = await rzpResponse.json()

    if (!rzpResponse.ok) {
      throw new Error(orderData.error?.description || 'Failed to create Razorpay order')
    }

    // Persist the Razorpay order id on the pending Supabase order row.
    // orders' RLS only allows admin UPDATEs, so this uses the service-role key.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { error: updateError } = await supabase
      .from('orders')
      .update({ razorpay_order_id: orderData.id })
      .eq('id', order_id)

    if (updateError) {
      throw new Error(`Failed to save Razorpay order id: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({
        razorpay_order_id: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        key_id: keyId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

- [ ] **Step 2: Verify the file compiles as valid TypeScript/Deno syntax**

Run: `npx -y tsc --noEmit --target es2022 --module esnext --moduleResolution bundler supabase/functions/create-order/index.ts 2>&1 | grep -v "Cannot find module\|Cannot find name 'Deno'" || true`
Expected: no output other than the filtered-out remote-URL-import and `Deno` global errors (those are expected outside a Deno runtime — this check is only catching real syntax mistakes).

- [ ] **Step 3: Manual runbook note for the user (not run by the implementer)**

Tell the user, once they have Razorpay test keys and the CLI linked:

```bash
supabase link --project-ref <your-project-ref>
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxx RAZORPAY_KEY_SECRET=xxxxx
supabase functions deploy create-order
```

Then test it directly:

```bash
curl -X POST 'https://<project-ref>.supabase.co/functions/v1/create-order' \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"order_id":"<an existing pending order id>","items":[{"price":600,"quantity":1}]}'
```

Expected response: `{"razorpay_order_id":"order_...","amount":65000,"currency":"INR","key_id":"rzp_test_..."}` (600 subtotal + 50 shipping = 650 → 65000 paise), and the referenced `orders` row now has `razorpay_order_id` populated when queried in the Supabase table editor.

- [ ] **Step 4: Mark task done**

No git commit (no git repository in this project).

---

## Task 3: Add `verify-payment` Edge Function for server-side signature verification

**Files:**
- Create: `supabase/functions/verify-payment/index.ts`

**Interfaces:**
- Consumes: `orders` table from Task 1.
- Produces: HTTP endpoint `verify-payment` accepting `POST { order_id: string, razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }`, returning `200 { verified: true }` and updating the order row to `payment_status: 'paid', payment_id: <razorpay_payment_id>, razorpay_signature: <signature>` on a valid signature, or `400 { verified: false, error?: string }` and updating the order row to `payment_status: 'failed'` on an invalid one. Task 5 (CheckoutPage) calls this exact shape after the Razorpay modal reports success.

- [ ] **Step 1: Write the Edge Function**

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

async function computeSignature(orderId: string, paymentId: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(`${orderId}|${paymentId}`))
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('order_id, razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required')
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keySecret) {
      throw new Error('Razorpay key secret not configured in Edge Function secrets.')
    }

    const expectedSignature = await computeSignature(razorpay_order_id, razorpay_payment_id, keySecret)
    const verified = expectedSignature === razorpay_signature

    // orders' RLS only allows admin UPDATEs, so this uses the service-role key.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: updateError } = await supabase
      .from('orders')
      .update(
        verified
          ? { payment_status: 'paid', payment_id: razorpay_payment_id, razorpay_signature }
          : { payment_status: 'failed' }
      )
      .eq('id', order_id)

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ verified }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: verified ? 200 : 400 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, verified: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

- [ ] **Step 2: Verify the file compiles as valid TypeScript/Deno syntax**

Run: `npx -y tsc --noEmit --target es2022 --module esnext --moduleResolution bundler supabase/functions/verify-payment/index.ts 2>&1 | grep -v "Cannot find module\|Cannot find name 'Deno'\|Cannot find name 'crypto'" || true`
Expected: no output other than the filtered-out remote-URL-import, `Deno`, and `crypto` global errors (expected outside a Deno runtime).

- [ ] **Step 3: Manual runbook note for the user (not run by the implementer)**

Tell the user, after deploying (`supabase functions deploy verify-payment`), to sanity-check the signature math with a local Node one-liner before testing against the live function:

```bash
node -e "
const crypto = require('crypto');
const orderId = 'order_test123';
const paymentId = 'pay_test456';
const secret = 'your_test_key_secret';
const sig = crypto.createHmac('sha256', secret).update(orderId + '|' + paymentId).digest('hex');
console.log(sig);
"
```

Then call the deployed function with that same `orderId`/`paymentId`/`sig` (and a real pending `order_id` from the `orders` table) and confirm it returns `{"verified":true}` and the order row's `payment_status` becomes `paid`. Calling it again with a deliberately wrong `razorpay_signature` should return `400 {"verified":false}` and set `payment_status` to `failed`.

- [ ] **Step 4: Mark task done**

No git commit (no git repository in this project).

---

## Task 4: Load Razorpay's Checkout script

**Files:**
- Modify: `index.html:12` (immediately after the Google Fonts `<link>` tags, before `</head>`)

**Interfaces:**
- Produces: global `window.Razorpay` constructor, available on every page once the script loads. Task 5 (CheckoutPage) depends on `window.Razorpay` existing before opening the payment modal.

- [ ] **Step 1: Add the script tag**

In `index.html`, change:

```html
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
  </head>
```

to:

```html
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">

    <!-- Razorpay Standard Checkout -->
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
```

- [ ] **Step 2: Verify**

Run: `grep -n "checkout.razorpay.com" index.html`
Expected: `12:    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>` (line number may differ slightly, content must match).

**Note on Subresource Integrity:** deliberately no `integrity="sha384-..."` on this tag. Razorpay updates `checkout.js`'s contents periodically (security patches, new payment methods) without versioning the URL, and does not publish an SRI hash for it — pinning one would break checkout silently the next time Razorpay updates the file. This is a documented exception, not an oversight.

- [ ] **Step 3: Mark task done**

No git commit (no git repository in this project).

---

## Task 5: Wire online payment into `CheckoutPage.jsx`

**Files:**
- Modify: `src/pages/CheckoutPage.jsx`

**Interfaces:**
- Consumes: `create-order` from Task 2 (`{ razorpay_order_id, amount, currency, key_id }`), `verify-payment` from Task 3 (`{ verified }`), `window.Razorpay` from Task 4, `orders.payment_method`/`payment_status` columns from Task 1.
- Produces: none consumed by later tasks (this is the UI endpoint of the flow).

- [ ] **Step 1: Add payment-method state**

In `src/pages/CheckoutPage.jsx`, change:

```jsx
  const [placing, setPlacing] = useState(false);
```

to:

```jsx
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
```

- [ ] **Step 2: Replace `handlePlaceOrder` and add the two new flow functions**

Replace the entire `handlePlaceOrder` function (from `const handlePlaceOrder = async (e) => {` through its closing `};`) with:

```jsx
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) return;

    if (!formData.name || !formData.phone || !formData.address1 || !formData.city || !formData.state || !formData.pincode) {
      alert('Please fill all required fields');
      return;
    }

    if (formData.phone.length !== 10) {
      alert('Enter valid 10-digit phone number');
      return;
    }

    if (formData.pincode.length !== 6) {
      alert('Enter valid 6-digit pincode');
      return;
    }

    setPlacing(true);

    const fullAddress = formData.address2 ? `${formData.address1}, ${formData.address2}` : formData.address1;

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          items: cartItems,
          total: finalTotal,
          status: 'pending',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: fullAddress,
          city: formData.city,
          pincode: formData.pincode,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'cod' : 'created',
          payment_id: paymentMethod === 'cod' ? 'COD' : null
        })
        .select()
        .single();

      if (error) {
        console.error('Order Insert Error details:', error);
        setPlacing(false);
        setTimeout(() => alert(`Order placement failed: ${error.message}. Please try again or contact support.`), 10);
        return;
      }

      if (paymentMethod === 'cod') {
        await finalizeOrder(data, fullAddress);
      } else {
        await startRazorpayPayment(data, fullAddress);
      }
    } catch (err) {
      console.error('Unexpected error during order placement:', err);
      setPlacing(false);
      setTimeout(() => alert(`Unexpected error: ${err.message}. Please try again later.`), 10);
    }
  };

  // Shared by both payment methods once an order is confirmed (COD immediately, online after verification).
  const finalizeOrder = async (order, fullAddress) => {
    if (formData.email) {
      supabase.functions.invoke('send-invoice', {
        body: {
          order: {
            id: order.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: fullAddress,
            city: formData.city,
            pincode: formData.pincode,
            items: cartItems.map(item => ({ ...item, qty: item.quantity })),
            total: finalTotal,
            payment_method: order.payment_method,
            payment_id: order.payment_id,
            created_at: new Date().toISOString()
          }
        }
      }).catch(err => console.error('Invoice email failed (non-critical):', err));
    }

    await clearCart();
    navigate(`/order-success/${order.id}`);
  };

  const startRazorpayPayment = async (order, fullAddress) => {
    const { data: rzpOrder, error: rzpError } = await supabase.functions.invoke('create-order', {
      body: {
        order_id: order.id,
        receipt: order.id,
        items: cartItems.map(item => ({ price: item.price, quantity: item.quantity }))
      }
    });

    if (rzpError || !rzpOrder?.razorpay_order_id) {
      console.error('Razorpay order creation failed:', rzpError || rzpOrder);
      setPlacing(false);
      alert('Could not start online payment. Please try again or choose Cash on Delivery.');
      return;
    }

    if (!window.Razorpay) {
      setPlacing(false);
      alert('Payment gateway failed to load. Please refresh the page and try again.');
      return;
    }

    const rzp = new window.Razorpay({
      key: rzpOrder.key_id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      order_id: rzpOrder.razorpay_order_id,
      name: 'Taseer Ayurved',
      description: `Order #${order.id.slice(0, 8).toUpperCase()}`,
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone
      },
      theme: { color: '#0d5c3a' },
      handler: async (rzpResponse) => {
        const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-payment', {
          body: {
            order_id: order.id,
            razorpay_order_id: rzpResponse.razorpay_order_id,
            razorpay_payment_id: rzpResponse.razorpay_payment_id,
            razorpay_signature: rzpResponse.razorpay_signature
          }
        });

        if (verifyError || !verifyResult?.verified) {
          setPlacing(false);
          alert(`Payment verification failed. If money was deducted, contact support with order ID: ${order.id.slice(0, 8).toUpperCase()}`);
          return;
        }

        await finalizeOrder({ ...order, payment_id: rzpResponse.razorpay_payment_id }, fullAddress);
      },
      modal: {
        ondismiss: () => {
          setPlacing(false);
          alert('Payment was not completed. Your order is saved as pending — you can try paying again from this page.');
        }
      }
    });

    rzp.open();
  };
```

- [ ] **Step 3: Enable the "Online Payment" radio and wire both radios to state**

Replace:

```jsx
                  <label className="flex items-start gap-3 p-4 border-2 border-[#0d5c3a] rounded-xl bg-emerald-50 cursor-pointer transition-all">
                    <input type="radio" name="payment" value="cod" defaultChecked className="mt-1" />
                    <div>
                      <h4 className="font-body font-semibold text-[#0d5c3a]">💵 Cash on Delivery (COD)</h4>
                      <p className="text-xs text-emerald-700/80 mt-1 font-medium">Pay when your order arrives</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50 opacity-60 cursor-not-allowed">
                    <input type="radio" name="payment" value="online" disabled className="mt-1" />
                    <div>
                      <h4 className="font-body font-medium text-gray-500">💳 Online Payment (Coming Soon)</h4>
                    </div>
                  </label>
```

with:

```jsx
                  <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#0d5c3a] bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="mt-1" />
                    <div>
                      <h4 className="font-body font-semibold text-[#0d5c3a]">💵 Cash on Delivery (COD)</h4>
                      <p className="text-xs text-emerald-700/80 mt-1 font-medium">Pay when your order arrives</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-[#0d5c3a] bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                    <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="mt-1" />
                    <div>
                      <h4 className="font-body font-semibold text-[#0d5c3a]">💳 Online Payment</h4>
                      <p className="text-xs text-emerald-700/80 mt-1 font-medium">Card / UPI / Netbanking via Razorpay</p>
                    </div>
                  </label>
```

- [ ] **Step 4: Reflect the payment method in the submit button**

Replace:

```jsx
                {placing ? 'Placing Order...' : 'Place Order →'}
```

with:

```jsx
                {placing ? 'Processing...' : paymentMethod === 'razorpay' ? `Pay ₹${finalTotal} →` : 'Place Order →'}
```

- [ ] **Step 5: Verify it builds and lints clean**

Run: `npm run lint && npm run build`
Expected: both commands exit 0, no errors referencing `CheckoutPage.jsx`.

- [ ] **Step 6: Manual browser QA runbook for the user (not run by the implementer — requires deployed functions + test keys)**

Tell the user, once Tasks 1–4 are deployed and Razorpay test keys are set:

1. `npm run dev`, add an item to cart, go to `/checkout`, fill the form, select "Online Payment."
2. Click "Pay ₹... →" — the Razorpay modal should open.
3. Pay with Razorpay's published test card (`4111 1111 1111 1111`, any future expiry, any CVV) or test UPI id (`success@razorpay`).
4. Confirm redirect to `/order-success/:orderId`, cart is cleared, and in the Supabase table editor the order row shows `payment_status: 'paid'`, `payment_method: 'razorpay'`, `payment_id` starting with `pay_`, and `razorpay_order_id`/`razorpay_signature` populated.
5. Repeat but close the Razorpay modal without paying — confirm the order row stays `payment_status: 'created'`, the cart is still intact, and the page shows the "try paying again" alert.
6. Place one more order with COD selected — confirm it behaves exactly as before (unaffected).

- [ ] **Step 7: Mark task done**

No git commit (no git repository in this project).

---

## Task 6: Show the correct payment method on the emailed invoice

**Files:**
- Modify: `supabase/functions/send-invoice/index.ts:18`

**Interfaces:**
- Consumes: `order.payment_method` and `order.payment_id`, now sent by `finalizeOrder` in Task 5.

- [ ] **Step 1: Replace the hardcoded payment line**

Replace:

```ts
        <p><strong>Payment:</strong> Cash on Delivery (COD)</p>
```

with:

```ts
        <p><strong>Payment:</strong> ${order.payment_method === 'razorpay' ? `Online Payment (Razorpay) — ${order.payment_id || 'paid'}` : 'Cash on Delivery (COD)'}</p>
```

- [ ] **Step 2: Verify the file compiles as valid TypeScript/Deno syntax**

Run: `npx -y tsc --noEmit --target es2022 --module esnext --moduleResolution bundler supabase/functions/send-invoice/index.ts 2>&1 | grep -v "Cannot find module\|Cannot find name 'Deno'" || true`
Expected: no output other than the filtered-out remote-URL-import and `Deno` global errors.

- [ ] **Step 3: Manual runbook note for the user (not run by the implementer)**

Tell the user to redeploy after this change: `supabase functions deploy send-invoice`. Then confirm during Task 5's Step 6 QA that a paid online order's invoice email shows "Online Payment (Razorpay) — pay_..." instead of "Cash on Delivery (COD)".

- [ ] **Step 4: Mark task done**

No git commit (no git repository in this project).

---

## Task 7: Full deployment runbook

**Files:** none (documentation-only checklist for the user; no code changes)

- [ ] **Step 1: Hand the user this consolidated command sequence**, to run once they have Razorpay keys:

```bash
# 1. Apply the schema change (Task 1)
#    Run supabase/setup_razorpay_payments.sql in the Supabase SQL editor,
#    or: supabase db execute -f supabase/setup_razorpay_payments.sql

# 2. Link the CLI to the project (one-time)
supabase link --project-ref <your-project-ref>

# 3. Set the Razorpay secret (start with test keys)
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxx RAZORPAY_KEY_SECRET=xxxxx

# 4. Deploy all three touched Edge Functions
supabase functions deploy create-order
supabase functions deploy verify-payment
supabase functions deploy send-invoice

# 5. Run the Task 5 Step 6 manual QA checklist against test keys.

# 6. Once QA passes, switch to live keys:
supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxxxx RAZORPAY_KEY_SECRET=xxxxx
```

- [ ] **Step 2: Mark task done**

Plan complete once the user confirms live-mode QA passes.
