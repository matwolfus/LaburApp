// backend/src/repositories/perfil-repository.js
// Perfil público de un usuario (pantallas "Mi perfil" y "Ver perfil"): datos,
// estadísticas, categorías, insignias y reseñas en ambos roles. Separado de
// usuarios-repository porque es una lectura grande que junta varias tablas.
import Db from './db-pg.js';

export default class PerfilRepository {

    constructor() {
        this.db = new Db();
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
                l.nombre AS localidad,
                l.id_provincia,
                pr.nombre AS provincia

            FROM usuarios u

            LEFT JOIN localidades l
                ON l.id = u.id_localidad

            LEFT JOIN provincias pr
                ON pr.id = l.id_provincia

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
        // mantenga). Misma regla que sql-calificaciones.js (el resto de las
        // pantallas): si cambia acá, cambiar allá.
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
              -- Solo contratos que se cumplieron: uno cancelado no es "trabajó en".
              AND co.estado = 'completado'

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
              AND co.estado = 'completado'

            ORDER BY c.nombre;
        `, [idUsuario]);

        // Insignias: categorías en las que el usuario COMPLETÓ trabajos como
        // trabajador. Se filtra por el CONTRATO completado, no solo por el
        // trabajo finalizado: si el trabajador aceptado canceló y el trabajo lo
        // terminó otro, su contrato quedó 'cancelado' y la insignia no le toca.
        const insignias = await this.db.queryAll(`
            SELECT DISTINCT
                c.id,
                c.nombre

            FROM contratos co

            INNER JOIN trabajos t
                ON t.id = co.id_trabajo

            INNER JOIN categorias c
                ON c.id = t.id_categoria

            WHERE co.id_trabajador = $1
              AND co.estado = 'completado'

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
            provincia: usuario.provincia,
            idProvincia: usuario.id_provincia,
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
            insignias: insignias.map(c => ({ id: c.id, nombre: c.nombre })),
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
}
