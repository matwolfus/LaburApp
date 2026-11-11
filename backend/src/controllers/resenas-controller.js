// backend/src/controllers/resenas-controller.js
// Solo HTTP. Reglas (elegibilidad, validaciones, avisos) en ResenasService.
import { Router } from 'express';
import ResenasService from '../services/resenas-service.js';
import authMiddleware from '../middlewares/auth-middleware.js';
import { idParam } from '../middlewares/error-middleware.js';
import { parseId } from '../helpers/http-error.js';

const router = Router();
const service = new ResenasService();

router.param('idTrabajo', idParam);

// GET /api/resenas/elegibilidad/:idTrabajo -> si el usuario logueado puede
// dejar (o ya dejó) una reseña sobre ese trabajo.
router.get('/elegibilidad/:idTrabajo', authMiddleware, async (req, res) => {
  res.json(await service.getElegibilidadAsync(req.params.idTrabajo, req.userId));
});

// POST /api/resenas -> deja una reseña sobre un trabajo ya completado.
router.post('/', authMiddleware, async (req, res) => {
  const idTrabajo = parseId(req.body?.id_trabajo, 'id_trabajo');
  const { calificacion, comentario } = req.body ?? {};
  const id = await service.crearResenaAsync(idTrabajo, req.userId, calificacion, comentario);
  res.status(201).json({ id });
});

export default router;
