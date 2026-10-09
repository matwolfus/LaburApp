import { Router } from 'express';

import NotificacionesService
    from './../services/notificaciones-service.js';

import authMiddleware
    from './../middlewares/auth-middleware.js';

import PostulacionesService
    from './../services/postulaciones-service.js';

const router = Router();

const service = new NotificacionesService();

const postulacionesService = new PostulacionesService();


// =========================================================
// GET NOTIFICACIONES DEL USUARIO LOGUEADO
// =========================================================

router.get('/', authMiddleware, async (req, res) => {

    try {

        // Así las reconfirmaciones vencidas ya no muestran los botones.
        await postulacionesService.expirarReconfirmacionesAsync();

        const notificaciones =
            await service.getByUsuarioAsync(req.userId);

        return res.status(200).json(notificaciones);

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Error obteniendo notificaciones'
        });
    }
});


// =========================================================
// CANTIDAD DE NO LEIDAS (badge de la campanita)
// =========================================================

router.get('/no-leidas/count', authMiddleware, async (req, res) => {

    try {

        const count =
            await service.getNoLeidasCountAsync(req.userId);

        return res.status(200).json({ count });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Error obteniendo notificaciones no leidas'
        });
    }
});


// =========================================================
// MARCAR TODAS COMO LEIDAS (al entrar a la pantalla)
// Debe declararse ANTES de '/:id/leido'.
// =========================================================

router.patch('/leidas', authMiddleware, async (req, res) => {

    try {

        await service.marcarTodasLeidasAsync(req.userId);

        return res.status(200).json({
            message: 'Notificaciones marcadas como leidas'
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Error marcando notificaciones como leidas'
        });
    }
});


// =========================================================
// MARCAR NOTIFICACION COMO LEIDA
// =========================================================

router.patch('/:id/leido', authMiddleware, async (req, res) => {

    try {

        const id = req.params.id;

        const notificacion = await service.getByIdAsync(id);

        if (!notificacion) {

            return res.status(404).json({
                message: 'Notificacion no encontrada'
            });
        }

        // Solo el dueño de la notificación puede marcarla como leída.
        if (Number(notificacion.id_usuario) !== req.userId) {

            return res.status(403).json({
                message: 'No autorizado'
            });
        }

        await service.marcarLeidoAsync(id);

        return res.status(200).json({
            message: 'Notificacion marcada como leida'
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Error marcando notificacion como leida'
        });
    }
});

export default router;
