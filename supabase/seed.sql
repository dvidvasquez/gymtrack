-- Datos de prueba para desarrollo local de la Fase 3 (escaneo y registro).
-- Pegar en el SQL Editor de Supabase. El valor de qr_code es lo que el QR
-- físico va a codificar (ver Fase 5) y lo que ScanPage/LogPage usan para
-- buscar la máquina.

insert into machines (name, qr_code, muscle_group) values
  ('Press de banca', 'machine-press-banca', 'Pecho'),
  ('Prensa de piernas', 'machine-prensa-piernas', 'Piernas'),
  ('Remo en polea', 'machine-remo-polea', 'Espalda')
on conflict (qr_code) do nothing;
