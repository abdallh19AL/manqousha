# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build (also catches type errors via Next.js)
npm run lint         # ESLint via next lint
npx tsc --noEmit     # Type-check only, no output — run this after every code change
npm run db:migrate   # Run a migration via scripts/run-migration.mjs
```

There is no test suite. `npx tsc --noEmit` is the primary correctness gate — always run it after changes.

## Environment variables

Two `NEXT_PUBLIC_` vars are required (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + Storage + Realtime) · Zustand (cart state)

**All pages are `"use client"`** — there are no Server Components in use. The app is effectively a client-side SPA hosted on Next.js.

### Auth & session (`src/lib/auth-context.tsx`)
`AuthProvider` wraps the entire app in `layout.tsx`. It exposes `{ user, loading }` via `useAuth()`. The `onAuthStateChange` listener also calls `useCartStore.getState().clearCart()` and removes `localStorage("manaqeesh-delivery-info")` on `SIGNED_OUT` or when the signed-in user changes — this prevents cart/delivery info from leaking between accounts. Guest-to-login transitions intentionally preserve the cart.

The admin page (`/admin`) is NOT protected by middleware — it does its own email check against the `ADMIN_EMAIL` constant and renders a login form if the condition isn't met. Logging into `/admin` creates a real Supabase session visible app-wide.

### Cart state (`src/lib/store.ts`)
Zustand store with `persist` middleware, key `"manaqeesh-cart"` (not user-scoped). Cart items use a composite `cartKey` of `productId:sizeLabel`. Version 2 schema — migrations handled via the `migrate` callback.

### Supabase Realtime
Used in three places:
- `src/app/admin/page.tsx` — channel `admin-orders-v2` for live order inserts + polling fallback every 15 s
- `src/app/track/[orderId]/page.tsx` — per-order channel for status updates
- `src/lib/store-settings.ts` — per-instance channel for pause/resume propagation

Realtime must be enabled per-table in the Supabase dashboard (Database → Replication). Required tables: `orders`, `store_settings`.

### Delivery zones (`src/lib/delivery-zones.ts`)
K1–K9 are flat-fee zones matched by Arabic neighbourhood name via normalised fuzzy containment. K10 is the distance-based fallback (per-km rate). Zone → fee mapping is now live in the `delivery_zones` DB table; `fetchZoneFees()` loads it with `FALLBACK_FEES` as the hardcoded safety net. The cart page calls `fetchZoneFees()` on mount and uses the live rate for fee derivation — no re-geocoding required when fees change.

### Store settings (`src/lib/store-settings.ts`)
`useStoreSettings()` hook: fetches `orders_paused` + `pause_message` from the `store_settings` table (single row, `id = 1`) and subscribes to Realtime. Consumed by cart, menu, and homepage to show pause banners; the admin `StoreControlPanel` writes directly without using this hook.

### Database migrations
SQL files live in `supabase/migrations/` numbered `001`–`012`. They must be run manually in the Supabase SQL Editor or via `npm run db:migrate`. There is no automatic migration runner.

## Styling conventions

**Two-layer approach:**
- **Tailwind** for structural layout (`flex`, `grid`, spacing, border-radius, `hidden`, `sticky`, etc.)
- **Inline `style` props** for all brand colors and anything dynamic — the warm palette (`#0F0A05` bg, `#E8622A` primary orange, `#C8922A` gold) is applied this way so colors can be toggled programmatically

Named color tokens are in `tailwind.config.ts` (`warm.*`, `brand.*`) and as CSS variables in `globals.css`, but pages mostly use hex literals directly in inline styles for consistency.

The Cairo Google Font is loaded in `layout.tsx` and applied globally. All pages are RTL Arabic.

**Avoid adding emojis** to UI text — the codebase uses them very sparingly and intentionally.

## Key non-obvious constraints

- `next.config.mjs` only allows `localhost` as an external image hostname. Add production domains there before deploying with real product images from Supabase Storage.
- The `product-images` Supabase Storage bucket must exist with public access for product image uploads to work.
- `src/lib/delivery-zones.ts` imports `supabase` directly — it is a client-only module even though it has no `"use client"` directive. Only import it from client components.
- The `store_settings` table has a `CHECK (id = 1)` constraint enforcing a single row — never insert a second row.
- Admin RLS policies on `store_settings` and `delivery_zones` are scoped to the hardcoded admin email `abdallhalmanaseer305@icloud.com`. This value also appears as `ADMIN_EMAIL` in `src/app/admin/page.tsx`.
