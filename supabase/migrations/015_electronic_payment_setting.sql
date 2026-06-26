ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS electronic_payment_enabled BOOLEAN DEFAULT true;
UPDATE store_settings SET electronic_payment_enabled = true WHERE id = 1;
