import Db from './db-pg.js';

export default class UsuariosRepository {

    constructor() {
        this.db = new Db();
    }

    async getByEmail(email) {
        const sql = `
            SELECT id, email, contrasena, ultimo_rol
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
            SELECT id, nombre_completo, url_avatar, ultimo_rol
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
            WHERE biografia_trabajador NOT NULL
            ORDER BY rating DESC
            LIMIT $1
        `;
        return await this.db.queryAll(sql, [limit]);
    }

    async getPerfil(idUsuario) {

        const usuario = await this.db.queryOne(`
            SELECT
                u.id,
                u.nombre_completo,
                u.url_avatar,
                u.biografia_trabajador,
                u.biografia_contratante
                u.verificado,
                u.prom_calif_trabajador,
                u.prom_calif_contratante,
                u.creado_en,
                l.nombre AS localidad
            FROM usuarios u
            LEFT JOIN localidades l
                ON l.id = u.id_localidad
            WHERE u.id = $1
        `, [idUsuario]);

        if (!usuario)
            return null;

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

        const cantidadResenas = await this.db.queryOne(`
            SELECT
                COUNT(*)::int AS cantidad
            FROM resenas
            WHERE id_receptor = $1;
        `, [idUsuario]);

        const categorias = await this.db.queryAll(`
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

        const resenas = await this.db.queryAll(`
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

            ORDER BY r.creado_en DESC
            LIMIT 10;
        `, [idUsuario]);

        return {
            id: usuario.id,
            nombreCompleto: usuario.nombre_completo,
            avatar: usuario.url_avatar,
            localidad: usuario.localidad,
            verificado: usuario.verificado,
            biografia_contratante: usuario.biografia_contratante,
            biografia_trabajador: usuario.biografia_trabajador,
            miembroDesde: usuario.creado_en,

            ratingTrabajador: usuario.prom_calif_trabajador,
            ratingContratante: usuario.prom_calif_contratante,

            trabajosRealizados: contratos.trabajos_realizados,
            trabajosPublicados: contratos.trabajos_publicados,
            cantidadResenas: cantidadResenas.cantidad,

            categorias: categorias.map(c => c.nombre),

            resenas: resenas.map(r => ({
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
            url_avatar = $6
        WHERE id = $7
        RETURNING
            id,
            nombre_completo,
            telefono,
            biografia,
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
