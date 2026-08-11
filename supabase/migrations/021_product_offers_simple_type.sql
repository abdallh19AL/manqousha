ALTER TABLE product_offers
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE product_offers DROP CONSTRAINT IF EXISTS product_offers_offer_type_check;
ALTER TABLE product_offers ADD CONSTRAINT product_offers_offer_type_check
  CHECK (offer_type IN ('price_discount', 'free_delivery', 'free_addon', 'simple'));
