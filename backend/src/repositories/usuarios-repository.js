import Db from './db-pg.js';

export default class UsuariosRepository {

    constructor() {
        this.db = new Db();
    }

    // Actualiza el "modo activo" del usuario (alternar contratador/trabajador
    // desde el toggle de Perfil). No toca ninguna otra columna.
    async updateUltimoRol(idUsuario, rol) {
        const sql = `
            UPDATE usuarios
            SET ultimo_rol = $2, actualizado_en = NOW()
            WHERE id = $1
            RETURNING id, ultimo_rol AS rol
        `;
        return await this.db.queryOne(sql, [idUsuario, rol]);
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
                nombre_completo,
                email,
                telefono,
                contrasena,
                ultimo_rol,
                creado_en,
                actualizado_en
            )
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING id
        `;

        return await this.db.queryReturnId(sql, [
            `${nombre} ${apellido}`,
            email,
            telefono,
            contrasena,
            rol
        ]);
    }

    async getById(id) {
        const sql = `
            SELECT
                id,
                nombre_completo,
                url_avatar,
                ultimo_rol AS rol
            FROM usuarios
            WHERE id = $1
        `;

        return await this.db.queryOne(sql, [id]);
    }

    // Trabajadores recomendados para la home.
    async getRecommendedWorkers(limit = 10) {
        const sql = `
            SELECT
                id,
                nombre_completo AS name,
                url_avatar AS photo_url,
                biografia_trabajador AS description,
                COALESCE(prom_calif_trabajador, 0)::float AS rating
            FROM usuarios
            WHERE biografia_trabajador IS NOT NULL
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

