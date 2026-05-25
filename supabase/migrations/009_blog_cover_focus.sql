-- Cover positioning for blog posts, mirroring properties.cover_focus / cover_zoom.
-- cover_focus stores objectPosition as "X% Y%" (e.g. "50% 50%"),
-- cover_zoom is a numeric scale (0.5 – 3, default 1).
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS cover_focus TEXT,
  ADD COLUMN IF NOT EXISTS cover_zoom NUMERIC;
