-- Datos de prueba para desarrollo local de la Fase 3 (escaneo y registro).
-- Pegar en el SQL Editor de Supabase. El valor de qr_code es lo que el QR
-- físico va a codificar (ver Fase 5) y lo que ScanPage/LogPage usan para
-- buscar el ejercicio. Estas 3 son máquinas con QR; los ejercicios sin QR
-- (mancuernas, barra) se cargan desde /exercises en la app (Fase 8).

insert into exercises (name, qr_code, muscle_group) values
  ('Press de banca', 'machine-press-banca', 'Pecho'),
  ('Prensa de piernas', 'machine-prensa-piernas', 'Piernas'),
  ('Remo en polea', 'machine-remo-polea', 'Espalda')
on conflict (qr_code) do nothing;
