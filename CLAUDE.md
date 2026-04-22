# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build → dist/
npm run lint      # ESLint check
npm run preview   # Preview production build locally
```

No test runner is configured (Playwright is installed but not yet wired up).

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

### Supabase Tables

`products`, `cart_items`, `orders`, `consultations`, `testimonials`, `ads`

- Each component fetches directly from Supabase — there is no API layer or data-fetching library
- Environment variables required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OPENAI_API_KEY`

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

`ShopPage` has 16 hardcoded Ayurvedic health categories. Sensitive categories (`mens-health`, `womens-care`) are excluded from the "All" filter view — maintain this behavior when adding categories.

### Payment

Razorpay is installed but inactive. Current orders use `payment_id: 'COD'` (Cash on Delivery only).

### AI Chatbot

`src/components/ChatWidget.jsx` calls the OpenAI API directly from the browser (`dangerouslyAllowBrowser: true`). The system prompt defines the Hakeem persona with product knowledge.
