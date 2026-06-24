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
  (auth.jwt() ->> 'email') = 'abdallhalmanaseer305@icloud.com'
);
