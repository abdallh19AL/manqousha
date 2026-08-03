-- ============================================================
-- COMBINED SCHEMA — generated for Supabase project migration
-- Concatenation of supabase/migrations/*.sql in numeric order.
-- Source files: 001,002,003,004,005,006,007,008,010,011,012,013,014,015,016,017,018
-- (There is no 009 file — the sequence skips that number in the repo itself.)
-- Paste into the NEW project's SQL Editor and run once, top to bottom.
-- ============================================================

-- ################################################################
-- 001_initial_schema.sql
-- ################################################################

-- ============================================================
-- Manaqeesh W Za'atar — Initial Schema
-- ============================================================

-- UUID extension (enabled by default on Supabase, but kept for safety)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Admin helper function
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '') = 'marwanalqissi19866@gmail.com'
$$;

-- ============================================================
-- products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url   TEXT,
  category    TEXT        NOT NULL,
  available   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can read all products
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (TRUE);

-- Admin can write
CREATE POLICY "products_admin_insert"
  ON products FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "products_admin_update"
  ON products FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "products_admin_delete"
  ON products FOR DELETE
  USING (is_admin());

-- ============================================================
-- orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name     TEXT        NOT NULL,
  customer_phone    TEXT        NOT NULL,
  customer_address  TEXT        NOT NULL,
  total             NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Anyone can place an order (no auth required)
CREATE POLICY "orders_public_insert"
  ON orders FOR INSERT
  WITH CHECK (TRUE);

-- Admin can read / update / delete all orders
CREATE POLICY "orders_admin_select"
  ON orders FOR SELECT
  USING (is_admin());

CREATE POLICY "orders_admin_update"
  ON orders FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "orders_admin_delete"
  ON orders FOR DELETE
  USING (is_admin());

-- ============================================================
-- order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID         REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT         NOT NULL,
  quantity     INTEGER      NOT NULL CHECK (quantity > 0),
  price        NUMERIC(10,2) NOT NULL CHECK (price >= 0)
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Anyone can insert order items alongside an order
CREATE POLICY "order_items_public_insert"
  ON order_items FOR INSERT
  WITH CHECK (TRUE);

-- Admin can read / update / delete all order items
CREATE POLICY "order_items_admin_select"
  ON order_items FOR SELECT
  USING (is_admin());

CREATE POLICY "order_items_admin_update"
  ON order_items FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "order_items_admin_delete"
  ON order_items FOR DELETE
  USING (is_admin());

-- ============================================================
-- Realtime (required for admin order alerts)
-- ============================================================
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category   ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_available  ON products (available);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items (order_id);

-- ################################################################
-- 002_add_location.sql
-- ################################################################

ALTER TABLE orders ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- ################################################################
-- 003_add_payment.sql
-- ################################################################

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';

-- ################################################################
-- 004_add_delivery.sql
-- ################################################################

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS distance_km  NUMERIC(10,2);

-- ################################################################
-- 005_add_profiles.sql
-- ################################################################

-- Create user profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT,
  phone          TEXT,
  last_latitude  DOUBLE PRECISION,
  last_longitude DOUBLE PRECISION,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Link orders to authenticated users for order history
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);

-- ################################################################
-- 006_track_order_policy.sql
-- ################################################################

-- Allow public read access to orders and order_items using the order UUID as an
-- access key. UUIDs have 122 bits of randomness and are not enumerable, so
-- knowing a UUID is sufficient proof of access for a guest order tracker.

CREATE POLICY "public_can_track_own_order_by_id"
  ON orders
  FOR SELECT
  USING (true);

-- order_items must also be readable for the nested select in the tracker
CREATE POLICY "public_can_read_order_items"
  ON order_items
  FOR SELECT
  USING (true);

-- ################################################################
-- 007_storage_bucket.sql
-- ################################################################

-- Create the product-images storage bucket.
-- NOTE: Supabase supports bucket creation via SQL migrations.
-- If this migration fails (some hosted plans restrict storage schema access),
-- create the bucket manually in the Supabase Dashboard:
--   Storage → New bucket → Name: "product-images" → Public: ON → Save
-- Then run only the policy statements below.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access (bucket is public, but explicit policy is best practice)
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Authenticated users (admin) can upload
CREATE POLICY "Authenticated upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Authenticated users can replace/update existing objects
CREATE POLICY "Authenticated update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Authenticated users can delete objects
CREATE POLICY "Authenticated delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- ################################################################
-- 008_add_sizes_emoji.sql
-- ################################################################

-- Add sizes (JSONB) and emoji (TEXT) columns to products.
-- Both use IF NOT EXISTS so the migration is safe to re-run.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sizes JSONB,
  ADD COLUMN IF NOT EXISTS emoji TEXT;

-- Unique index on (name, category) — lets the migration script use
-- ON CONFLICT (name, category) DO NOTHING for idempotent inserts.
CREATE UNIQUE INDEX IF NOT EXISTS products_name_category_uniq
  ON products (name, category);

-- ################################################################
-- 010_add_delivery_zone.sql
-- ################################################################

-- Stores the matched delivery zone code per order (K1–K9, K10, or null).
-- K10 means the fallback distance-based rate was used.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone TEXT;

-- ################################################################
-- 011_store_settings.sql
-- ################################################################

CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  orders_paused BOOLEAN NOT NULL DEFAULT FALSE,
  pause_message TEXT DEFAULT 'نعتذر، المطعم مغلق حالياً ولا يستقبل طلبات. يمكنك تصفح القائمة وسنعود قريباً!',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert the single settings row
INSERT INTO store_settings (id, orders_paused) VALUES (1, FALSE) ON CONFLICT (id) DO NOTHING;

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read the settings (to know if ordering is paused)
CREATE POLICY "public_read_settings" ON store_settings FOR SELECT USING (true);

-- Only admin can update
CREATE POLICY "admin_update_settings" ON store_settings FOR UPDATE USING (
  (auth.jwt() ->> 'email') = 'marwanalqissi19866@gmail.com'
);

-- ################################################################
-- 012_delivery_zones_table.sql
-- ################################################################

CREATE TABLE IF NOT EXISTS delivery_zones (
  zone_code TEXT PRIMARY KEY,
  fee NUMERIC(10,2) NOT NULL,
  is_distance_based BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with current prices
INSERT INTO delivery_zones (zone_code, fee, is_distance_based) VALUES
  ('K1',  2.00, FALSE),
  ('K2',  2.50, FALSE),
  ('K3',  3.00, FALSE),
  ('K4',  3.50, FALSE),
  ('K5',  4.00, FALSE),
  ('K6',  5.00, FALSE),
  ('K7',  6.00, FALSE),
  ('K8',  7.00, FALSE),
  ('K9',  9.00, FALSE),
  ('K10', 0.40, TRUE)
ON CONFLICT (zone_code) DO NOTHING;

ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_zones" ON delivery_zones FOR SELECT USING (true);

CREATE POLICY "admin_update_zones" ON delivery_zones FOR UPDATE USING (
  (auth.jwt() ->> 'email') = 'marwanalqissi19866@gmail.com'
);

-- ################################################################
-- 013_combo_deals.sql
-- ################################################################

CREATE TABLE combo_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE combo_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID REFERENCES combo_deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  step_order INTEGER NOT NULL,
  min_select INTEGER DEFAULT 1,
  max_select INTEGER DEFAULT 1,
  step_type TEXT DEFAULT 'pizza' -- 'pizza' | 'choice'
);

CREATE TABLE combo_step_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID REFERENCES combo_steps(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  extra_cost DECIMAL(10,2) DEFAULT 0,
  product_category TEXT -- if linked to a product category
);

ALTER TABLE combo_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_step_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_combos" ON combo_deals FOR SELECT USING (true);
CREATE POLICY "public_read_steps" ON combo_steps FOR SELECT USING (true);
CREATE POLICY "public_read_options" ON combo_step_options FOR SELECT USING (true);

CREATE POLICY "admin_all_combos" ON combo_deals FOR ALL USING ((auth.jwt() ->> 'email') = 'marwanalqissi19866@gmail.com');
CREATE POLICY "admin_all_steps" ON combo_steps FOR ALL USING ((auth.jwt() ->> 'email') = 'marwanalqissi19866@gmail.com');
CREATE POLICY "admin_all_options" ON combo_step_options FOR ALL USING ((auth.jwt() ->> 'email') = 'marwanalqissi19866@gmail.com');

-- Seed the 3 pizza deals
INSERT INTO combo_deals (name, description, price, sort_order) VALUES
('عرض 3 بيتزا وسط', 'يمكنك اختيار ثلاث انواع مختلفة من البيتزا حجم وسط 27 سم', 14.00, 1),
('عرض 3 بيتزا كبيرة', 'اختيارك من ثلاث انواع مختلفة من البيتزا حجم كبير 33 سم', 16.00, 2),
('العرض الاضخم', 'اختر 3 بيتزا كبير , 20 ونجز او 8 بونلس , 2 عبة بطاطا, سلطة, صوصات', 20.00, 3);

-- ################################################################
-- 014_payment_reference.sql
-- ################################################################

-- Store payment gateway transaction ID on confirmed electronic orders.
-- Updated server-side via service role key; no new RLS policy needed.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- ################################################################
-- 015_electronic_payment_setting.sql
-- ################################################################

ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS electronic_payment_enabled BOOLEAN DEFAULT true;
UPDATE store_settings SET electronic_payment_enabled = true WHERE id = 1;

-- ################################################################
-- 016_add_customer_code.sql
-- ################################################################

-- Add customer_code column to profiles (was never created in earlier migrations)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS customer_code TEXT;

-- Backfill existing rows that have null customer_code
UPDATE profiles
SET customer_code = upper(substr(md5(random()::text || id::text), 1, 6))
WHERE customer_code IS NULL;

-- Set a default so new profile rows get a code automatically
ALTER TABLE profiles
ALTER COLUMN customer_code SET DEFAULT upper(substr(md5(random()::text), 1, 6));

-- Unique index so the admin lookup by customer_code is fast and collision-safe
CREATE UNIQUE INDEX IF NOT EXISTS profiles_customer_code_idx ON profiles (customer_code);

-- ################################################################
-- 017_profile_trigger.sql
-- ################################################################

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ################################################################
-- 018_admin_read_profiles.sql
-- ################################################################

-- Admin needs to read any customer's profile (by customer_code) from the
-- admin page's search feature. profiles never got an admin SELECT policy —
-- 005_add_profiles.sql only allowed users to read their own row via
-- auth.uid() = id, unlike orders/order_items/products which all got an
-- is_admin() policy. That's why admin search by customer_code silently
-- returned "not found" for every profile except the admin's own: RLS was
-- hiding the row, not a query bug.
--
-- Additive: Postgres OR-combines multiple permissive policies for the same
-- command, so this coexists with "users_read_own_profile" — users keep
-- reading their own row, admins can now read all rows.
CREATE POLICY "admins_read_all_profiles"
  ON profiles FOR SELECT
  USING (is_admin());