    async getPerfil(idUsuario) {

        const usuario = await this.db.queryOne(`
            SELECT
                u.id,
                u.nombre_completo,
                u.telefono,
                u.url_avatar,
                u.id_localidad,
                u.biografia_trabajador,
                u.biografia_contratante,
                u.verificado,
                u.creado_en,
                u.ultimo_rol,
                l.nombre AS localidad

            FROM usuarios u

            LEFT JOIN localidades l
                ON l.id = u.id_localidad

            WHERE u.id = $1
        `, [idUsuario]);

        if (!usuario) {
            return null;
        }

        const contratos = await this.db.queryOne(`
            SELECT

                COUNT(*) FILTER (
                    WHERE id_trabajador = $1
                    AND estado = 'completado'
                )::int AS trabajos_realizados,

                COUNT(*) FILTER (
                    WHERE id_contratante = $1
                    AND estado = 'completado'
                )::int AS trabajos_publicados

            FROM contratos;
        `, [idUsuario]);

        // Se calcula en vivo con AVG en vez de leer prom_calif_trabajador/
        // prom_calif_contratante de la tabla usuarios: esas columnas existen
        // pero nunca se escriben (no hay trigger ni servicio que las
        // mantenga), así que quedarían siempre en su valor default/viejo.
        const resenasStats = await this.db.queryOne(`
            SELECT

                COUNT(*) FILTER (
                    WHERE es_contratante = false
                )::int AS trabajador,

                COUNT(*) FILTER (
                    WHERE es_contratante = true
                )::int AS contratante,

                AVG(calificacion) FILTER (
                    WHERE es_contratante = false
                )::float AS prom_trabajador,

                AVG(calificacion) FILTER (
                    WHERE es_contratante = true
                )::float AS prom_contratante

            FROM resenas

            WHERE id_receptor = $1;
        `, [idUsuario]);

        // ========= CATEGORÍAS =========

        // Categorías que el propio usuario eligió ofrecer (editable desde
        // "Editar perfil"), separado del historial de en qué trabajó/contrató
        // abajo (categoriasTrabaja/categoriasContrata, que es de solo lectura).
        const categoriasOfrecidas = await this.db.queryAll(`
            SELECT c.id, c.nombre
            FROM usuario_categoria uc
            INNER JOIN categorias c ON c.id = uc.id_categoria
            WHERE uc.id_usuario = $1
            ORDER BY c.nombre;
        `, [idUsuario]);

                const categoriasTrabaja = await this.db.queryAll(`
            SELECT DISTINCT
                c.nombre

            FROM contratos co

            INNER JOIN trabajos t
                ON t.id = co.id_trabajo

            INNER JOIN categorias c
                ON c.id = t.id_categoria

            WHERE co.id_trabajador = $1

            ORDER BY c.nombre;
        `, [idUsuario]);

        const categoriasContrata = await this.db.queryAll(`
            SELECT DISTINCT
                c.nombre

            FROM contratos co

            INNER JOIN trabajos t
                ON t.id = co.id_trabajo

            INNER JOIN categorias c
                ON c.id = t.id_categoria

            WHERE co.id_contratante = $1

            ORDER BY c.nombre;
        `, [idUsuario]);

        // ========= RESEÑAS =========

        const resenasTrabajador = await this.db.queryAll(`
            SELECT
                r.id,
                r.calificacion,
                r.comentario,
                r.creado_en,

                u.id AS autor_id,
                u.nombre_completo,
                u.url_avatar

            FROM resenas r

            INNER JOIN usuarios u
                ON u.id = r.id_autor

            WHERE r.id_receptor = $1
              AND r.es_contratante = false

            ORDER BY r.creado_en DESC
            LIMIT 10;
        `, [idUsuario]);

        const resenasContratante = await this.db.queryAll(`
            SELECT
                r.id,
                r.calificacion,
                r.comentario,
                r.creado_en,

                u.id AS autor_id,
                u.nombre_completo,
                u.url_avatar

            FROM resenas r

            INNER JOIN usuarios u
                ON u.id = r.id_autor

            WHERE r.id_receptor = $1
              AND r.es_contratante = true

            ORDER BY r.creado_en DESC
            LIMIT 10;
        `, [idUsuario]);

        return {
            id: usuario.id,
            nombreCompleto: usuario.nombre_completo,
            telefono: usuario.telefono,
            avatar: usuario.url_avatar,
            localidad: usuario.localidad,
            idLocalidad: usuario.id_localidad,
            verificado: usuario.verificado,

            biografiaTrabajador: usuario.biografia_trabajador,
            biografiaContratante: usuario.biografia_contratante,

            miembroDesde: usuario.creado_en,

            ultimoRol: usuario.ultimo_rol,

            ratingTrabajador: resenasStats.prom_trabajador,
            ratingContratante: resenasStats.prom_contratante,

            trabajosRealizados: contratos.trabajos_realizados,
            trabajosPublicados: contratos.trabajos_publicados,

            cantidadResenasTrabajador: resenasStats.trabajador,
            cantidadResenasContratante: resenasStats.contratante,

            categoriasOfrecidas: categoriasOfrecidas.map(c => ({ id: c.id, nombre: c.nombre })),
            categoriasTrabaja: categoriasTrabaja.map(c => c.nombre),
            categoriasContrata: categoriasContrata.map(c => c.nombre),
                        resenasTrabajador: resenasTrabajador.map(r => ({
                id: r.id,
                calificacion: r.calificacion,
                comentario: r.comentario,
                fecha: r.creado_en,
                autor: {
                    id: r.autor_id,
                    nombre: r.nombre_completo,
                    avatar: r.url_avatar
                }
            })),

            resenasContratante: resenasContratante.map(r => ({
                id: r.id,
                calificacion: r.calificacion,
                comentario: r.comentario,
                fecha: r.creado_en,
                autor: {
                    id: r.autor_id,
                    nombre: r.nombre_completo,
                    avatar: r.url_avatar
                }
            }))
        };
    }

    async updatePerfil(idUsuario, datos) {

        const {
            nombreCompleto,
            telefono,
            biografia_contratante,
            biografia_trabajador,
            idLocalidad,
            avatar
        } = datos;

        const result = await this.db.queryOne(`
            UPDATE usuarios
            SET
                nombre_completo = $1,
                telefono = $2,
                biografia_contratante = $3,
                biografia_trabajador = $4,
                id_localidad = $5,
                url_avatar = $6,
                actualizado_en = NOW()
            WHERE id = $7
            RETURNING
                id,
                nombre_completo,
                telefono,
                biografia_contratante,
                biografia_trabajador,
                id_localidad,
                url_avatar;
        `, [
            nombreCompleto,
            telefono,
            biografia_contratante,
            biografia_trabajador,
            idLocalidad,
            avatar,
            idUsuario
        ]);

        return result;
    }

}
