// backend/src/repositories/postulaciones-repository.js
// Acceso a la tabla postulaciones. Solo escribe postulaciones: los cambios en
// trabajos y contratos los hacen sus propios repositorios, y el servicio arma
// la transacción. Los métodos que escriben reciben `db` opcional para correr
// dentro de esa transacción.
import Db from './db-pg.js';
import { AHORA } from './sql-fechas.js';
import { cantidadComoTrabajador, promedioComoTrabajador } from './sql-calificaciones.js';
import { PLAZO_RECONFIRMACION_DIAS } from '../domain/estados.js';

// Postulaciones que el contratador ve como "postulantes": las retiradas y
// las que esperan reconfirmación no cuentan (no se pueden aceptar). La usan
// la lista de postulantes y todos los conteos, para que coincidan.
export const FILTRO_POSTULANTES_VISIBLES = "p.estado NOT IN ('retirado', 'por_reconfirmar')";

export default class PostulacionesRepository {

    constructor() {
        this.db = new Db();
    }

    // =========================================================
    // LECTURAS
    // =========================================================

    // Postulantes de un trabajo (pantalla del contratador).
    getByTrabajoIdAsync = async (idTrabajo) => {
        const sql = `
            SELECT
                p.id,
                p.id_trabajo,
                p.id_trabajador,
                p.precio_propuesto,
                p.estado,
                p.postulado_en,

                u.nombre_completo,
                u.url_avatar,
                u.biografia_trabajador AS biografia,
                ${promedioComoTrabajador('u.id')} AS calificacion,
                ${cantidadComoTrabajador('u.id')} AS count_resenas,

                l.nombre AS localidad,
                pr.nombre AS provincia

            FROM postulaciones p
            INNER JOIN usuarios u ON p.id_trabajador = u.id
            LEFT JOIN localidades l ON u.id_localidad = l.id
            LEFT JOIN provincias pr ON l.id_provincia = pr.id

            WHERE p.id_trabajo = $1
              AND ${FILTRO_POSTULANTES_VISIBLES}

            ORDER BY p.postulado_en DESC
        `;

        return await this.db.queryAll(sql, [idTrabajo]);
    }

    // Postulaciones propias de un trabajador (pantalla "Mis postulaciones").
    getByTrabajadorIdAsync = async (idTrabajador) => {
        const sql = `
            SELECT
                p.id,
                p.id_trabajo,
                p.id_trabajador,
                p.precio_propuesto,
                p.estado,
                p.postulado_en,
                p.reconfirmar_hasta,

                t.titulo AS titulo_trabajo,
                t.id_contratante,
                t.estado AS estado_trabajo,
                t.presupuesto AS presupuesto_trabajo,
                t.programado_para,
                t.direccion,

                c.nombre AS categoria,

                (SELECT MIN(i.url_imagen) FROM imagenes_trabajo i WHERE i.id_trabajo = t.id) AS image_url

            FROM postulaciones p
            INNER JOIN trabajos t ON p.id_trabajo = t.id
            LEFT JOIN categorias c ON c.id = t.id_categoria

            WHERE p.id_trabajador = $1

            ORDER BY p.postulado_en DESC
        `;

        return await this.db.queryAll(sql, [idTrabajador]);
    }

    getByIdAsync = async (id) => {
        return await this.db.queryOne(
            `SELECT id, id_trabajo, id_trabajador, precio_propuesto, estado, reconfirmar_hasta
             FROM postulaciones
             WHERE id = $1`,
            [id]
        );
    }

    // "Barrio, Provincia" del trabajador, para el aviso al contratador.
    getLocalidadTrabajadorAsync = async (idTrabajador) => {
        const row = await this.db.queryOne(
            `SELECT l.nombre AS localidad, pr.nombre AS provincia
             FROM usuarios u
             LEFT JOIN localidades l ON l.id = u.id_localidad
             LEFT JOIN provincias pr ON pr.id = l.id_provincia
             WHERE u.id = $1`,
            [idTrabajador]
        );

        return [row?.localidad, row?.provincia].filter(Boolean).join(', ') || null;
    }

    getNombreTrabajadorAsync = async (idTrabajador) => {
        const row = await this.db.queryOne(
            `SELECT nombre_completo FROM usuarios WHERE id = $1`,
            [idTrabajador]
        );

        return row?.nombre_completo ?? 'Un trabajador';
    }

    // =========================================================
    // ESCRITURAS
    // =========================================================

