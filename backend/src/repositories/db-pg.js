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

  // Corre varias queries dentro de una sola transacción (BEGIN/COMMIT/ROLLBACK) usando un
  // client dedicado, para operaciones que tienen que confirmarse o revertirse juntas.
  // fn recibe un objeto con la misma forma (queryAll/queryOne/queryReturnId) atado a ese client.
  async withTransaction(fn) {
    const client = await pool.connect();
    const txDb = {
      queryAll: async (sql, params = []) => (await client.query(sql, params)).rows,
      queryOne: async (sql, params = []) => (await client.query(sql, params)).rows[0] || null,
      queryReturnId: async (sql, params = []) => (await client.query(sql, params)).rows[0]?.id || null,
    };

    try {
      await client.query('BEGIN');
      const result = await fn(txDb);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}