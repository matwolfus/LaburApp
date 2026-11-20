// backend/src/configs/jwt-config.js
import 'dotenv/config';

// Clave con la que se firman/verifican los JWT. Sin valor por defecto: si
// faltara, cualquiera podría firmar tokens válidos con la clave conocida.
// Se exige al arrancar para que el error se vea en el deploy y no en el primer login.
if (!process.env.JWT_SECRET) {
    throw new Error('Falta la variable de entorno JWT_SECRET (ver backend/.env.template)');
}

export const JWT_SECRET = process.env.JWT_SECRET;

// Duración del token de sesión.
export const JWT_EXPIRES_IN = '7d';
