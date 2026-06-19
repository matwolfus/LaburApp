// backend/src/repositories/usuarios-repository.js
// ACÁ AGREGUÉ
import Db from './db-pg.js';

export default class UsuariosRepository {
  constructor() {
    this.db = new Db();
  }

  // Trabajadores recomendados para la home del contratador ("Recomendados").
  // El rating ya viene precalculado en usuarios.prom_calif_trabajador (numeric),
  // por eso no hace falta joinear resenas. Se castea a float para que el driver
  // pg no lo devuelva como string ("4.80") y el front pueda hacer rating.toFixed(1).
  // No existe columna de oficio/profesión: se usa biografia como description.
  async getRecommendedWorkers(limit = 10) {
    const sql = `
      SELECT
        id,
        nombre_completo                           AS name,
        url_avatar                                AS photo_url,
        biografia                                 AS description,
        COALESCE(prom_calif_trabajador, 0)::float AS rating
      FROM usuarios
      WHERE rol = 'trabajador'
      ORDER BY rating DESC
      LIMIT $1
    `;
    return await this.db.queryAll(sql, [limit]);
  }
}
// ACÁ YA NO
