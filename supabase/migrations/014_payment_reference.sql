-- Store payment gateway transaction ID on confirmed electronic orders.
-- Updated server-side via service role key; no new RLS policy needed.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
