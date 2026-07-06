-- Run this once in your Supabase project's SQL editor (Database > SQL Editor > New query).
-- It creates the three tables the app needs and locks them down with Row Level
-- Security so they're unreachable except via the server-side service-role key
-- that the Next.js app uses.

create extension if not exists "pgcrypto";

-- One row per contractor client, e.g. slug "acme-remediation" -> /c/acme-remediation
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  business_name text not null,
  logo_url text,
  brand_color text not null default '#c98a4b',
  created_at timestamptz not null default now()
);

-- Which trades (and, within a trade, which tiers) a client's page shows.
-- tier_keys empty/null means "show all tiers of this trade".
create table if not exists client_trades (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  trade_key text not null,
  tier_keys text[],
  created_at timestamptz not null default now(),
  unique (client_id, trade_key)
);

-- Per-client price overrides. tier_key null = the trade's base $/unit rate
-- (used by trades whose tiers are a multiplier, like decking/fencing/concrete).
-- tier_key set = an override for one specific tier's own low/high (used by
-- trades like remediation whose tiers already carry their own $ range).
-- Any (trade_key, tier_key) combo with no row here falls back to the
-- hardcoded defaults in lib/trades.js.
create table if not exists pricing (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  trade_key text not null,
  tier_key text,
  low numeric not null,
  high numeric not null,
  created_at timestamptz not null default now(),
  unique (client_id, trade_key, tier_key)
);

-- Every lead submitted through the calculator, tagged with which client's
-- page it came from (null = the generic "/" demo page).
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  trade text not null,
  tier text not null,
  size numeric not null,
  estimate_low numeric not null,
  estimate_high numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists leads_client_id_created_at_idx on leads (client_id, created_at desc);

-- Lock every table down. The app only ever talks to Supabase with the
-- service-role key (server-side), which bypasses RLS by design — this just
-- makes sure no other key (e.g. an anon key used by mistake) can read/write.
alter table clients enable row level security;
alter table client_trades enable row level security;
alter table pricing enable row level security;
alter table leads enable row level security;
