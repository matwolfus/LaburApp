// backend/src/middlewares/error-middleware.js
import multer from 'multer';
import { parseId } from '../helpers/http-error.js';

// Para router.param: valida :id, :idTrabajo, :idPostulacion antes de llegar al handler.
export function idParam(req, res, next, value, name) {
    parseId(value, name);
    next();
}

// Rutas que no existen: JSON en vez del HTML por defecto de Express.
export function notFoundHandler(req, res) {
    res.status(404).json({ error: 'Ruta no encontrada' });
}

// Único lugar donde se arma la respuesta de error. Formato siempre { error }.
// Express 5 manda acá los errores de los handlers async sin try/catch.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    // Errores de multer (tamaño, cantidad de archivos)
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'La imagen supera los 5 MB' });
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Solo se pueden subir hasta 2 imágenes' });
        }
        return res.status(400).json({ error: 'Error al subir las imágenes' });
    }

    // express.json(): body con JSON mal formado o demasiado grande
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'El cuerpo de la solicitud no es JSON válido' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'El cuerpo de la solicitud es demasiado grande' });
    }

    // Errores esperados (HttpError): el mensaje lo escribimos nosotros, se puede mostrar.
    if (err.expose && Number.isInteger(err.status)) {
        return res.status(err.status).json({ error: err.message });
    }

    // Red de seguridad para datos que se escaparon a las validaciones de los
    // servicios: son errores del cliente, no del servidor. El detalle de
    // Postgres queda en el log, nunca en la respuesta.
    const PG_ERRORES_DEL_CLIENTE = {
        '23503': 'Alguno de los datos hace referencia a algo que no existe', // foreign_key_violation
        '22001': 'Alguno de los textos es demasiado largo',                 // string_data_right_truncation
        '22003': 'Alguno de los números está fuera de rango',               // numeric_value_out_of_range
        '22P02': 'Alguno de los datos tiene un formato inválido',           // invalid_text_representation
        '22007': 'Alguna de las fechas tiene un formato inválido',          // invalid_datetime_format
        '22008': 'Alguna de las fechas está fuera de rango',                // datetime_field_overflow
    };
    if (typeof err.code === 'string' && PG_ERRORES_DEL_CLIENTE[err.code]) {
        console.warn(`Dato inválido en ${req.method} ${req.originalUrl}:`, err.code, err.message);
        return res.status(400).json({ error: PG_ERRORES_DEL_CLIENTE[err.code] });
    }

    // Cualquier otra cosa es un error del servidor: se loguea completo acá y al
    // cliente le llega un mensaje genérico (nada de textos de Postgres/Supabase).
    console.error(`Error en ${req.method} ${req.originalUrl}:`, err);
    return res.status(500).json({ error: 'Error interno del servidor' });
}
