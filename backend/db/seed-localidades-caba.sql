-- Seed: barrios de la Ciudad Autónoma de Buenos Aires (48 barrios oficiales).
-- Se corre a mano en el SQL Editor de Supabase. Es idempotente: no duplica
-- barrios que ya existen (compara nombre + provincia).
--
-- Antes de correrlo, verificá el nombre de la provincia con:
--   SELECT id, nombre FROM provincias WHERE nombre ILIKE '%buenos aires%' OR nombre ILIKE '%caba%';
-- Si el nombre no matchea con el filtro de abajo, ajustá el ILIKE.

DO $$
DECLARE
  v_provincia INT;
BEGIN
  SELECT id INTO v_provincia
  FROM provincias
  WHERE nombre ILIKE '%Ciudad%Buenos Aires%'
     OR nombre ILIKE 'CABA'
     OR nombre ILIKE 'Capital Federal'
  ORDER BY id
  LIMIT 1;

  IF v_provincia IS NULL THEN
    RAISE EXCEPTION 'No se encontró la provincia CABA en la tabla provincias. Revisá el nombre y ajustá el filtro.';
  END IF;

  INSERT INTO localidades (nombre, id_provincia)
  SELECT b.nombre, v_provincia
  FROM (VALUES
    ('Agronomía'), ('Almagro'), ('Balvanera'), ('Barracas'), ('Belgrano'),
    ('Boedo'), ('Caballito'), ('Chacarita'), ('Coghlan'), ('Colegiales'),
    ('Constitución'), ('Flores'), ('Floresta'), ('La Boca'), ('La Paternal'),
    ('Liniers'), ('Mataderos'), ('Monte Castro'), ('Montserrat'), ('Nueva Pompeya'),
    ('Núñez'), ('Palermo'), ('Parque Avellaneda'), ('Parque Chacabuco'), ('Parque Chas'),
    ('Parque Patricios'), ('Puerto Madero'), ('Recoleta'), ('Retiro'), ('Saavedra'),
    ('San Cristóbal'), ('San Nicolás'), ('San Telmo'), ('Vélez Sarsfield'), ('Versalles'),
    ('Villa Crespo'), ('Villa del Parque'), ('Villa Devoto'), ('Villa General Mitre'), ('Villa Lugano'),
    ('Villa Luro'), ('Villa Ortúzar'), ('Villa Pueyrredón'), ('Villa Real'), ('Villa Riachuelo'),
    ('Villa Santa Rita'), ('Villa Soldati'), ('Villa Urquiza')
  ) AS b(nombre)
  WHERE NOT EXISTS (
    SELECT 1 FROM localidades l
    WHERE l.id_provincia = v_provincia
      AND lower(l.nombre) = lower(b.nombre)
  );
END $$;
