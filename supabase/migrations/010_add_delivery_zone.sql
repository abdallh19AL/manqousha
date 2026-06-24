-- Stores the matched delivery zone code per order (K1–K9, K10, or null).
-- K10 means the fallback distance-based rate was used.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone TEXT;
