// backend/src/repositories/db-pg.js
import { pool } from '../configs/db-config.js';

//aca lo que se hace es una cosa general de todos los tipos de consulta que se pueden tener a la BD

export default class Db {
  // devuelve muchas rows
  async queryAll(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows;
  }

  // devuelve una sola row
  async queryOne(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  }

  // Para consultas INSERT que devuelven el ID generado
  async queryReturnId(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows[0]?.id || null;
  }

  // para COUNT queries
  async queryRowCount(sql, params = []) {
    const result = await pool.query(sql, params);
    return parseInt(result.rows[0]?.count || '0', 10);
  }
}