-- Migración: fechas automáticas en hora argentina.
-- Se corre a mano en el SQL Editor de Supabase, JUNTO con el deploy del
-- backend que usa AHORA (src/repositories/sql-fechas.js) en vez de NOW().
--
-- Problema: las columnas son timestamp SIN zona horaria y la app asume hora
-- argentina, pero el servidor corre en UTC. Los DEFAULT now() y los NOW() del
-- código guardaban la hora UTC (3 horas más), así que creado_en, enviado_en,
-- etc. se mostraban corridas. programado_para y reconfirmar_hasta ya estaban
-- en hora argentina y NO se tocan.
--
-- Qué hace:
--   1. Cambia los DEFAULT now() a (now() AT TIME ZONE 'America/Argentina/Buenos_Aires').
--   2. Convierte los valores ya guardados de UTC a hora argentina.
--
-- NO es reversible a ciegas, pero tiene guarda: registra que ya corrió en la
-- tabla migraciones_aplicadas y, si se vuelve a correr, no convierte dos veces.

BEGIN;

CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
    nombre      varchar(100) PRIMARY KEY,
    aplicada_en timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
);

-- 1. DEFAULTS (idempotente: se puede repetir sin problema)
ALTER TABLE contratos      ALTER COLUMN creado_en      SET DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires');
ALTER TABLE mensajes       ALTER COLUMN enviado_en     SET DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires');
ALTER TABLE notificaciones ALTER COLUMN creado_en      SET DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires');
ALTER TABLE postulaciones  ALTER COLUMN postulado_en   SET DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires');
ALTER TABLE resenas        ALTER COLUMN creado_en      SET DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires');
ALTER TABLE trabajos       ALTER COLUMN creado_en      SET DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires');
ALTER TABLE trabajos       ALTER COLUMN actualizado_en SET DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires');
ALTER TABLE usuarios       ALTER COLUMN creado_en      SET DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires');
ALTER TABLE usuarios       ALTER COLUMN actualizado_en SET DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires');

-- 2. DATOS EXISTENTES (una sola vez)
-- valor AT TIME ZONE 'UTC'  -> lo interpreta como hora UTC (timestamptz)
-- ... AT TIME ZONE 'America/Argentina/Buenos_Aires' -> lo pasa a hora local sin zona
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM migraciones_aplicadas WHERE nombre = 'fechas-argentina') THEN
        RAISE NOTICE 'fechas-argentina ya se aplicó: no se convierten los datos de nuevo';
        RETURN;
    END IF;

    UPDATE contratos SET
        creado_en     = (creado_en     AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires',
        iniciado_en   = (iniciado_en   AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires',
        completado_en = (completado_en AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires';

    UPDATE mensajes SET
        enviado_en = (enviado_en AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires',
        leido_en   = (leido_en   AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires';

    UPDATE notificaciones SET
        creado_en = (creado_en AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires';

    UPDATE postulaciones SET
        postulado_en = (postulado_en AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires';

    UPDATE resenas SET
        creado_en = (creado_en AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires';

    UPDATE trabajos SET
        creado_en      = (creado_en      AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires',
        actualizado_en = (actualizado_en AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires';

    UPDATE usuarios SET
        creado_en      = (creado_en      AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires',
        actualizado_en = (actualizado_en AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires';

    INSERT INTO migraciones_aplicadas (nombre) VALUES ('fechas-argentina');
END $$;

COMMIT;
