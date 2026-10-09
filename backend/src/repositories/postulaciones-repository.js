// TODO: postulaciones repository
import Db from './db-pg.js';

export default class PostulacionesRepository {

    constructor() {
        this.db = new Db();
    }

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
                u.prom_calif_trabajador,

                l.nombre AS localidad,
                pr.nombre AS provincia,

                COUNT(r.id) AS count_resenas

            FROM postulaciones p

            INNER JOIN usuarios u
                ON p.id_trabajador = u.id

            LEFT JOIN localidades l
                ON u.id_localidad = l.id

            LEFT JOIN provincias pr
                ON l.id_provincia = pr.id

            LEFT JOIN resenas r
                ON r.id_receptor = u.id

            WHERE p.id_trabajo = $1
              -- Retiradas o esperando reconfirmación: el contratante no las puede aceptar.
              AND p.estado NOT IN ('retirado', 'por_reconfirmar')

            GROUP BY
                p.id,
                u.id,
                l.nombre,
                pr.nombre

            ORDER BY p.postulado_en DESC
        `;

        return await this.db.queryAll(sql, [idTrabajo]);
    }

    // Postulaciones propias de un trabajador (pantalla "Mis postulaciones" /
    // "Estado de trabajos"). Mismo estilo que getByTrabajoIdAsync, pero el
    // JOIN es contra trabajos (para traer título/categoría de la changa) en
    // vez de contra usuarios.
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
                t.programado_para,
                t.direccion,

                c.nombre AS categoria,

                (SELECT MIN(i.url_imagen) FROM imagenes_trabajo i WHERE i.id_trabajo = t.id) AS image_url

            FROM postulaciones p

            INNER JOIN trabajos t
                ON p.id_trabajo = t.id

            LEFT JOIN categorias c
                ON c.id = t.id_categoria

            WHERE p.id_trabajador = $1

            ORDER BY p.postulado_en DESC
        `;

