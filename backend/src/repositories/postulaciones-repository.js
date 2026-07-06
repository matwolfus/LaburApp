// TODO: postulaciones repository
import { pool } from './../configs/db-config.js';

export default class PostulacionesRepository {

    getByTrabajoIdAsync = async (idTrabajo) => {

        let returnArray = null;

        try {

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
                    u.biografia,
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

            const values = [idTrabajo];

            const result = await pool.query(sql, values);

            returnArray = result.rows;

        } catch (error) {

            console.log(error);
        }

        return returnArray;
    }

    // Trae una postulación por su id (para chequear de quién es antes de borrarla).
    getByIdAsync = async (id) => {

        let returnEntity = null;

        try {

            const sql = `
                SELECT id, id_trabajo, id_trabajador
                FROM postulaciones
                WHERE id = $1
            `;

            const result = await pool.query(sql, [id]);

            returnEntity = result.rows[0] ?? null;

        } catch (error) {

            console.log(error);
        }

        return returnEntity;
    }

    getCountByTrabajoIdAsync = async (idTrabajo) => {

        let returnEntity = null;

        try {

            const sql = `
                SELECT COUNT(*) AS total
                FROM postulaciones
                WHERE id_trabajo = $1
            `;

            const values = [idTrabajo];

            const result = await pool.query(sql, values);

            returnEntity = result.rows[0];

        } catch (error) {

            console.log(error);
        }

        return returnEntity;
    }

    createAsync = async (entity) => {

        let newId = 0;

        try {

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

            const result = await pool.query(sql, values);

            newId = result.rows[0].id;

        } catch (error) {

            console.log(error);
        }

        return newId;
    }

    deleteByIdAsync = async (id) => {

        let rowsAffected = 0;

        try {

            const sql = `
                DELETE FROM postulaciones
                WHERE id = $1
            `;

            const values = [id];

            const result = await pool.query(sql, values);

            rowsAffected = result.rowCount;

        } catch (error) {

            console.log(error);
        }

        return rowsAffected;
    }
}