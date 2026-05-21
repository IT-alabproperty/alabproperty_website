-- ============================================================
-- 002 — Уникальный 4-символьный код объекта
-- ============================================================

-- 1. Колонка code (4 символа, уникальная)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- 2. Функция генерации читаемого 4-символьного кода
--    Алфавит без 0/O/1/I чтобы не путать визуально.
CREATE OR REPLACE FUNCTION gen_property_code()
RETURNS TEXT AS $$
DECLARE
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result   TEXT;
  i        INT;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..4 LOOP
      result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
    END LOOP;
    -- повторяем пока не получим уникальный
    EXIT WHEN NOT EXISTS (SELECT 1 FROM properties WHERE code = result);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Бэкфилл существующих объектов без кода
UPDATE properties SET code = gen_property_code() WHERE code IS NULL;

-- 4. Триггер: любой новый объект без кода получает его автоматически
--    (удобно для Telegram-бота — можно не передавать code при вставке)
CREATE OR REPLACE FUNCTION set_property_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := gen_property_code();
  ELSE
    NEW.code := upper(NEW.code);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_property_code ON properties;
CREATE TRIGGER trg_set_property_code
  BEFORE INSERT ON properties
  FOR EACH ROW EXECUTE FUNCTION set_property_code();
