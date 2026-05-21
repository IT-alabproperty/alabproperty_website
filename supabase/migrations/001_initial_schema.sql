-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  price_thb NUMERIC NOT NULL,
  deal TEXT NOT NULL CHECK (deal IN ('sale', 'rent')),
  name JSONB NOT NULL,
  type TEXT NOT NULL,
  district TEXT,
  city TEXT,
  address JSONB,
  area_sqm NUMERIC NOT NULL,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  floor INTEGER,
  total_floors INTEGER,
  year_built INTEGER,
  view JSONB,
  ownership TEXT NOT NULL CHECK (ownership IN ('freehold', 'leasehold')),
  lease_years_remaining INTEGER,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  description JSONB,
  amenities TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  cover_image TEXT,
  gallery TEXT[] DEFAULT '{}',
  developer JSONB,
  completion_date TEXT,
  coordinates JSONB,
  estimated_monthly_rent_thb NUMERIC,
  estimated_annual_appreciation_pct NUMERIC,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_contact TEXT DEFAULT 'email',
  message TEXT,
  crypto_payment BOOLEAN DEFAULT false,
  property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
  property_title TEXT,
  property_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title JSONB NOT NULL,
  excerpt JSONB,
  content JSONB,
  content_preview JSONB,
  category TEXT NOT NULL,
  published_at DATE NOT NULL,
  reading_time_min INTEGER DEFAULT 5,
  cover_image TEXT,
  author JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Properties: public read
CREATE POLICY "public_read_properties" ON properties FOR SELECT TO anon, authenticated USING (true);

-- Leads: anyone can insert, only service_role can read
CREATE POLICY "anon_insert_leads" ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Articles: public read
CREATE POLICY "public_read_articles" ON articles FOR SELECT TO anon, authenticated USING (true);

-- STORAGE BUCKETS (run separately in Supabase Dashboard > Storage):
-- 1. Create bucket "property-photos" — Public: true
-- 2. Create bucket "article-covers" — Public: true
