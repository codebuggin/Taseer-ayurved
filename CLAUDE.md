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
- `supabase/functions/` holds two Deno Edge Functions: `create-order` (server-side Razorpay order creation — currently a placeholder, not called by the frontend since payment is COD-only) and `send-invoice` (builds an HTML invoice from an order and is invoked after checkout)
- SQL setup scripts live at the repo root (`update_orders.sql`, `setup_consultations.sql`, `insert_products.sql`, etc.) and in `supabase/` (`setup_orders.sql`, `setup_admin_tables.sql`, `setup_ads.sql`, `create_testimonials.sql`) — there is no migration tool, these are run manually against the Supabase project
- `orders` RLS (`supabase/setup_orders.sql`): anyone can INSERT; a user can SELECT their own orders; only `admin@taseer.com` (checked via `auth.jwt() ->> 'email'`) can UPDATE/DELETE. Any Edge Function that needs to update an order (e.g. after payment) must use the service-role key to bypass RLS, not the anon key

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
