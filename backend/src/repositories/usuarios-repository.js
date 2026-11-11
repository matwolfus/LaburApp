import Db from './db-pg.js';
import { AHORA } from './sql-fechas.js';
import { cantidadComoTrabajador, promedioComoTrabajador } from './sql-calificaciones.js';

export default class UsuariosRepository {

    constructor() {
        this.db = new Db();
    }

    // Actualiza el "modo activo" del usuario (alternar contratador/trabajador
    // desde el toggle de Perfil). No toca ninguna otra columna.
    async updateUltimoRol(idUsuario, rol) {
        const sql = `
            UPDATE usuarios
            SET ultimo_rol = $2, actualizado_en = ${AHORA}
            WHERE id = $1
            RETURNING id, ultimo_rol AS rol
        `;
        return await this.db.queryOne(sql, [idUsuario, rol]);
    }

    // Busca sin distinguir mayúsculas: hay cuentas viejas guardadas con
    // mayúsculas (antes no se normalizaba). Si hubiera dos que solo difieren
    // en mayúsculas, gana la que coincide exacto con el email ya normalizado.
    async getByEmail(email) {
        const sql = `
            SELECT id, email, contrasena, ultimo_rol AS rol
            FROM usuarios
            WHERE lower(trim(email)) = lower(trim($1))
            ORDER BY (email = $1) DESC, id
            LIMIT 1
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
            VALUES ($1, $2, $3, $4, $5, ${AHORA}, ${AHORA})
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
        // rating: NULL si todavía no tiene reseñas (el front muestra "Sin reseñas").
        const sql = `
            SELECT
                u.id,
                u.nombre_completo AS name,
                u.url_avatar AS photo_url,
                u.biografia_trabajador AS description,
                ${promedioComoTrabajador('u.id')} AS rating,
                ${cantidadComoTrabajador('u.id')} AS reviews
            FROM usuarios u
            WHERE u.biografia_trabajador IS NOT NULL
            ORDER BY rating DESC NULLS LAST, reviews DESC
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

    // Trabajadores para la pantalla "Buscar" del contratador. Filtros
    // opcionales y combinables: categoría (oficio que ofrece), provincia y
    // localidad (zona de trabajo = localidad de su perfil). Con filtro de
    // ubicación, los perfiles sin localidad cargada no aparecen.
    async searchTrabajadores({ idCategoria, idProvincia, idLocalidad } = {}) {
        const values = [];
        const filtros = [];

        if (idCategoria) {
            values.push(idCategoria);
            filtros.push(`AND EXISTS (
                SELECT 1 FROM usuario_categoria uc
                WHERE uc.id_usuario = u.id AND uc.id_categoria = $${values.length}
            )`);
        }

        if (idLocalidad) {
            values.push(idLocalidad);
            filtros.push(`AND u.id_localidad = $${values.length}`);
        } else if (idProvincia) {
            values.push(idProvincia);
            filtros.push(`AND l.id_provincia = $${values.length}`);
        }

        const sql = `
            SELECT
                u.id,
                u.nombre_completo                           AS name,
                u.url_avatar                                AS photo_url,
                u.biografia_trabajador                      AS description,
                ${promedioComoTrabajador('u.id')}           AS rating,
                ${cantidadComoTrabajador('u.id')}           AS reviews,
                l.nombre                                    AS localidad,
                pr.nombre                                   AS provincia
            FROM usuarios u
            LEFT JOIN localidades l ON l.id = u.id_localidad
            LEFT JOIN provincias pr ON pr.id = l.id_provincia
            -- "Se ofrece como trabajador": tiene alguna categoría o biografía de
            -- trabajador. No se usa ultimo_rol (el modo activo): si no, un
            -- trabajador que pasa a modo contratador desaparecía del buscador.
            WHERE (
                u.biografia_trabajador IS NOT NULL
                OR EXISTS (SELECT 1 FROM usuario_categoria uc0 WHERE uc0.id_usuario = u.id)
            )
            ${filtros.join('\n            ')}
            ORDER BY rating DESC NULLS LAST, reviews DESC
        `;
        return await this.db.queryAll(sql, values);
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
                actualizado_en = ${AHORA}
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
