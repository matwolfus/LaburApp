import { Router } from 'express';
import { validarIdNumerico } from '../middlewares/error-middleware.js';

import NotificacionesService
    from './../services/notificaciones-service.js';

import authMiddleware
    from './../middlewares/auth-middleware.js';

import PostulacionesService
    from './../services/postulaciones-service.js';

const router = Router();

router.param('id', validarIdNumerico);

const service = new NotificacionesService();

const postulacionesService = new PostulacionesService();


// =========================================================
// GET NOTIFICACIONES DEL USUARIO LOGUEADO
// =========================================================

router.get('/', authMiddleware, async (req, res, next) => {

    try {

        // Así las reconfirmaciones vencidas ya no muestran los botones.
        await postulacionesService.expirarReconfirmacionesAsync();

        const notificaciones =
            await service.getByUsuarioAsync(req.userId);

        return res.status(200).json(notificaciones);

    } catch (error) {
        next(error);
    }
});


// =========================================================
// CANTIDAD DE NO LEIDAS (badge de la campanita)
// =========================================================

router.get('/no-leidas/count', authMiddleware, async (req, res, next) => {

    try {

        const count =
            await service.getNoLeidasCountAsync(req.userId);

        return res.status(200).json({ count });

    } catch (error) {
        next(error);
    }
});


// =========================================================
// MARCAR TODAS COMO LEIDAS (al entrar a la pantalla)
// Debe declararse ANTES de '/:id/leido'.
// =========================================================

router.patch('/leidas', authMiddleware, async (req, res, next) => {

    try {

        await service.marcarTodasLeidasAsync(req.userId);

        return res.status(200).json({
            message: 'Notificaciones marcadas como leidas'
        });

    } catch (error) {
        next(error);
    }
});


// =========================================================
// MARCAR NOTIFICACION COMO LEIDA
// =========================================================

router.patch('/:id/leido', authMiddleware, async (req, res, next) => {

    try {

        const id = req.params.id;

        const notificacion = await service.getByIdAsync(id);

        if (!notificacion) {

            return res.status(404).json({
                error: 'Notificacion no encontrada'
            });
        }

        // Solo el dueño de la notificación puede marcarla como leída.
        if (Number(notificacion.id_usuario) !== req.userId) {

            return res.status(403).json({
                error: 'No autorizado'
            });
        }

        await service.marcarLeidoAsync(id);

        return res.status(200).json({
            message: 'Notificacion marcada como leida'
        });

    } catch (error) {
        next(error);
    }
});

export default router;
