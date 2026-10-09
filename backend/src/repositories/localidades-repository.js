import Db from './db-pg.js';

export default class LocalidadesRepository {

    constructor() {
        this.db = new Db();
    }

    // idProvincia y q (texto, busca por nombre) son opcionales.
    async getAll({ idProvincia, q } = {}) {

        const values = [];
        const filtros = [];

        if (idProvincia) {
            values.push(idProvincia);
            filtros.push(`l.id_provincia = $${values.length}`);
        }

        if (q) {
            values.push(`%${q}%`);
            filtros.push(`l.nombre ILIKE $${values.length}`);
        }

        const sql = `
            SELECT
                l.id,
                l.nombre,
                l.id_provincia,
                p.nombre AS provincia

            FROM localidades l

            INNER JOIN provincias p
                ON p.id = l.id_provincia

            ${filtros.length ? 'WHERE ' + filtros.join(' AND ') : ''}

            ORDER BY
                p.nombre,
                l.nombre;
        `;

        return await this.db.queryAll(sql, values);
    }

    async getProvincias() {

        return await this.db.queryAll(`
            SELECT id, nombre
            FROM provincias
            ORDER BY nombre
        `);
    }
}
