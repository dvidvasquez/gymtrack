-- Fase 8: generaliza `machines` a `exercises` (para soportar ejercicios sin
-- QR físico, como mancuernas sueltas o barra+discos) y agrega roles a
-- `profiles` para controlar quién puede dar de alta/editar el catálogo.
-- Ver .claude/CLAUDE.md ("Decisiones de arquitectura") para el razonamiento.
-- Aplicar en Supabase Dashboard -> SQL Editor (no hay Supabase CLI configurada).

-- ============================================================
-- exercises (antes "machines")
-- Ahora modela tanto máquinas con QR físico (qr_code no nulo) como
-- ejercicios sin equipamiento fijo (qr_code nulo, se eligen a mano desde
-- /exercises en vez de escanear).
-- ============================================================
alter table machines rename to exercises;
alter table exercises alter column qr_code drop not null;

-- ============================================================
-- log_entries: machine_id -> exercise_id
-- ============================================================
alter table log_entries rename column machine_id to exercise_id;

-- Antes de este cambio no había datos reales en juego; ahora que hay un mes
-- de entrenamiento real cargado, borrar un ejercicio por accidente no debe
-- arrastrar en cascada su historial de logs. Verificar el nombre real de la
-- constraint con `\d log_entries` antes de correr esto si Postgres la nombró
-- distinto a la convención default (<tabla>_<columna>_fkey).
alter table log_entries drop constraint log_entries_machine_id_fkey;
alter table log_entries add constraint log_entries_exercise_id_fkey
  foreign key (exercise_id) references exercises (id) on delete restrict;

-- ============================================================
-- profiles.role
-- 'owner': puede crear/editar/borrar ejercicios del catálogo compartido.
-- 'member': puede loguear sus propios entrenamientos (sin cambios, ya
-- estaba aislado por RLS) pero no tocar el catálogo.
-- Se otorga a mano vía SQL, nunca autootorgado al loguearse.
-- ============================================================
alter table profiles add column role text not null default 'member'
  check (role in ('owner', 'member'));

update profiles set role = 'owner'
  where user_id = (select id from auth.users where email = 'vasquez.s.david@gmail.com');

-- ============================================================
-- RLS de exercises: select sigue abierta a cualquier autenticado (todos
-- necesitan poder ver el catálogo para escanear/loguear); insert/update/
-- delete ahora requieren role = 'owner'.
-- ============================================================
drop policy "machines_insert_authenticated" on exercises;
drop policy "machines_update_authenticated" on exercises;
drop policy "machines_delete_authenticated" on exercises;

create policy "exercises_insert_owner"
  on exercises for insert
  with check (exists (select 1 from profiles where user_id = auth.uid() and role = 'owner'));

create policy "exercises_update_owner"
  on exercises for update
  using (exists (select 1 from profiles where user_id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where user_id = auth.uid() and role = 'owner'));

create policy "exercises_delete_owner"
  on exercises for delete
  using (exists (select 1 from profiles where user_id = auth.uid() and role = 'owner'));
