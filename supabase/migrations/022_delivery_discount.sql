ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS delivery_discount_enabled       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_discount_min_subtotal  NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS delivery_discount_amount        NUMERIC(10,2) NOT NULL DEFAULT 1.00;

ALTER TABLE store_settings
  ADD CONSTRAINT IF NOT EXISTS delivery_discount_min_subtotal_nonneg CHECK (delivery_discount_min_subtotal >= 0),
  ADD CONSTRAINT IF NOT EXISTS delivery_discount_amount_nonneg       CHECK (delivery_discount_amount >= 0);

UPDATE store_settings
  SET delivery_discount_enabled = COALESCE(delivery_discount_enabled, false),
      delivery_discount_min_subtotal = COALESCE(delivery_discount_min_subtotal, 5.00),
      delivery_discount_amount = COALESCE(delivery_discount_amount, 1.00)
  WHERE id = 1;

NOTIFY pgsql, 'reload schema';
NOTIFY pgrst, 'reload schema';
