-- Roles: built-in (admin, it-admin, manager, marketing) + custom.
CREATE TABLE IF NOT EXISTS roles (
  slug TEXT PRIMARY KEY,
  name JSONB NOT NULL,                   -- {ru, en}
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- which notification topics this role receives: ['leads','site_updates','user_invites', ...]
  notify_topics TEXT[] NOT NULL DEFAULT '{}',
  is_built_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bot users (managers who use the Telegram bot / Mini App)
CREATE TABLE IF NOT EXISTS bot_users (
  telegram_id BIGINT PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  role_slug TEXT REFERENCES roles(slug) ON DELETE SET NULL,
  notification_lang TEXT NOT NULL DEFAULT 'ru' CHECK (notification_lang IN ('ru','en')),
  invited_by BIGINT,                      -- telegram_id of inviter
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: server-side only (service_role); no public read
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_users ENABLE ROW LEVEL SECURITY;
-- (No policies — only service_role bypasses RLS.)

-- Seed built-in roles. Permissions object describes what UI sections they see.
INSERT INTO roles (slug, name, permissions, notify_topics, is_built_in) VALUES
  ('admin',     '{"ru":"Админ","en":"Admin"}',
                '{"dashboard":true,"properties":true,"leads":true,"taxonomies":true,"users":true,"roles":true}',
                ARRAY['leads','user_invites','site_updates'], true),
  ('it-admin',  '{"ru":"IT-админ","en":"IT Admin"}',
                '{"dashboard":true,"properties":true,"leads":true,"taxonomies":true,"users":true,"roles":true}',
                ARRAY['leads','user_invites','site_updates','technical_errors'], true),
  ('manager',   '{"ru":"Менеджер","en":"Manager"}',
                '{"dashboard":true,"properties":true,"leads":true,"taxonomies":false,"users":false,"roles":false}',
                ARRAY['leads'], true),
  ('marketing', '{"ru":"Маркетинг","en":"Marketing"}',
                '{"dashboard":true,"properties":false,"leads":true,"taxonomies":false,"users":false,"roles":false}',
                ARRAY['site_updates'], true)
ON CONFLICT (slug) DO NOTHING;

-- Seed initial user from env (replace 682845869 with your real id; you can rerun this manually after migration)
INSERT INTO bot_users (telegram_id, display_name, role_slug, notification_lang)
VALUES (682845869, 'Founder', 'it-admin', 'ru')
ON CONFLICT (telegram_id) DO NOTHING;
