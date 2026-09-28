// backend/src/controllers/resenas-controller.js
import { Router } from 'express';
import ResenasService from '../services/resenas-service.js';
import NotificacionesService from '../services/notificaciones-service.js';
import authMiddleware from '../middlewares/auth-middleware.js';

const router = Router();
const service = new ResenasService();
const notificacionesService = new NotificacionesService();

// GET /api/resenas/elegibilidad/:idTrabajo -> si el usuario logueado puede
// dejar (o ya dejó) una reseña sobre ese trabajo.
router.get('/elegibilidad/:idTrabajo', authMiddleware, async (req, res) => {
  try {
    const elegibilidad = await service.getElegibilidadAsync(req.params.idTrabajo, req.userId);
    res.json(elegibilidad);
  } catch (error) {
    console.error('Error in GET /resenas/elegibilidad/:idTrabajo:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/resenas -> deja una reseña sobre un trabajo ya completado.
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { id_trabajo, calificacion, comentario } = req.body;

    const resultado = await service.crearResenaAsync(id_trabajo, req.userId, calificacion, comentario);

    // Notificación DESPUÉS del insert, en su propio try/catch (mismo
    // criterio que el resto del código): un fallo acá no debe convertir una
    // reseña ya guardada en un error para el usuario.
    try {
      await notificacionesService.crearAsync({
        id_usuario: resultado.idReceptor,
        tipo: 'nueva_resena',
        titulo: 'Recibiste una nueva reseña',
        cuerpo: null,
        id_referencia: id_trabajo,
      });
    } catch (notifError) {
      console.error('Error notificando nueva reseña:', notifError);
    }

    return res.status(201).json({ id: resultado.id });
  } catch (error) {
    console.error('Error in POST /resenas:', error.message);
    return res.status(400).json({ error: error.message });
  }
});

export default router;
