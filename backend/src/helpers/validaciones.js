// backend/src/helpers/validaciones.js
// Validaciones de datos de entrada compartidas por los servicios. Cada una
// devuelve el valor normalizado o tira un HttpError 400 con un mensaje para
// el usuario. Los límites siguen las columnas de la base (varchar(n),
// numeric(10,2)) para que un dato largo no termine en un 500 de Postgres.
import { badRequest } from './http-error.js';

// numeric(10,2): hasta 99.999.999,99
export const PRECIO_MAX = 99999999.99;

export const LIMITES = {
    NOMBRE: 60,             // nombre y apellido por separado (nombre_completo es varchar(120))
    NOMBRE_COMPLETO: 120,
    EMAIL: 255,
    CONTRASENA_MAX: 72,     // bcrypt ignora lo que pase de 72 bytes
    BIOGRAFIA: 1000,
    TITULO: 100,
    DESCRIPCION: 2000,
    DURACION: 50,
    DIRECCION: 255,
    COMENTARIO_RESENA: 1000,
    URL: 500,
    IMAGENES_POR_TRABAJO: 2,
    CATEGORIAS_POR_USUARIO: 20,
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Carácter especial = cualquier cosa que no sea letra o número (misma regla
// que Register.jsx en el front).
export const CARACTER_ESPECIAL_REGEX = /[^A-Za-z0-9]/;

// Texto obligatorio: string no vacío (después de trim) y hasta `max` caracteres.
export function textoRequerido(valor, campo, max) {
    if (typeof valor !== 'string' || !valor.trim()) {
        throw badRequest(`${campo} es obligatorio`);
    }
    const texto = valor.trim();
    if (texto.length > max) {
        throw badRequest(`${campo} no puede superar los ${max} caracteres`);
    }
    return texto;
}

// Texto opcional: null/undefined/vacío -> null; si viene, string de hasta `max`.
export function textoOpcional(valor, campo, max) {
    if (valor === undefined || valor === null) return null;
    if (typeof valor !== 'string') {
        throw badRequest(`${campo} no es válido`);
    }
    const texto = valor.trim();
    if (!texto) return null;
    if (texto.length > max) {
        throw badRequest(`${campo} no puede superar los ${max} caracteres`);
    }
    return texto;
}

// Precio: número > 0 y <= PRECIO_MAX, con hasta 2 decimales (se redondea).
// Opcional: null/undefined/'' -> null.
export function precioOpcional(valor, campo) {
    if (valor === undefined || valor === null || valor === '') return null;
    const n = Number(valor);
    if (!Number.isFinite(n) || n <= 0) {
        throw badRequest(`${campo} debe ser un número mayor a 0`);
    }
    if (n > PRECIO_MAX) {
        throw badRequest(`${campo} no puede superar $${PRECIO_MAX.toLocaleString('es-AR')}`);
    }
    return Math.round(n * 100) / 100;
}

// Email normalizado: trim + minúsculas. Devuelve null si no es válido.
export function normalizarEmail(email) {
    if (typeof email !== 'string') return null;
    const limpio = email.trim().toLowerCase();
    if (limpio.length > LIMITES.EMAIL || !EMAIL_REGEX.test(limpio)) return null;
    return limpio;
}

// Teléfono normalizado: solo dígitos. Devuelve null si no quedan 10.
export function normalizarTelefono(telefono) {
    if (typeof telefono !== 'string' && typeof telefono !== 'number') return null;
    const digitos = String(telefono).replace(/\D/g, '');
    return digitos.length === 10 ? digitos : null;
}
