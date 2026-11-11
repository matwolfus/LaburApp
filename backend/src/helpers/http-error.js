// backend/src/helpers/http-error.js
// Error con status HTTP. Los servicios y controladores tiran esto cuando el
// problema es del cliente (400, 403, 404, 409...). El middleware de errores
// (middlewares/error-middleware.js) responde { error: message } con ese status.
// Cualquier otro error (Postgres, Supabase, bug) se loguea y se responde como
// un 500 genérico, sin filtrar el mensaje interno.
export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.expose = true;
    }
}

export const badRequest = (message) => new HttpError(400, message);
export const forbidden  = (message = 'No autorizado') => new HttpError(403, message);
export const notFound   = (message) => new HttpError(404, message);
export const conflict   = (message) => new HttpError(409, message);

// Valida que un id (de la URL o del body) sea un entero positivo y lo devuelve
// como Number. Evita que /trabajos/abc termine en un 500 de Postgres.
export function parseId(value, nombre = 'id') {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
        throw badRequest(`El parámetro "${nombre}" no es válido`);
    }
    return n;
}

// Igual que parseId pero para filtros opcionales (?categoria=&localidad=...).
export function parseOptionalId(value, nombre = 'id') {
    return value === undefined || value === null || value === '' ? undefined : parseId(value, nombre);
}
