-- ============================================================
-- 010 — Storage policy hardening
-- ============================================================
-- Public buckets (property-photos, blog-photos) have public SELECT enabled
-- by Supabase's default storage.objects policies. Without explicit policies
-- for INSERT / UPDATE / DELETE, anon can't write — that's why service_role
-- uploads work but anon clients can't tamper. But "no policy" silently
-- becomes permissive if someone later adds a broad rule. These explicit
-- DENY policies prevent that — defence-in-depth.
--
-- service_role bypasses RLS entirely, so admin upload-routes remain
-- unaffected.

-- Drop any prior versions if migration is re-run
DROP POLICY IF EXISTS "deny_anon_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "deny_anon_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "deny_anon_storage_delete" ON storage.objects;

-- Block any anon write to our buckets. Authenticated role likewise — we don't
-- intentionally let any non-admin SSO user write there. Service role is unaffected.
CREATE POLICY "deny_anon_storage_insert" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id NOT IN ('property-photos', 'blog-photos', 'article-covers'));

CREATE POLICY "deny_anon_storage_update" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id NOT IN ('property-photos', 'blog-photos', 'article-covers'));

CREATE POLICY "deny_anon_storage_delete" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id NOT IN ('property-photos', 'blog-photos', 'article-covers'));
