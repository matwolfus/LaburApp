// backend/src/controllers/resenas-controller.js
import { Router } from 'express';
import ResenasService from '../services/resenas-service.js';
import NotificacionesService from '../services/notificaciones-service.js';
import authMiddleware from '../middlewares/auth-middleware.js';
import { idParam } from '../middlewares/error-middleware.js';
import { parseId } from '../helpers/http-error.js';

const router = Router();
const service = new ResenasService();
const notificacionesService = new NotificacionesService();

router.param('idTrabajo', idParam);

// GET /api/resenas/elegibilidad/:idTrabajo -> si el usuario logueado puede
// dejar (o ya dejó) una reseña sobre ese trabajo.
router.get('/elegibilidad/:idTrabajo', authMiddleware, async (req, res) => {
  const elegibilidad = await service.getElegibilidadAsync(req.params.idTrabajo, req.userId);
  res.json(elegibilidad);
});

// POST /api/resenas -> deja una reseña sobre un trabajo ya completado.
// Los errores de validación (HttpError del service) los responde el middleware central.
router.post('/', authMiddleware, async (req, res) => {
  const { calificacion, comentario } = req.body ?? {};
  const idTrabajo = parseId(req.body?.id_trabajo, 'id_trabajo');

  const resultado = await service.crearResenaAsync(idTrabajo, req.userId, calificacion, comentario);

  // Notificación DESPUÉS del insert, en su propio try/catch: un fallo acá no
  // debe convertir una reseña ya guardada en un error para el usuario.
  try {
    await notificacionesService.crearAsync({
      id_usuario: resultado.idReceptor,
      tipo: 'nueva_resena',
      titulo: 'Recibiste una nueva reseña',
      cuerpo: null,
      id_referencia: idTrabajo,
    });
  } catch (notifError) {
    console.error('Error notificando nueva reseña:', notifError);
  }

  return res.status(201).json({ id: resultado.id });
});

export default router;