    // Crea la postulación como 'pendiente'. Si el trabajador ya se había
    // postulado y la retiró, el UNIQUE (id_trabajo, id_trabajador) impide
    // un INSERT nuevo: se "revive" la misma fila. Si la fila existente NO
    // está retirada, no vuelve ningún id (= "ya te postulaste").
    crearPendienteAsync = async ({ idTrabajo, idTrabajador, precioPropuesto }) => {
        return await this.db.queryReturnId(
            `INSERT INTO postulaciones (id_trabajo, id_trabajador, precio_propuesto, estado, postulado_en)
             VALUES ($1, $2, $3, 'pendiente', ${AHORA})
             ON CONFLICT (id_trabajo, id_trabajador) DO UPDATE
             SET
                 precio_propuesto   = EXCLUDED.precio_propuesto,
                 estado             = 'pendiente',
                 postulado_en       = ${AHORA},
                 rechazo_automatico = FALSE,
                 reconfirmar_hasta  = NULL
             WHERE postulaciones.estado = 'retirado'
             RETURNING id`,
            [idTrabajo, idTrabajador, precioPropuesto]
        );
    }

    // Pasa una postulación pendiente a aceptada. Devuelve null si ya no
    // estaba pendiente (otra request la cambió en el medio).
    aceptarAsync = async (idPostulacion, db = this.db) => {
        return await db.queryReturnId(
            `UPDATE postulaciones SET estado = 'aceptado'
             WHERE id = $1 AND estado = 'pendiente'
             RETURNING id`,
            [idPostulacion]
        );
    }

    // Rechaza las postulaciones todavía abiertas de un trabajo (menos
    // `exceptoId`, si viene). `automatico` = las rechazó el sistema al aceptar
    // a otro: si ese otro después se baja y el trabajo se reabre, estas
    // reciben la reconfirmación. Devuelve los ids de trabajador a avisar.
    rechazarAbiertasDeTrabajoAsync = async (idTrabajo, { exceptoId = null, automatico }, db = this.db) => {
        const rows = await db.queryAll(
            `UPDATE postulaciones
             SET estado = 'rechazado', rechazo_automatico = $3, reconfirmar_hasta = NULL
             WHERE id_trabajo = $1
               AND ($2::int IS NULL OR id <> $2)
               AND estado IN ('pendiente', 'por_reconfirmar')
             RETURNING id_trabajador`,
            [idTrabajo, exceptoId, automatico]
        );
        return rows.map((r) => r.id_trabajador);
    }

    // El trabajador se baja: queda 'retirado' (no se borra, así se
    // conservan el historial y el chat en solo lectura).
    retirarAsync = async (idPostulacion, db = this.db) => {
        return await db.queryReturnId(
            `UPDATE postulaciones
             SET estado = 'retirado', reconfirmar_hasta = NULL
             WHERE id = $1 AND estado <> 'retirado'
             RETURNING id`,
            [idPostulacion]
        );
    }

    // Al reabrir un trabajo: los postulantes que el sistema rechazó al
    // aceptar a otro pasan a 'por_reconfirmar' con un plazo para responder.
    pasarAReconfirmarAsync = async (idTrabajo, db = this.db) => {
        return await db.queryAll(
            `UPDATE postulaciones
             SET estado = 'por_reconfirmar',
                 reconfirmar_hasta = ${AHORA} + make_interval(days => $2)
             WHERE id_trabajo = $1 AND estado = 'rechazado' AND rechazo_automatico = TRUE
             RETURNING id, id_trabajador`,
            [idTrabajo, PLAZO_RECONFIRMACION_DIAS]
        );
    }

    // Respuesta a la reconfirmación: "Sigo interesado" -> pendiente,
    // "Ya no me interesa" -> retirado.
    // $2::varchar explícito: sin el cast, Postgres no puede deducir un único
    // tipo para $2 (se usa como varchar en el SET y como text en el CASE) y
    // la consulta fallaba con "inconsistent types deduced for parameter $2".
    reconfirmarAsync = async (idPostulacion, sigue) => {
        return await this.db.queryReturnId(
            `UPDATE postulaciones
             SET
                 estado = $2::varchar,
                 rechazo_automatico = CASE WHEN $2::varchar = 'pendiente' THEN FALSE ELSE rechazo_automatico END,
                 reconfirmar_hasta = NULL
             WHERE id = $1 AND estado = 'por_reconfirmar'
             RETURNING id`,
            [idPostulacion, sigue ? 'pendiente' : 'retirado']
        );
    }

    // Sin respuesta en el plazo -> se toma como "Ya no me interesa". No hay
    // cron: se llama antes de leer (postulantes, postulaciones propias,
    // notificaciones). También marca respondidas las notificaciones de esas
    // reconfirmaciones, para que ya no muestren los botones.
    expirarReconfirmaciones = async () => {
        await this.db.queryAll(`
            WITH vencidas AS (
                UPDATE postulaciones
                SET estado = 'retirado', reconfirmar_hasta = NULL
                WHERE estado = 'por_reconfirmar' AND reconfirmar_hasta < ${AHORA}
                RETURNING id
            )
            UPDATE notificaciones n
            SET datos = n.datos || '{"respondida": "true"}'::jsonb
            WHERE n.tipo = 'reconfirmar_postulacion'
              AND (n.datos->>'id_postulacion')::int IN (SELECT id FROM vencidas)
        `);
    }
}
