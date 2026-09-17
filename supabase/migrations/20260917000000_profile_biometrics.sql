-- Fase 6: datos biométricos del perfil (peso, estatura, fecha de nacimiento).
-- Nullable a propósito: los perfiles ya existentes no los tienen todavía.
-- La app decide cuándo pedirlos (perfil "incompleto"), no una constraint acá.
-- Pegar en el SQL Editor de Supabase.

alter table profiles
  add column if not exists weight_kg numeric(5, 2) check (weight_kg > 0 and weight_kg < 500),
  add column if not exists height_cm numeric(5, 1) check (height_cm > 0 and height_cm < 300),
  add column if not exists birth_date date check (
    birth_date > date '1900-01-01' and birth_date <= current_date
  );
