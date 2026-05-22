-- 006: cover_zoom for Instagram-style cover crop
-- cover_focus already exists (text). From now on it stores a CSS object-position
-- value, e.g. "50% 30%". cover_zoom holds a CSS scale factor applied to the
-- cover image on the public property card.

ALTER TABLE properties ADD COLUMN IF NOT EXISTS cover_zoom NUMERIC NOT NULL DEFAULT 1;
