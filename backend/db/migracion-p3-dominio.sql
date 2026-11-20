-- Migración P3: reglas del dominio también en la base.
-- Se corre a mano en el SQL Editor de Supabase. Es idempotente.
--
--   1. Se elimina el estado 'proxima' (era igual a 'abierto'; el código ya no
--      lo usa). Si quedara alguna fila, pasa a 'abierto'.
--   2. CHECK sobre trabajos.estado y trabajos.prioridad: los mismos valores
--      que domain/estados.js. Así un bug o un INSERT a mano no pueden dejar
--      un trabajo en un estado que la app no conoce.
--   3. Precio de las postulaciones: desde el P3 toda postulación guarda su
--      precio (si se postuló "al precio publicado", una copia del presupuesto
--      de ese momento). Las viejas con precio_propuesto NULL se completan con
--      el presupuesto actual del trabajo, que es lo que se usaba al aceptar.

BEGIN;

-- 1. 'proxima' -> 'abierto'
UPDATE trabajos SET estado = 'abierto' WHERE estado = 'proxima';

-- 2. CHECKs (se borran antes por si ya existían, así se puede re-correr)
ALTER TABLE trabajos DROP CONSTRAINT IF EXISTS trabajos_estado_check;
ALTER TABLE trabajos ADD CONSTRAINT trabajos_estado_check
    CHECK (estado IN ('abierto', 'activa', 'en_espera', 'finalizado', 'cancelado', 'vencido'));

ALTER TABLE trabajos DROP CONSTRAINT IF EXISTS trabajos_prioridad_check;
ALTER TABLE trabajos ADD CONSTRAINT trabajos_prioridad_check
    CHECK (prioridad IN ('normal', 'urgente'));

-- 3. Precio de postulaciones viejas
UPDATE postulaciones p
SET precio_propuesto = t.presupuesto
FROM trabajos t
WHERE t.id = p.id_trabajo
  AND p.precio_propuesto IS NULL
  AND t.presupuesto IS NOT NULL;

COMMIT;
