-- Protege profiles.role contra autoasignación desde la app.
-- Aplicar en Supabase Dashboard -> SQL Editor (no hay Supabase CLI configurada).
--
-- Problema: las políticas `profiles_insert_own` / `profiles_update_own` (Fase 1)
-- dejan que cada usuario escriba *cualquier* columna de su propia fila, y
-- `role` se agregó después (Fase 8) sin restringirla. Cualquier usuario
-- logueado podía hacer, desde la consola del navegador con la anon key,
-- `supabase.from('profiles').update({ role: 'owner' })` y ganar permisos
-- sobre el catálogo compartido de `exercises`.
--
-- Solución: trigger que rechaza cambiar `role` (o insertarlo con un valor
-- distinto de 'member') cuando quien ejecuta es un rol de la app
-- (`authenticated` / `anon`, que es con lo que PostgREST corre las queries
-- del cliente). El SQL Editor corre como `postgres`, así que otorgar
-- 'owner' a mano sigue funcionando igual que antes. Se eligió trigger en vez
-- de `revoke update (role)` porque Supabase le da a `authenticated` grants a
-- nivel tabla, y un revoke por columna no tiene efecto mientras exista ese
-- grant de tabla.
--
-- Nombres calificados con `public.` para no depender del search_path del
-- SQL Editor; la función fija `search_path = ''` (no referencia tablas) para
-- que no la marque el linter de seguridad de Supabase.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' and new.role <> 'member' then
      raise exception 'No se puede asignar el rol desde la app'
        using errcode = '42501';
    end if;

    if tg_op = 'UPDATE' and new.role is distinct from old.role then
      raise exception 'No se puede cambiar el rol desde la app'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;

create trigger profiles_protect_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();
