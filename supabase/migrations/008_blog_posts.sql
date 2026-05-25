-- Blog posts: bilingual articles with a block-based body.
-- blocks: ordered array of { type: 'heading' | 'paragraph' | 'image', ...payload }
--   heading:   { type: 'heading',   text: { ru, en } }
--   paragraph: { type: 'paragraph', text: { ru, en } }
--   image:     { type: 'image',     src: string, alt?: { ru, en } }
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title JSONB NOT NULL,
  cover_image TEXT,
  excerpt JSONB NOT NULL DEFAULT '{"ru":"","en":""}'::jsonb,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_status_published_at_idx
  ON blog_posts (status, published_at DESC NULLS LAST);

-- updated_at trigger
CREATE OR REPLACE FUNCTION blog_posts_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION blog_posts_set_updated_at();

-- RLS: public reads only published posts; admin writes via service_role.
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_published_blog_posts" ON blog_posts;
CREATE POLICY "public_read_published_blog_posts" ON blog_posts
  FOR SELECT TO anon, authenticated USING (status = 'published');

-- Storage bucket for blog photos. Public — same model as property-photos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-photos', 'blog-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Grant the `blog` permission to built-in roles that already manage content.
UPDATE roles
SET permissions = permissions || '{"blog":true}'::jsonb
WHERE slug IN ('admin', 'it-admin', 'marketing', 'manager');
