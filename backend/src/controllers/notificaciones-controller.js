import { Router } from 'express';
import NotificacionesService from './../services/notificaciones-service.js';
import PostulacionesService from './../services/postulaciones-service.js';
import authMiddleware from './../middlewares/auth-middleware.js';
import { idParam } from './../middlewares/error-middleware.js';
import { forbidden, notFound } from './../helpers/http-error.js';

const router = Router();
const service = new NotificacionesService();
const postulacionesService = new PostulacionesService();

router.param('id', idParam);

// GET /api/notificaciones -> las del usuario logueado
router.get('/', authMiddleware, async (req, res) => {
    // Así las reconfirmaciones vencidas ya no muestran los botones.
    await postulacionesService.expirarReconfirmacionesAsync();
    res.status(200).json(await service.getByUsuarioAsync(req.userId));
});

// GET /api/notificaciones/no-leidas/count -> badge de la campanita
router.get('/no-leidas/count', authMiddleware, async (req, res) => {
    const count = await service.getNoLeidasCountAsync(req.userId);
    res.status(200).json({ count });
});

// PATCH /api/notificaciones/leidas -> marca todas como leídas (al entrar a la pantalla).
// Debe declararse ANTES de '/:id/leido'.
router.patch('/leidas', authMiddleware, async (req, res) => {
    await service.marcarTodasLeidasAsync(req.userId);
    res.status(200).json({ message: 'Notificaciones marcadas como leidas' });
});

// PATCH /api/notificaciones/:id/leido -> solo el dueño puede marcarla.
router.patch('/:id/leido', authMiddleware, async (req, res) => {
    const id = req.params.id;
    const notificacion = await service.getByIdAsync(id);

    if (!notificacion) throw notFound('Notificación no encontrada');
    if (Number(notificacion.id_usuario) !== req.userId) throw forbidden();

    await service.marcarLeidoAsync(id);
    res.status(200).json({ message: 'Notificacion marcada como leida' });
});

export default router;
