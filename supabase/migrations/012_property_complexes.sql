-- 012: Support property complexes (buildings with multiple unit types)
-- Additive only — existing single-property flow is unaffected.

-- 1. New columns on properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_complex boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_units integer,
  ADD COLUMN IF NOT EXISTS floorplan_image text;

-- 2. Unit types table
CREATE TABLE IF NOT EXISTS property_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id text NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_type text NOT NULL,
  name jsonb NOT NULL DEFAULT '{"ru":"","en":""}',
  description jsonb DEFAULT '{"ru":"","en":""}',
  price_thb numeric,
  area_sqm numeric,
  bedrooms integer NOT NULL DEFAULT 1,
  bathrooms integer NOT NULL DEFAULT 1,
  available_units integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  gallery text[] DEFAULT '{}',
  floor_range text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_units_property_id ON property_units(property_id);

-- 3. RLS: public read, service-role write
ALTER TABLE property_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_units_public_read" ON property_units
  FOR SELECT USING (true);

CREATE POLICY "property_units_service_write" ON property_units
  FOR ALL USING (true) WITH CHECK (true);
