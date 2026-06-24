-- Add sizes (JSONB) and emoji (TEXT) columns to products.
-- Both use IF NOT EXISTS so the migration is safe to re-run.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sizes JSONB,
  ADD COLUMN IF NOT EXISTS emoji TEXT;

-- Unique index on (name, category) — lets the migration script use
-- ON CONFLICT (name, category) DO NOTHING for idempotent inserts.
CREATE UNIQUE INDEX IF NOT EXISTS products_name_category_uniq
  ON products (name, category);
