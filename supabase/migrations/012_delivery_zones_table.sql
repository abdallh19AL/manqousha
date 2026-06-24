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
