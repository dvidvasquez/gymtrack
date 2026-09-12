-- Fase 1: esquema inicial de GymTrack.
-- Tablas: profiles, machines, log_entries. Ver src/types/domain.ts para los tipos TS equivalentes.
-- Aplicar en Supabase Dashboard -> SQL Editor (no hay Supabase CLI configurado en este proyecto).

-- ============================================================
-- profiles
-- Un perfil por usuario de auth.users. Datos de onboarding (Fase 2).
-- ============================================================
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- machines
-- Catálogo de máquinas identificadas por QR. No tienen owner: son
-- equipamiento físico del gimnasio, compartido entre las cuentas que
-- usan la app (hoy, un solo usuario). Si en el futuro se soporta
-- multi-gimnasio por usuario, esta tabla necesitará una columna
-- user_id y políticas RLS por dueño.
-- ============================================================
create table if not exists machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  qr_code text not null unique,
  muscle_group text,
  created_at timestamptz not null default now()
);

alter table machines enable row level security;

create policy "machines_select_authenticated"
  on machines for select
  using (auth.role() = 'authenticated');

create policy "machines_insert_authenticated"
  on machines for insert
  with check (auth.role() = 'authenticated');

create policy "machines_update_authenticated"
  on machines for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "machines_delete_authenticated"
  on machines for delete
  using (auth.role() = 'authenticated');

-- ============================================================
-- log_entries
-- Un registro de peso/reps/series de un usuario en una máquina.
-- ============================================================
create table if not exists log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  machine_id uuid not null references machines (id) on delete cascade,
  weight_kg numeric(6, 2) not null check (weight_kg >= 0),
  reps integer not null check (reps > 0),
  sets integer not null check (sets > 0),
  notes text,
  created_at timestamptz not null default now()
);

alter table log_entries enable row level security;

create policy "log_entries_select_own"
  on log_entries for select
  using (auth.uid() = user_id);

create policy "log_entries_insert_own"
  on log_entries for insert
  with check (auth.uid() = user_id);

create policy "log_entries_update_own"
  on log_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "log_entries_delete_own"
  on log_entries for delete
  using (auth.uid() = user_id);

-- Query central del flujo: "último registro de este usuario en esta máquina".
create index if not exists log_entries_user_machine_created_idx
  on log_entries (user_id, machine_id, created_at desc);
