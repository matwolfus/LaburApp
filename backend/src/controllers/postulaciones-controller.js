// backend/src/controllers/postulaciones-controller.js
// Solo HTTP: lee la request, llama a PostulacionesService y responde. Las
// reglas (permisos, estados, transacciones, avisos) viven en el servicio.
// Los errores los responde el middleware central.
import { Router } from 'express';
import PostulacionesService from './../services/postulaciones-service.js';
import authMiddleware from './../middlewares/auth-middleware.js';
import { idParam } from './../middlewares/error-middleware.js';
import { parseId } from './../helpers/http-error.js';

const router = Router();
const service = new PostulacionesService();

router.param('id', idParam);
router.param('idTrabajo', idParam);

// GET /api/postulaciones/trabajo/:idTrabajo -> postulantes (solo el dueño).
router.get('/trabajo/:idTrabajo', authMiddleware, async (req, res) => {
    res.status(200).json(await service.listarPostulantesAsync(req.params.idTrabajo, req.userId));
});

// GET /api/postulaciones/trabajo/:idTrabajo/count -> cantidad (solo el dueño).
router.get('/trabajo/:idTrabajo/count', authMiddleware, async (req, res) => {
    res.status(200).json(await service.contarPostulantesAsync(req.params.idTrabajo, req.userId));
});

// GET /api/postulaciones/mias -> postulaciones propias.
router.get('/mias', authMiddleware, async (req, res) => {
    res.status(200).json(await service.misPostulacionesAsync(req.userId));
});

// POST /api/postulaciones { id_trabajo, precio_propuesto? }
// El estado NO se toma del body: siempre arranca 'pendiente'.
router.post('/', authMiddleware, async (req, res) => {
    const idTrabajo = parseId(req.body?.id_trabajo, 'id_trabajo');
    const id = await service.postularseAsync(idTrabajo, req.userId, req.body?.precio_propuesto);
    res.status(201).json({ id });
});

// PATCH /api/postulaciones/:id/aceptar -> el dueño del trabajo elige a este postulante.
router.patch('/:id/aceptar', authMiddleware, async (req, res) => {
    await service.aceptarAsync(req.params.id, req.userId);
    res.status(200).json({ message: 'Postulacion aceptada' });
});

// PATCH /api/postulaciones/:id/cancelar -> el trabajador se baja.
router.patch('/:id/cancelar', authMiddleware, async (req, res) => {
    const { trabajoEnEspera } = await service.cancelarAsync(req.params.id, req.userId);
    res.status(200).json({ message: 'Postulacion cancelada', trabajoEnEspera });
});

// PATCH /api/postulaciones/:id/reconfirmar { sigue } -> después de que el trabajo se reabrió.
router.patch('/:id/reconfirmar', authMiddleware, async (req, res) => {
    const sigue = req.body?.sigue === true;
    await service.reconfirmarAsync(req.params.id, req.userId, sigue);
    res.status(200).json({ message: sigue ? 'Postulacion reactivada' : 'Postulacion retirada' });
});

export default router;
