// backend/src/repositories/categorias-repository.js
// ACÁ AGREGUÉ
import Db from './db-pg.js';

export default class CategoriasRepository {
  constructor() {
    this.db = new Db();
  }

  // Devuelve todas las categorías para la grilla "Explorar Categorías".
  // La tabla no tiene columna de ícono, por eso icon va null y el front
  // usa su ícono por defecto (/icons/default-category.png).
  async getAll() {
    const sql = `
      SELECT
        id,
        nombre AS name,
        NULL   AS icon
      FROM categorias
      ORDER BY nombre
    `;
    return await this.db.queryAll(sql);
  }
}
// ACÁ YA NO
