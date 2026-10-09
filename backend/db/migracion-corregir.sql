-- Migración de la branch "Corregir".
-- Se corre a mano en el SQL Editor de Supabase, ANTES de deployar el backend
-- nuevo. Es idempotente: se puede correr más de una vez sin duplicar nada.
--
-- Contenido:
--   1. Provincias: la fila "Buenos Aires" (id actual) en realidad tiene los 48
--      barrios de CABA -> se renombra a "Ciudad Autónoma de Buenos Aires" y se
--      cargan las otras 23 provincias (sin localidades por ahora).
--   2. Postulaciones: estado 'por_reconfirmar' + columnas rechazo_automatico y
--      reconfirmar_hasta (flujo cancelar -> reabrir -> reconfirmar).
--   3. Mensajes: el chat pasa a estar atado a la postulación (id_postulacion),
--      así se puede chatear antes de aceptar. id_contrato queda opcional.
--   4. Notificaciones: backfill de id_trabajo / id_postulacion en las
--      'nueva_postulacion' viejas, y de id_referencia (contrato -> postulación)
--      en las 'nuevo_mensaje'.

BEGIN;

-- =========================================================
-- 1. PROVINCIAS
-- =========================================================

UPDATE provincias
SET nombre = 'Ciudad Autónoma de Buenos Aires'
WHERE nombre = 'Buenos Aires'
  AND NOT EXISTS (SELECT 1 FROM provincias WHERE nombre = 'Ciudad Autónoma de Buenos Aires')
  AND EXISTS (
    SELECT 1 FROM localidades l
    WHERE l.id_provincia = provincias.id AND l.nombre = 'Palermo'
  );

INSERT INTO provincias (nombre)
SELECT p.nombre
FROM (VALUES
  ('Buenos Aires'), ('Catamarca'), ('Chaco'), ('Chubut'), ('Córdoba'),
  ('Corrientes'), ('Entre Ríos'), ('Formosa'), ('Jujuy'), ('La Pampa'),
  ('La Rioja'), ('Mendoza'), ('Misiones'), ('Neuquén'), ('Río Negro'),
  ('Salta'), ('San Juan'), ('San Luis'), ('Santa Cruz'), ('Santa Fe'),
  ('Santiago del Estero'), ('Tierra del Fuego'), ('Tucumán'),
  ('Ciudad Autónoma de Buenos Aires')
) AS p(nombre)
WHERE NOT EXISTS (SELECT 1 FROM provincias x WHERE x.nombre = p.nombre);

-- =========================================================
-- 2. POSTULACIONES
-- =========================================================

ALTER TABLE postulaciones DROP CONSTRAINT IF EXISTS postulaciones_estado_check;
ALTER TABLE postulaciones ADD CONSTRAINT postulaciones_estado_check
  CHECK (estado IN ('pendiente', 'aceptado', 'rechazado', 'retirado', 'por_reconfirmar'));

-- true = la rechazó el sistema al aceptar a otro postulante (no el contratante
-- a mano, ni la cancelación del trabajo). Solo esas se reconfirman al reabrir.
ALTER TABLE postulaciones ADD COLUMN IF NOT EXISTS rechazo_automatico boolean NOT NULL DEFAULT false;

-- Fecha límite para responder "Sigo interesado" / "Ya no me interesa".
ALTER TABLE postulaciones ADD COLUMN IF NOT EXISTS reconfirmar_hasta timestamp NULL;

-- Las rechazadas existentes de trabajos que siguen con un contrato vigente o
-- completado vienen de aceptar a otro -> automáticas.
UPDATE postulaciones p
SET rechazo_automatico = true
WHERE p.estado = 'rechazado'
  AND p.rechazo_automatico = false
  AND EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id_trabajo = p.id_trabajo AND c.estado IN ('activo', 'completado')
  );

-- =========================================================
-- 3. MENSAJES -> POSTULACIÓN
-- =========================================================

ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS id_postulacion integer REFERENCES postulaciones(id);

UPDATE mensajes m
SET id_postulacion = c.id_postulacion
FROM contratos c
WHERE m.id_contrato = c.id
  AND m.id_postulacion IS NULL;

ALTER TABLE mensajes ALTER COLUMN id_contrato DROP NOT NULL;

-- Falla (y revierte todo) si quedó algún mensaje sin postulación.
ALTER TABLE mensajes ALTER COLUMN id_postulacion SET NOT NULL;

CREATE INDEX IF NOT EXISTS mensajes_id_postulacion_idx ON mensajes (id_postulacion);

-- =========================================================
-- 4. NOTIFICACIONES
-- =========================================================

-- 'nueva_postulacion' viejas: id_referencia es el id del trabajador. Se cruza
-- con las postulaciones de ese trabajador a trabajos del contratante; si hay
-- más de una, desempata el título guardado ("Nueva postulación para "X"").
UPDATE notificaciones n
SET datos = COALESCE(n.datos, '{}'::jsonb) || jsonb_build_object('id_trabajo', m.id_trabajo, 'id_postulacion', m.id_postulacion)
FROM (
  SELECT DISTINCT ON (n2.id)
    n2.id AS id_notif,
    p.id_trabajo,
    p.id AS id_postulacion
  FROM notificaciones n2
  JOIN trabajos t ON t.id_contratante = n2.id_usuario
  JOIN postulaciones p
    ON p.id_trabajo = t.id
   AND p.id_trabajador = (n2.datos->>'id_referencia')::int
  WHERE n2.tipo = 'nueva_postulacion'
    AND n2.datos->>'id_postulacion' IS NULL
  -- IS TRUE: si el título fuera NULL, la comparación da NULL y en un DESC
  -- quedaría primero.
  ORDER BY n2.id, (n2.datos->>'titulo' = 'Nueva postulación para "' || t.titulo || '"') IS TRUE DESC, p.postulado_en DESC
) m
WHERE n.id = m.id_notif;

-- Las que no matchean apuntan a postulaciones ya borradas (cancelaciones del
-- flujo viejo): no llevan a ningún lado.
DELETE FROM notificaciones
WHERE tipo = 'nueva_postulacion'
  AND datos->>'id_postulacion' IS NULL;

-- 'nuevo_mensaje': id_referencia pasa de id_contrato a id_postulacion (la ruta
-- del chat ahora es /chats/:idPostulacion). Se marca con ref_es_postulacion
-- (el backend nuevo también lo guarda) para no
-- re-mapear en una segunda corrida.
UPDATE notificaciones n
SET datos = COALESCE(n.datos, '{}'::jsonb) || jsonb_build_object('id_referencia', c.id_postulacion, 'ref_es_postulacion', true)
FROM contratos c
WHERE n.tipo = 'nuevo_mensaje'
  AND (n.datos->>'ref_es_postulacion') IS NULL
  AND c.id = (n.datos->>'id_referencia')::int;

COMMIT;
