import Db from './db-pg.js';

export default class LocalidadesRepository {

    constructor() {
        this.db = new Db();
    }

    async getAll() {

        const sql = `
            SELECT
                l.id,
                l.nombre,
                p.nombre AS provincia

            FROM localidades l

            INNER JOIN provincias p
                ON p.id = l.id_provincia

            ORDER BY
                p.nombre,
                l.nombre;
        `;

        return await this.db.queryAll(sql);
    }
}