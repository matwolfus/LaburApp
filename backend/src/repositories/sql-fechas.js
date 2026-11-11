// backend/src/repositories/sql-fechas.js
// "Ahora" en hora argentina, para usar en las consultas en lugar de NOW().
//
// Las columnas de fecha son timestamp SIN zona horaria y toda la app asume
// hora argentina (programado_para lo carga el usuario en hora local, el front
// muestra lo que recibe tal cual). Pero el servidor de Postgres corre en UTC,
// así que un NOW() pelado guardaba 3 horas de más. Usar SIEMPRE esto.
// (Los DEFAULT de las tablas se corrigen en db/migracion-fechas-argentina.sql.)
export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

export const AHORA = `(NOW() AT TIME ZONE '${ZONA_HORARIA}')`;
