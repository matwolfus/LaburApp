import { Router } from 'express';

import NotificacionesService
    from './../services/notificaciones-service.js';

import authMiddleware
    from './../middlewares/auth-middleware.js';

const router = Router();

const service = new NotificacionesService();


// =========================================================
// GET NOTIFICACIONES DEL USUARIO LOGUEADO
// =========================================================

router.get('/', authMiddleware, async (req, res) => {

    try {

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
