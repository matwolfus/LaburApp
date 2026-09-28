import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../configs/jwt-config.js';

// Verifica el JWT que llega en el header "Authorization: Bearer <token>".
// Si es válido, adjunta req.userId y req.rol y sigue; si no, corta con 401.
export default function authMiddleware(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'NO_TOKEN' });
    }

    const token = header.slice(7);

    // jwt.verify LANZA excepción si el token es inválido o está vencido
    // (no devuelve null), por eso va sí o sí dentro de try/catch.
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = payload.userId;
        req.rol = payload.rol;
        next();
    } catch {
        return res.status(401).json({ error: 'INVALID_TOKEN' });
    }
}

// Variante de authMiddleware para rutas públicas que igual quieren saber
// quién pregunta CUANDO hay sesión (ej. GET /trabajos/:id: cualquiera puede
// ver el detalle sin loguearse, pero si el que pregunta es un trabajador con
// una postulación propia pendiente, el detalle le muestra SU precio
// propuesto). Nunca corta la request: sin token o con uno inválido, sigue
// igual pero sin req.userId/req.rol.
export function optionalAuthMiddleware(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return next();
    }

    try {
        const payload = jwt.verify(header.slice(7), JWT_SECRET);
        req.userId = payload.userId;
        req.rol = payload.rol;
    } catch {
        // Token presente pero inválido/vencido: se ignora, sigue como anónimo.
    }

    next();
}
