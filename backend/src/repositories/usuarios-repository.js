import Db from './db-pg.js';

export default class UsuariosRepository {

    constructor() {
        this.db = new Db();
    }

    async getByEmail(email) {
        const sql = `
            SELECT id, email, contrasena, ultimo_rol AS rol
            FROM usuarios
            WHERE email = $1
        `;
        return await this.db.queryOne(sql, [email]);
    }

    async createUser(nombre, apellido, email, telefono, contrasena, rol) {
        const sql = `
            INSERT INTO usuarios (
                nombre_completo, email, telefono, contrasena, ultimo_rol, creado_en, actualizado_en
            )
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING id
        `;
        return await this.db.queryReturnId(sql, [`${nombre} ${apellido}`, email, telefono, contrasena, rol]);
    }

    async getById(id) {
        const sql = `
            SELECT id, nombre_completo, url_avatar, ultimo_rol AS rol
            FROM usuarios
            WHERE id = $1
        `;
        return await this.db.queryOne(sql, [id]);
    }

    // Trabajadores recomendados para la home del contratador ("Recomendados").
    async getRecommendedWorkers(limit = 10) {
        const sql = `
            SELECT
                id,
                nombre_completo                           AS name,
                url_avatar                                AS photo_url,
                biografia_trabajador                      AS description,
                COALESCE(prom_calif_trabajador, 0)::float AS rating
            FROM usuarios
            WHERE ultimo_rol = 'trabajador'
            ORDER BY rating DESC
            LIMIT $1
        `;
        return await this.db.queryAll(sql, [limit]);
    }

    // Reemplaza el set completo de categorías que ofrece el usuario (no es un append).
    async setCategorias(idUsuario, categoriaIds) {
        const uniqueIds = [...new Set(categoriaIds)];

        return await this.db.withTransaction(async (tx) => {
            await tx.queryAll('DELETE FROM usuario_categoria WHERE id_usuario = $1', [idUsuario]);

            for (const idCategoria of uniqueIds) {
                await tx.queryAll(
                    'INSERT INTO usuario_categoria (id_usuario, id_categoria) VALUES ($1, $2)',
                    [idUsuario, idCategoria]
                );
            }

            return uniqueIds;
        });
    }

    // Trabajadores que ofrecen una categoría determinada, para la pantalla "Buscar".
    async searchByCategoria(idCategoria) {
        const sql = `
            SELECT
                u.id,
                u.nombre_completo                           AS name,
                u.url_avatar                                AS photo_url,
                u.biografia_trabajador                      AS description,
                COALESCE(u.prom_calif_trabajador, 0)::float AS rating
            FROM usuarios u
            JOIN usuario_categoria uc ON uc.id_usuario = u.id
            WHERE uc.id_categoria = $1
              AND u.ultimo_rol   = 'trabajador'
            ORDER BY rating DESC
        `;
        return await this.db.queryAll(sql, [idCategoria]);
    }
}
