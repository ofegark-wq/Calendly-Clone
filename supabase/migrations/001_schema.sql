-- Phase 1: core tables + Row Level Security (RLS).
--
-- RLS in one sentence: once enabled on a table, Postgres denies every
-- read/write by default, and only the specific "policy" rules below
-- re-allow specific access. This means privacy is enforced by the
-- database itself, not just by our application code.

-- Needed for the exclusion constraint on bookings, further down.
create extension if not exists btree_gist;

-- =========================================================
-- profiles: one row per host, linked 1:1 to their auth account.
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  full_name text,
  created_at timestamptz not null default now(),
  constraint username_format check (
    username ~ '^[a-z0-9-]+$' and char_length(username) between 3 and 30
  )
);

alter table public.profiles enable row level security;

-- Anyone (including invitees, who are never logged in) can look up a
-- host's profile, because the public booking page is at /<username>.
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

-- A host can only ever create/edit/delete their own profile row -
-- never someone else's. auth.uid() is the id of whoever is currently
-- logged in, taken from their session, so this can't be spoofed from
-- the browser.
create policy "hosts manage their own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =========================================================
-- event_types: a host's bookable appointment types.
-- =========================================================
create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  slug text not null,
  duration_minutes integer not null check (duration_minutes in (15, 30, 45, 60)),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint unique_slug_per_host unique (host_id, slug)
);

create index event_types_host_id_idx on public.event_types (host_id);

alter table public.event_types enable row level security;

-- The public can see a host's active appointment types (that's what
-- the public page lists); a signed-in host can additionally see their
-- own inactive ones, so their dashboard can show everything they own.
create policy "active event types are publicly readable"
  on public.event_types for select
  using (is_active = true or auth.uid() = host_id);

create policy "hosts manage their own event types"
  on public.event_types for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- =========================================================
-- availability: a host's recurring weekly working hours.
-- Overlap-within-a-day validation happens in the app (Phase 4),
-- since it's edited by one person at a time, not raced by the public.
-- =========================================================
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_time > start_time)
);

create index availability_host_id_idx on public.availability (host_id);

alter table public.availability enable row level security;

-- The public needs to read a host's hours to compute open slots.
create policy "availability is publicly readable"
  on public.availability for select
  using (true);

create policy "hosts manage their own availability"
  on public.availability for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- =========================================================
-- bookings: the sensitive one. Invitee names/emails must never be
-- readable by the public, and no two confirmed bookings for the same
-- host may overlap in time - enforced below at the database level so
-- it holds even if two people submit at the exact same moment.
-- =========================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid not null references public.event_types (id) on delete restrict,
  host_id uuid not null references public.profiles (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  invitee_name text not null,
  invitee_email text not null,
  status text not null default 'confirmed',
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_at > start_at),
  constraint status_values check (status in ('confirmed', 'cancelled')),
  constraint invitee_name_length check (char_length(invitee_name) between 1 and 100),
  constraint invitee_email_format check (invitee_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create index bookings_event_type_id_idx on public.bookings (event_type_id);

-- The actual double-booking guard: for CONFIRMED bookings only, reject
-- any insert/update whose time range overlaps another confirmed
-- booking for the same host. This works across different-length
-- appointment types, unlike a simple "unique start time" rule.
alter table public.bookings
  add constraint no_overlapping_confirmed_bookings
  exclude using gist (
    host_id with =,
    tstzrange(start_at, end_at) with &&
  ) where (status = 'confirmed');

alter table public.bookings enable row level security;

-- Only the host can read their own bookings. There is deliberately no
-- policy granting the public (anon) any read access at all - with RLS
-- on and no matching policy, the default is "no access", so invitee
-- names/emails stay private.
create policy "hosts read their own bookings"
  on public.bookings for select
  using (auth.uid() = host_id);

-- A host can update their own bookings (used in Phase 7 to cancel one
-- by setting status = 'cancelled'). There is no insert policy and no
-- delete policy: creating a booking only happens through the
-- create_booking() database function we add in Phase 6, which runs
-- with elevated privileges and does its own validation before
-- inserting - direct inserts from the app or from anon/authenticated
-- users are blocked entirely.
create policy "hosts update their own bookings"
  on public.bookings for update
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);
