// backend/src/configs/jwt-config.js
// Clave con la que se firman/verifican los JWT.
// En producción (Vercel) es obligatoria: con la clave por defecto, que está
// en el repo, cualquiera podría firmar tokens válidos. En local se usa el
// default para no trabar el desarrollo.
const esProduccion = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

if (!process.env.JWT_SECRET && esProduccion) {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar-en-prod';

// Duración del token de sesión.
export const JWT_EXPIRES_IN = '7d';
