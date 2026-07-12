# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build → dist/
npm run lint      # ESLint check
npm run preview   # Preview production build locally
```

No test runner is configured. Playwright is installed and used ad hoc by `mobile-qa.mjs` (a standalone script that screenshots pages at iPhone 12 viewport into `mobile-qa-screenshots/`), not as a wired-up test suite — run it directly with `node mobile-qa.mjs`.

## Architecture Overview

This is **Taseer Ayurved**, a React 19 + Vite Ayurvedic e-commerce frontend backed by Supabase (Postgres + Auth) and an OpenAI-powered chatbot.

### Entry Points

- `index.html` — mounts the app; contains a global SVG noise overlay (feTurbulence, z-index 9999, 0.04 opacity) that gives the premium texture effect — do not remove it
- `src/main.jsx` → `src/App.jsx` — App wraps everything in `<AuthProvider>`, `<CartProvider>`, `<BrowserRouter>`

### State Management

Two React Context providers, no Redux:

- **AuthContext** (`src/context/AuthContext.jsx`) — wraps `supabase.auth.onAuthStateChange()`; exposes `user`, `session`, `loading`, `signOut()`
- **CartContext** (`src/context/CartContext.jsx`) — dual-mode cart:
  - Guest: `localStorage` key `taseer_cart`
  - Logged-in: Supabase `cart_items` table
  - On login, local cart is merged into the DB; `openCart`/`closeCart` toggle the slide-in `<CartSidebar>`

### Routing

React Router v7. Routes live in `src/App.jsx`. Admin routes (`/admin/*`) render inside `<AdminLayout>`; all other routes share `<Navbar>`, `<CartSidebar>`, `<ChatWidget>`, and `<Footer>`. Scroll-to-top is handled via `useLocation()` in App.

Key routes:
```
/shop          → ShopPage  (?category= query param for filtering)
/shop/:slug    → ProductDetail
/admin         → AdminDashboard (full CRUD sub-routes beneath)
```

### Supabase

Tables: `products`, `cart_items`, `orders`, `consultations`, `testimonials`, `ads`

- Each component fetches directly from Supabase — there is no API layer or data-fetching library
- Environment variables required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OPENAI_API_KEY`
- `supabase/functions/` holds three Deno Edge Functions: `create-order` (looks up authoritative prices from `products`, creates the Razorpay order, stores `razorpay_order_id` + a server-verified `total` on the order), `verify-payment` (checks the Razorpay HMAC signature, cross-checks it against the `razorpay_order_id` stored on that specific order, and independently confirms the payment with Razorpay's API before marking an order paid), and `send-invoice` (builds an HTML invoice, invoked after checkout). All three use the service-role key for any `orders` write, since RLS blocks the anon key from doing that.
- SQL setup scripts live at the repo root (`setup_consultations.sql`, `insert_products.sql`, etc.) and in `supabase/` (`setup_orders.sql`, `setup_admin_tables.sql`, `setup_ads.sql`, `create_testimonials.sql`, `fix_orders_rls_security.sql`) — there is no migration tool, these are run manually against the Supabase project. `update_orders.sql` at the repo root is kept for history only — **do not run it**, it creates the exact vulnerable policies `fix_orders_rls_security.sql` removes.
- `orders` RLS (`supabase/setup_orders.sql`, tightened by `supabase/fix_orders_rls_security.sql` on 2026-07-12 after a live PII-exposure + payment-forgery bug was found and fixed): INSERT is allowed but constrained — `payment_status` can only start as `'cod'`/`'created'`, and `razorpay_order_id`/`razorpay_signature` must be `NULL` at insert time (only Edge Functions, via the service-role key, can attach those). SELECT is scoped to the row's own `user_id` or `admin@taseer.com`; there is no unauthenticated/public SELECT — a guest's own just-placed order is never re-read from the DB, `CheckoutPage.jsx` generates the order's `id` client-side (`crypto.randomUUID()`) instead of relying on `.select()` after insert. Only `admin@taseer.com` can UPDATE/DELETE (or an Edge Function via the service-role key).

### Animation Patterns

Two animation libraries are used together:

- **GSAP** — complex entrance animations, scroll triggers, stagger effects. Always use `gsap.context()` and clean up with `ctx.revert()` in the `useEffect` return
- **Framer Motion** — page-level `<AnimatePresence>` transitions and simpler component animations

Custom easing used throughout: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

### Design System

Defined in `tailwind.config.js`:
- Primary brand green: `theme-bg-deep` (#0d5c3a)
- Gold accent: `theme-accent` (#e8a500)
- Fonts: `Playfair Display` (headings), `Inter` (body)

The `GEMINI.md` file is a design specification prompt (not code) describing the intended cinematic aesthetic — reference it when building new UI sections.

### Product Categories

`ShopPage` has 16 hardcoded Ayurvedic health categories (`src/pages/ShopPage.jsx`). Five sensitive slugs — `mens-health`, `womens-care`, `womens-health`, `gynecology`, `womens-special` — are listed in `sensitiveCategories` and excluded from the "All" filter view; maintain this behavior when adding categories.

### Payment

Razorpay is installed (client SDK + a placeholder `create-order` Edge Function) but inactive end-to-end. Current orders use `payment_id: 'COD'` (Cash on Delivery only).

### AI Chatbot

`src/components/ChatWidget.jsx` calls the OpenAI API directly from the browser (`dangerouslyAllowBrowser: true`). It has two modes: text chat via `gpt-3.5-turbo` with a system prompt that injects the live product list from Supabase, and a voice mode via the `gpt-4o-realtime-preview` Realtime API with `whisper-1` transcription. Both share the "Hakeem" persona (an Ayurvedic assistant for the brand).
