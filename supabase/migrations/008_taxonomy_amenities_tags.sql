-- Amenities and tags as taxonomies — same shape as cities/types/districts.
-- Lets admins add/remove/edit values via /taxonomies UI instead of touching code.

CREATE TABLE IF NOT EXISTS taxonomy_amenities (
  slug TEXT PRIMARY KEY,
  name JSONB NOT NULL,            -- {ru: "...", en: "..."}
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxonomy_tags (
  slug TEXT PRIMARY KEY,
  name JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: public read, service_role full
ALTER TABLE taxonomy_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_amenities" ON taxonomy_amenities;
DROP POLICY IF EXISTS "public_read_tags" ON taxonomy_tags;

CREATE POLICY "public_read_amenities" ON taxonomy_amenities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_tags"      ON taxonomy_tags      FOR SELECT TO anon, authenticated USING (true);

-- Seed with existing literal values (matches the current Amenities/Tags i18n namespaces)
INSERT INTO taxonomy_amenities (slug, name) VALUES
  ('pool',         '{"ru":"Бассейн","en":"Swimming Pool"}'),
  ('gym',          '{"ru":"Спортзал","en":"Fitness Center"}'),
  ('sauna',        '{"ru":"Сауна","en":"Sauna"}'),
  ('parking',      '{"ru":"Парковка","en":"Parking"}'),
  ('security',     '{"ru":"Охрана 24/7","en":"24/7 Security"}'),
  ('concierge',    '{"ru":"Консьерж","en":"Concierge"}'),
  ('co-working',   '{"ru":"Коворкинг","en":"Co-working Space"}'),
  ('garden',       '{"ru":"Сад","en":"Garden"}'),
  ('rooftop',      '{"ru":"Терраса на крыше","en":"Rooftop Terrace"}'),
  ('kids-area',    '{"ru":"Детская зона","en":"Kids'' Area"}'),
  ('pet-friendly', '{"ru":"Можно с животными","en":"Pet-Friendly"}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO taxonomy_tags (slug, name) VALUES
  ('sea-view',        '{"ru":"Вид на море","en":"Sea View"}'),
  ('city-view',       '{"ru":"Вид на город","en":"City View"}'),
  ('river-view',      '{"ru":"Вид на реку","en":"River View"}'),
  ('new-build',       '{"ru":"Новостройка","en":"New Build"}'),
  ('fully-furnished', '{"ru":"С мебелью","en":"Fully Furnished"}'),
  ('pool-access',     '{"ru":"Свой бассейн","en":"Private Pool"}'),
  ('high-floor',      '{"ru":"Высокий этаж","en":"High Floor"}'),
  ('investor-pick',   '{"ru":"Выбор инвесторов","en":"Investor''s Pick"}')
ON CONFLICT (slug) DO NOTHING;
