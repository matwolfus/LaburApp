// backend/src/configs/jwt-config.js
// Clave con la que se firman/verifican los JWT.
// TODO: en producción definir JWT_SECRET en el .env (nunca dejar el default hardcodeado).
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar-en-prod';

// Duración del token de sesión.
export const JWT_EXPIRES_IN = '7d';
