-- ============================================================
-- 003 — Просмотры объектов недвижимости
-- ============================================================
-- Одна строка = один просмотр страницы объекта.
-- Даёт полную аналитику: счётчики, динамика по дням, ТОПы.

CREATE TABLE IF NOT EXISTS property_views (
  id BIGSERIAL PRIMARY KEY,
  property_slug TEXT NOT NULL REFERENCES properties(slug) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT,           -- SHA-256 от IP — для подсчёта уникальных без хранения PII
  locale TEXT,            -- 'ru' / 'en'
  referrer TEXT,
  user_agent TEXT
);

-- Индексы под основные запросы дашборда
CREATE INDEX IF NOT EXISTS idx_pv_slug       ON property_views(property_slug);
CREATE INDEX IF NOT EXISTS idx_pv_viewed_at  ON property_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_slug_date  ON property_views(property_slug, viewed_at DESC);

-- RLS: любой может писать (INSERT), читать только service_role (админ)
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_views" ON property_views;
CREATE POLICY "anon_insert_views"
  ON property_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
