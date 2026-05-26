// backend/src/configs/db-config.js
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});