-- Migración: teléfonos guardados solo con dígitos.
-- Se corre a mano en el SQL Editor de Supabase. Es idempotente.
--
-- Desde las correcciones P2 el backend guarda el teléfono sin guiones ni
-- espacios ("1123456789"). Los usuarios registrados antes pueden tenerlo
-- como lo escribieron ("11-2345-6789"): acá se limpian, para que la base
-- tenga un solo formato. Solo se tocan los que quedan con 10 dígitos; el
-- resto (datos de prueba mal cargados) se deja como está y se corrige al
-- guardar el perfil.

UPDATE usuarios
SET telefono = regexp_replace(telefono, '\D', '', 'g')
WHERE telefono IS NOT NULL
  AND telefono ~ '\D'
  AND length(regexp_replace(telefono, '\D', '', 'g')) = 10;
