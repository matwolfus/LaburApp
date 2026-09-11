import Db from './db-pg.js';

// La tabla `notificaciones` guarda el detalle variable (titulo/cuerpo/id_referencia)
// en una sola columna `datos jsonb`, en vez de columnas separadas. Este repository
// empaqueta/desempaqueta ese jsonb para que el resto de la app (service/controller)
// trabaje con campos planos normales.
export default class NotificacionesRepository {

    constructor() {
        this.db = new Db();
    }

    getByUsuarioAsync = async (idUsuario) => {

        const sql = `
            SELECT
                id,
                id_usuario,
                tipo,
                datos->>'titulo'        AS titulo,
                datos->>'cuerpo'        AS cuerpo,
                (datos->>'id_referencia')::int AS id_referencia,
                leido,
                creado_en
            FROM notificaciones
            WHERE id_usuario = $1
            ORDER BY creado_en DESC
        `;

        return await this.db.queryAll(sql, [idUsuario]);
    }

    // Trae una notificación por id (para chequear de quién es antes de marcarla leída).
    getByIdAsync = async (id) => {

        const sql = `
            SELECT id, id_usuario, leido
            FROM notificaciones
            WHERE id = $1
        `;

        return await this.db.queryOne(sql, [id]);
    }

    crearAsync = async (entity) => {

        const sql = `
            INSERT INTO notificaciones (
                id_usuario,
                tipo,
                datos,
                leido,
                creado_en
            )
            VALUES (
                $1,
                $2,
                $3,
                FALSE,
                NOW()
            )
            RETURNING id
        `;

        const datos = JSON.stringify({
            titulo: entity?.titulo ?? null,
            cuerpo: entity?.cuerpo ?? null,
            id_referencia: entity?.id_referencia ?? null,
        });

        const values = [
            entity?.id_usuario ?? null,
            entity?.tipo ?? null,
            datos,
        ];

        return await this.db.queryReturnId(sql, values);
    }

    marcarLeidoAsync = async (id) => {

        const sql = `
            UPDATE notificaciones
            SET leido = TRUE
            WHERE id = $1
            RETURNING id
        `;

        const updatedId = await this.db.queryReturnId(sql, [id]);

        return updatedId != null ? 1 : 0;
    }
}
