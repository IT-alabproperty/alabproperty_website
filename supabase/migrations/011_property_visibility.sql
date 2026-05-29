-- Per-property visibility — single source of truth replacing implicit
-- "is this on the site" logic. Three explicit states:
--
--   'published' (default) → live on alabproperty.com
--   'hidden'              → saved, NOT on site (off-market, exclusive, etc.)
--   'draft'               → work in progress, NOT on site, may be incomplete
--
-- 'hidden' vs 'draft' is a semantic distinction for the admin only — both are
-- excluded from public reads identically.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_visibility') THEN
    CREATE TYPE property_visibility AS ENUM ('published', 'hidden', 'draft');
  END IF;
END $$;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS visibility property_visibility NOT NULL DEFAULT 'published';

-- Public site only reads published rows — make that filter fast.
CREATE INDEX IF NOT EXISTS idx_properties_visibility_published
  ON properties (visibility) WHERE visibility = 'published';
