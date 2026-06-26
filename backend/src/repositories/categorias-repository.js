// TODO: categorias repository
// categorias-repository.js

import Db from './db-pg.js';

export default class CategoriasRepository {

    constructor() {
        this.db = new Db();
    }

    async getWorkersByCategory(idCategoria) {

        const sql = `
            SELECT
                u.id,
                u.nombre_completo,
                u.prom_calif_trabajador,
                COUNT(c.id) AS trabajos_realizados
            FROM usuarios u
            INNER JOIN contratos c
                ON c.id_trabajador = u.id
            INNER JOIN trabajos t
                ON t.id = c.id_trabajo
            WHERE t.id_categoria = $1
            GROUP BY
                u.id,
                u.nombre_completo,
                u.prom_calif_trabajador
            ORDER BY trabajos_realizados DESC
        `;

        return await this.db.queryAll(
            sql,
            [idCategoria]
        );
    }

    async getCategoryById(idCategoria) {

        const sql = `
            SELECT
                id,
                nombre
            FROM categorias
            WHERE id = $1
        `;

        return await this.db.queryOne(
            sql,
            [idCategoria]
        );
    }
}