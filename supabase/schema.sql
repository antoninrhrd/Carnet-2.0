-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────

create extension if not exists "pgcrypto";

create table if not exists public.fiches (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('plat', 'preparation', 'produit')),
  categorie   text not null,
  nom         text not null,

  -- Plat fields
  source      text,
  dressage    text,
  preparation_ids jsonb default '[]'::jsonb,

  -- Preparation fields
  ingredients jsonb,
  etapes      jsonb,

  -- Shared optional
  saison      text,
  note_perso  text,
  image_url   text,

  -- Produit fields
  note_libre  text,
  prix_min    numeric(10,2),
  prix_max    numeric(10,2),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fiches_updated_at on public.fiches;
create trigger fiches_updated_at
  before update on public.fiches
  for each row execute function update_updated_at();

-- Row Level Security — disable for private app (single user, service role key only)
alter table public.fiches disable row level security;

-- Storage bucket for images
insert into storage.buckets (id, name, public)
values ('fiche-images', 'fiche-images', true)
on conflict do nothing;

-- ─── Migration (si vous aviez déjà exécuté le schéma initial) ───────────────
-- alter table public.fiches add column if not exists preparation_ids jsonb default '[]'::jsonb;
