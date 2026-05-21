-- ============================================================
-- 004 — Расширение справочника статусов объекта
-- Добавляем 'building' (строится) и 'soon' (скоро в продаже)
-- ============================================================

-- Удаляем старый CHECK и добавляем новый с расширенным списком.
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_status_check
  CHECK (status IN ('available', 'reserved', 'sold', 'building', 'soon'));
