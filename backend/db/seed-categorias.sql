-- Seed: categorías de trabajo.
-- Se corre a mano en el SQL Editor de Supabase, después de schema.sql.
-- Es idempotente: no duplica categorías que ya existen (compara el nombre).
--
-- Los íconos de cada categoría los pone el front (utils/categoryIcons.js),
-- por nombre: si se agrega una categoría nueva acá, sumarle un ícono allá
-- (si no, usa el ícono por defecto).

INSERT INTO categorias (nombre)
SELECT c.nombre
FROM (VALUES
  ('Mascotas'), ('Cuidado'), ('Clases'), ('Limpieza')
) AS c(nombre)
WHERE NOT EXISTS (
  SELECT 1 FROM categorias x WHERE lower(trim(x.nombre)) = lower(c.nombre)
);