        return await this.db.queryAll(sql, [idTrabajador]);
    }

    // Trae una postulación por su id (para chequear de quién es antes de
    // borrarla/aceptarla). precio_propuesto se usa al aceptar, para armar
    // el contrato (ver acceptAsync).
    getByIdAsync = async (id) => {

        const sql = `
            SELECT id, id_trabajo, id_trabajador, precio_propuesto, estado, reconfirmar_hasta
            FROM postulaciones
            WHERE id = $1
        `;

        return await this.db.queryOne(sql, [id]);
    }

    getCountByTrabajoIdAsync = async (idTrabajo) => {

        const sql = `
            SELECT COUNT(*) AS total
            FROM postulaciones
            WHERE id_trabajo = $1
        `;

        return await this.db.queryOne(sql, [idTrabajo]);
    }

    // Si el trabajador ya se había postulado y después retiró la postulación,
    // el UNIQUE (id_trabajo, id_trabajador) impide un INSERT nuevo: en ese
    // caso se "revive" la misma fila como pendiente. Si la fila existente NO
    // está retirada, el DO UPDATE no aplica y no vuelve ningún id (el
    // controller lo trata como "ya te postulaste").
    createAsync = async (entity) => {

        const sql = `
            INSERT INTO postulaciones (
                id_trabajo,
                id_trabajador,
                precio_propuesto,
                estado,
                postulado_en
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                NOW()
            )
            ON CONFLICT (id_trabajo, id_trabajador) DO UPDATE
            SET
                precio_propuesto   = EXCLUDED.precio_propuesto,
                estado             = 'pendiente',
                postulado_en       = NOW(),
                rechazo_automatico = FALSE,
                reconfirmar_hasta  = NULL
            WHERE postulaciones.estado = 'retirado'
            RETURNING id
        `;

        const values = [
            entity?.id_trabajo ?? 0,
            entity?.id_trabajador ?? 0,
            entity?.precio_propuesto ?? null,
            entity?.estado ?? 'pendiente'
        ];

        return await this.db.queryReturnId(sql, values);
    }

    deleteByIdAsync = async (id) => {

        const sql = `
            DELETE FROM postulaciones
            WHERE id = $1
            RETURNING id
        `;

        const deletedId = await this.db.queryReturnId(sql, [id]);

        return deletedId != null ? 1 : 0;
    }

    // Acepta una postulación: la marca 'aceptado', rechaza al resto de
    // postulaciones pendientes de esa misma changa, pasa el trabajo a
    // 'activa' y crea el contrato correspondiente. Las 4 actualizaciones
    // van en una sola transacción para que no quede un estado intermedio
    // inconsistente si algo falla a mitad de camino.
    acceptAsync = async (idPostulacion, idTrabajo, idContratante, idTrabajador, precioAcordado) => {

        return await this.db.withTransaction(async (txDb) => {

            await txDb.queryAll(
                `UPDATE postulaciones SET estado = 'aceptado' WHERE id = $1`,
                [idPostulacion]
            );

            // RETURNING id_trabajador: el controller necesita saber a quién
            // avisar (notificación 'postulacion_rechazada'), sin otra query.
            // rechazo_automatico = true: si el aceptado después cancela y el
            // contratante reabre el trabajo, estos postulantes reciben la
            // reconfirmación (ver reabrir en trabajos-repository).
            const rechazados = await txDb.queryAll(
                `UPDATE postulaciones
                 SET estado = 'rechazado', rechazo_automatico = TRUE, reconfirmar_hasta = NULL
                 WHERE id_trabajo = $1 AND id <> $2 AND estado IN ('pendiente', 'por_reconfirmar')
                 RETURNING id_trabajador`,
                [idTrabajo, idPostulacion]
            );

            await txDb.queryAll(
                `UPDATE trabajos SET estado = 'activa' WHERE id = $1`,
                [idTrabajo]
            );

            await txDb.queryAll(
                `INSERT INTO contratos (id_trabajo, id_postulacion, id_contratante, id_trabajador, precio_acordado, estado, iniciado_en)
                 VALUES ($1, $2, $3, $4, $5, 'activo', NOW())`,
                [idTrabajo, idPostulacion, idContratante, idTrabajador, precioAcordado]
            );

            return rechazados.map((row) => row.id_trabajador);
        });
    }

    // Cancelación por parte del trabajador (no borra la fila: queda
    // 'retirado', así el historial y el chat se conservan).
    // - pendiente / por_reconfirmar -> retirado.
    // - aceptado -> retirado + contrato 'cancelado' + trabajo 'en_espera'
    //   (el contratante decide si lo reabre).
    // Todo en una transacción. Devuelve si el trabajo quedó en espera.
    cancelarAsync = async (postulacion) => {

        return await this.db.withTransaction(async (txDb) => {

            await txDb.queryAll(
                `UPDATE postulaciones
                 SET estado = 'retirado', reconfirmar_hasta = NULL
                 WHERE id = $1`,
                [postulacion.id]
            );

            if (postulacion.estado !== 'aceptado') {
                return { trabajoEnEspera: false };
            }

            await txDb.queryAll(
                `UPDATE contratos SET estado = 'cancelado'
                 WHERE id_postulacion = $1 AND estado = 'activo'`,
                [postulacion.id]
            );

            await txDb.queryAll(
                `UPDATE trabajos SET estado = 'en_espera', actualizado_en = NOW()
                 WHERE id = $1 AND estado = 'activa'`,
                [postulacion.id_trabajo]
            );

            return { trabajoEnEspera: true };
        });
    }

    // Respuesta a la reconfirmación: "Sigo interesado" -> pendiente,
    // "Ya no me interesa" -> retirado.
    reconfirmarAsync = async (idPostulacion, sigue) => {

        const sql = `
            UPDATE postulaciones
            SET
                estado = $2,
                rechazo_automatico = CASE WHEN $2 = 'pendiente' THEN FALSE ELSE rechazo_automatico END,
                reconfirmar_hasta = NULL
            WHERE id = $1 AND estado = 'por_reconfirmar'
            RETURNING id
        `;

        return await this.db.queryReturnId(sql, [idPostulacion, sigue ? 'pendiente' : 'retirado']);
    }

    // Sin respuesta en el plazo -> se toma como "Ya no me interesa". Mismo
    // patrón "chequeo al leer" que expirarVencidos (no hay cron): se llama
    // antes de listar postulantes, postulaciones propias y notificaciones.
    // También marca como respondidas las notificaciones de reconfirmación de
    // esas postulaciones, para que ya no muestren los botones.
    expirarReconfirmaciones = async () => {

        await this.db.queryAll(`
            WITH vencidas AS (
                UPDATE postulaciones
                SET estado = 'retirado', reconfirmar_hasta = NULL
                WHERE estado = 'por_reconfirmar' AND reconfirmar_hasta < (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')
                RETURNING id
            )
            UPDATE notificaciones n
            SET datos = n.datos || '{"respondida": "true"}'::jsonb
            WHERE n.tipo = 'reconfirmar_postulacion'
              AND (n.datos->>'id_postulacion')::int IN (SELECT id FROM vencidas)
        `);
    }

    // "Barrio, Provincia" del trabajador, para mostrar en la notificación
    // 'nueva_postulacion' del contratante.
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
}
