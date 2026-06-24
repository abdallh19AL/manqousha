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
  SELECT COALESCE(auth.jwt() ->> 'email', '') = 'abdallhalmanaseer305@icloud.com'
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
