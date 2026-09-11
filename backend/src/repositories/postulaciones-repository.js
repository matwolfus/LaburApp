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

                t.titulo AS titulo_trabajo,
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
            SELECT id, id_trabajo, id_trabajador, precio_propuesto
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
            const rechazados = await txDb.queryAll(
                `UPDATE postulaciones
                 SET estado = 'rechazado'
                 WHERE id_trabajo = $1 AND id <> $2 AND estado = 'pendiente'
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
}
