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
