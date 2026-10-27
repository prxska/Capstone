-- Perfiles dentro de una cuenta (ej. una madre que administra los medicamentos de su hijo)
-- y control de stock de medicamentos.
-- Ejecutar una vez en Supabase: SQL Editor -> pegar este archivo -> Run.

create table if not exists public.care_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);

alter table public.care_profiles enable row level security;

drop policy if exists "care_profiles: cada usuario gestiona los suyos" on public.care_profiles;
create policy "care_profiles: cada usuario gestiona los suyos"
  on public.care_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- profile_id NULL = el titular de la cuenta ("Yo"). Al borrar un perfil se borran sus registros.
alter table public.recipes
  add column if not exists profile_id uuid references public.care_profiles (id) on delete cascade;
alter table public.appointments
  add column if not exists profile_id uuid references public.care_profiles (id) on delete cascade;

-- Cantidad disponible en la unidad de la dosis (pastillas, ml, gotas o mg). NULL = sin control de stock.
alter table public.recipes
  add column if not exists stock numeric check (stock is null or stock >= 0);

create index if not exists recipes_profile_id_idx on public.recipes (profile_id);
create index if not exists appointments_profile_id_idx on public.appointments (profile_id);
