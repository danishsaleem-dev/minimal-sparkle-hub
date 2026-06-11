-- ============================================================
-- By Areeqaan — Jewelry Store Database Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PRODUCTS ────────────────────────────────────────────────
create table if not exists products (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  description   text,
  short_description text,
  price         numeric(10,2) not null default 0,
  compare_price numeric(10,2),
  status        text not null default 'draft' check (status in ('draft','published','archived')),
  featured      boolean not null default false,
  material      text,
  weight_grams  numeric(8,2),
  sku           text,
  seo_title     text,
  seo_description text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── PRODUCT IMAGES ──────────────────────────────────────────
create table if not exists product_images (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  url         text not null,
  alt         text,
  position    int not null default 0,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─── PRODUCT VIDEOS ──────────────────────────────────────────
create table if not exists product_videos (
  id              uuid primary key default uuid_generate_v4(),
  product_id      uuid not null references products(id) on delete cascade,
  url             text not null,
  thumbnail_url   text,
  title           text,
  position        int not null default 0,
  created_at      timestamptz not null default now()
);

-- ─── COLLECTIONS ─────────────────────────────────────────────
create table if not exists collections (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── PRODUCT ↔ COLLECTIONS ───────────────────────────────────
create table if not exists product_collections (
  product_id    uuid not null references products(id) on delete cascade,
  collection_id uuid not null references collections(id) on delete cascade,
  primary key (product_id, collection_id)
);

-- ─── ATTRIBUTES ──────────────────────────────────────────────
create table if not exists attributes (
  id        uuid primary key default uuid_generate_v4(),
  name      text not null,
  type      text not null default 'text' check (type in ('color','text','size')),
  position  int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── ATTRIBUTE VALUES ────────────────────────────────────────
create table if not exists attribute_values (
  id            uuid primary key default uuid_generate_v4(),
  attribute_id  uuid not null references attributes(id) on delete cascade,
  value         text not null,
  label         text not null,
  color_code    text,
  position      int not null default 0
);

-- ─── PRODUCT VARIANTS ────────────────────────────────────────
create table if not exists product_variants (
  id                  uuid primary key default uuid_generate_v4(),
  product_id          uuid not null references products(id) on delete cascade,
  title               text not null,
  sku                 text,
  price               numeric(10,2),
  compare_price       numeric(10,2),
  inventory_quantity  int not null default 0,
  available           boolean not null default true,
  position            int not null default 0,
  created_at          timestamptz not null default now()
);

-- ─── VARIANT ↔ ATTRIBUTE VALUES ──────────────────────────────
create table if not exists variant_attributes (
  variant_id          uuid not null references product_variants(id) on delete cascade,
  attribute_value_id  uuid not null references attribute_values(id) on delete cascade,
  primary key (variant_id, attribute_value_id)
);

-- ─── HOMEPAGE SECTIONS ───────────────────────────────────────
create table if not exists homepage_sections (
  id         uuid primary key default uuid_generate_v4(),
  section    text not null,
  key        text not null,
  value      jsonb not null default '{}',
  type       text not null default 'text',
  position   int not null default 0,
  updated_at timestamptz not null default now(),
  unique(section, key)
);

-- ─── SITE SETTINGS ───────────────────────────────────────────
create table if not exists site_settings (
  id         uuid primary key default uuid_generate_v4(),
  key        text not null unique,
  value      jsonb not null default '{}',
  type       text not null default 'text',
  "group"    text not null default 'general',
  label      text not null,
  updated_at timestamptz not null default now()
);

-- ─── RLS POLICIES (basic — enable auth for production) ───────
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_videos enable row level security;
alter table collections enable row level security;
alter table product_collections enable row level security;
alter table attributes enable row level security;
alter table attribute_values enable row level security;
alter table product_variants enable row level security;
alter table variant_attributes enable row level security;
alter table homepage_sections enable row level security;
alter table site_settings enable row level security;

-- Public read for published products (storefront)
create policy "Public read published products"
  on products for select using (status = 'published');

create policy "Public read product_images"
  on product_images for select using (true);

create policy "Public read product_videos"
  on product_videos for select using (true);

create policy "Public read collections"
  on collections for select using (true);

create policy "Public read product_collections"
  on product_collections for select using (true);

create policy "Public read attributes"
  on attributes for select using (true);

create policy "Public read attribute_values"
  on attribute_values for select using (true);

create policy "Public read product_variants"
  on product_variants for select using (true);

create policy "Public read variant_attributes"
  on variant_attributes for select using (true);

create policy "Public read homepage_sections"
  on homepage_sections for select using (true);

create policy "Public read site_settings"
  on site_settings for select using (true);

-- TEMP: allow all for development (replace with auth in production)
create policy "Dev allow all products"
  on products for all using (true) with check (true);

create policy "Dev allow all product_images"
  on product_images for all using (true) with check (true);

create policy "Dev allow all product_videos"
  on product_videos for all using (true) with check (true);

create policy "Dev allow all collections"
  on collections for all using (true) with check (true);

create policy "Dev allow all product_collections"
  on product_collections for all using (true) with check (true);

create policy "Dev allow all attributes"
  on attributes for all using (true) with check (true);

create policy "Dev allow all attribute_values"
  on attribute_values for all using (true) with check (true);

create policy "Dev allow all product_variants"
  on product_variants for all using (true) with check (true);

create policy "Dev allow all variant_attributes"
  on variant_attributes for all using (true) with check (true);

create policy "Dev allow all homepage_sections"
  on homepage_sections for all using (true) with check (true);

create policy "Dev allow all site_settings"
  on site_settings for all using (true) with check (true);

-- ─── STORAGE BUCKETS ─────────────────────────────────────────
-- Run these after creating buckets in the Supabase dashboard
-- insert into storage.buckets (id, name, public) values ('products', 'products', true);
-- insert into storage.buckets (id, name, public) values ('media', 'media', true);

-- ─── SEED: DEFAULT SITE SETTINGS ────────────────────────────
insert into site_settings (key, value, type, "group", label) values
  ('site_name',       '"By Areeqaan"',                         'text',  'brand',   'Site Name'),
  ('tagline',         '"Trendy · Minimal · Affordable Luxe"',  'text',  'brand',   'Tagline'),
  ('logo_url',        'null',                                   'image', 'brand',   'Logo'),
  ('favicon_url',     'null',                                   'image', 'brand',   'Favicon'),
  ('instagram_url',   '"https://www.instagram.com/byareeqaan/"','text', 'social',  'Instagram URL'),
  ('tiktok_url',      '"https://www.tiktok.com/@by_areeqan"',  'text',  'social',  'TikTok URL'),
  ('facebook_url',    'null',                                   'text',  'social',  'Facebook URL'),
  ('whatsapp_number', '"923364246604"',                         'text',  'social',  'WhatsApp Number'),
  ('contact_email',   'null',                                   'text',  'contact', 'Contact Email'),
  ('contact_phone',   'null',                                   'text',  'contact', 'Contact Phone'),
  ('shipping_policy', '"Delivery all over Pakistan"',           'text',  'policy',  'Shipping Policy'),
  ('return_policy',   '"Easy returns within 7 days"',           'text',  'policy',  'Return Policy')
on conflict (key) do nothing;

-- ─── SEED: DEFAULT HOMEPAGE SECTIONS ─────────────────────────
insert into homepage_sections (section, key, value, type, position) values
  ('announcement', 'text',         '"✦  New arrivals every week  ✦  Delivery all over Pakistan  ✦"', 'text', 0),
  ('announcement', 'enabled',      'true',                                                           'boolean', 1),
  ('hero',         'title',        '"Tiny details."',                                                'text', 0),
  ('hero',         'subtitle',     '"Big statements."',                                              'text', 1),
  ('hero',         'description',  '"Trendy · Minimal · Affordable Luxe"',                           'text', 2),
  ('hero',         'cta_text',     '"Shop the Edit"',                                                'text', 3),
  ('hero',         'cta_link',     '"#products"',                                                    'text', 4),
  ('features',     'items',        '[{"label":"Shipping","text":"Delivery all over Pakistan"},{"label":"Order","text":"Easy DM ordering"},{"label":"Style","text":"Trendy minimal luxe"},{"label":"Care","text":"Hand-finished detail"}]', 'json', 0),
  ('story',        'title',        '"Our Story"',                                                    'text', 0),
  ('story',        'content',      '"Every piece is a small act of self-expression — thoughtfully designed, beautifully made."', 'textarea', 1),
  ('contact',      'title',        '"Get in Touch"',                                                 'text', 0),
  ('contact',      'content',      '"Have a question? Reach out on WhatsApp or Instagram and we will get back to you."', 'textarea', 1)
on conflict (section, key) do nothing;

-- ─── TRIGGER: auto-update updated_at ────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger products_updated_at before update on products
  for each row execute procedure set_updated_at();
create trigger homepage_sections_updated_at before update on homepage_sections
  for each row execute procedure set_updated_at();
create trigger site_settings_updated_at before update on site_settings
  for each row execute procedure set_updated_at();
