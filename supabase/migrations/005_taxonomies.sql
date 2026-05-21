-- Three simple lookup tables for cities, property types, districts.
-- Each row has a slug (used as the value in properties.type/city/district) and a localized name.

CREATE TABLE IF NOT EXISTS taxonomy_cities (
  slug TEXT PRIMARY KEY,
  name JSONB NOT NULL,            -- {ru: "...", en: "..."}
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxonomy_property_types (
  slug TEXT PRIMARY KEY,
  name JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxonomy_districts (
  slug TEXT PRIMARY KEY,
  name JSONB NOT NULL,
  city_slug TEXT REFERENCES taxonomy_cities(slug) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: public read, service_role full
ALTER TABLE taxonomy_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_districts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_cities" ON taxonomy_cities;
DROP POLICY IF EXISTS "public_read_types" ON taxonomy_property_types;
DROP POLICY IF EXISTS "public_read_districts" ON taxonomy_districts;

CREATE POLICY "public_read_cities"    ON taxonomy_cities    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_types"     ON taxonomy_property_types FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_districts" ON taxonomy_districts FOR SELECT TO anon, authenticated USING (true);

-- Seed initial data (matches current literal values)
INSERT INTO taxonomy_cities (slug, name) VALUES
  ('bangkok', '{"ru":"Бангкок","en":"Bangkok"}'),
  ('pattaya', '{"ru":"Паттайя","en":"Pattaya"}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO taxonomy_property_types (slug, name) VALUES
  ('condo',      '{"ru":"Кондо","en":"Condo"}'),
  ('villa',      '{"ru":"Вилла","en":"Villa"}'),
  ('penthouse',  '{"ru":"Пентхаус","en":"Penthouse"}'),
  ('townhouse',  '{"ru":"Таунхаус","en":"Townhouse"}'),
  ('house',      '{"ru":"Дом","en":"House"}'),
  ('land',       '{"ru":"Земля","en":"Land"}'),
  ('commercial', '{"ru":"Коммерческая","en":"Commercial"}'),
  ('office',     '{"ru":"Офис","en":"Office"}'),
  ('retail',     '{"ru":"Ритейл","en":"Retail"}'),
  ('hotel',      '{"ru":"Отель","en":"Hotel"}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO taxonomy_districts (slug, name, city_slug) VALUES
  ('sukhumvit',   '{"ru":"Сукхумвит","en":"Sukhumvit"}', 'bangkok'),
  ('silom',       '{"ru":"Силом","en":"Silom"}', 'bangkok'),
  ('sathorn',     '{"ru":"Сатхон","en":"Sathorn"}', 'bangkok'),
  ('thonglor',    '{"ru":"Тхонгло","en":"Thonglor"}', 'bangkok'),
  ('phrom-phong', '{"ru":"Пхром Пхонг","en":"Phrom Phong"}', 'bangkok'),
  ('asok',        '{"ru":"Асок","en":"Asok"}', 'bangkok'),
  ('riverside',   '{"ru":"Риверсайд","en":"Riverside"}', 'bangkok'),
  ('ari',         '{"ru":"Ари","en":"Ari"}', 'bangkok')
ON CONFLICT (slug) DO NOTHING;
