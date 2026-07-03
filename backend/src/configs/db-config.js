// backend/src/configs/db-config.js
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { Pool } = pg;

// 1114 = timestamp without time zone. Estas columnas (programado_para, creado_en, etc.)
// no tienen offset guardado: toda la app asume una única timezone (Argentina), así que
// evitamos que node-postgres las reinterprete con la timezone del proceso (eso duplicaba
// el corrimiento horario). Devolvemos el string tal cual, en formato ISO local (sin "Z").
pg.types.setTypeParser(1114, (value) => value.replace(' ', 'T'));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});