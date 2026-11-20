// backend/src/controllers/trabajos-controller.js
// Solo HTTP: lee la request, llama a TrabajosService y responde. Las reglas
// (dueño, estados, transacciones, avisos) viven en el servicio. Los errores
// los responde el middleware central (middlewares/error-middleware.js).
import { Router } from 'express';
import TrabajosService from '../services/trabajos-service.js';
import Trabajo from '../entities/trabajo.js';
import authMiddleware, { optionalAuthMiddleware } from '../middlewares/auth-middleware.js';
import { idParam } from '../middlewares/error-middleware.js';
import { parseOptionalId } from '../helpers/http-error.js';

const router = Router();
const service = new TrabajosService();

// Valida :id (entero positivo) en todas las rutas que lo usan.
router.param('id', idParam);

// Arma la entidad a partir del body. id_contratante sale del token, NO del
// body. estado va en null: en el alta usa el DEFAULT de la tabla ('abierto')
// y en la edición no se toca.
function trabajoDesdeBody(b, userId) {
  return new Trabajo(
    userId,
    b.id_categoria,
    b.titulo,
    b.descripcion,
    b.id_localidad,
    b.presupuesto,
    null,
    b.programado_para,
    b.prioridad,
    b.duracion,
    b.direccion,
    b.lat,
    b.lng
  );
}

// GET /api/trabajos/ofertas -> pantalla "Ofertas": todas las publicaciones del contratador.
router.get('/ofertas', authMiddleware, async (req, res) => {
  res.json(await service.getAllJobsAsync(req.userId));
});

// GET /api/trabajos/contratador -> "Tus trabajos" de la home.
// Debe declararse ANTES de '/:id' para que no lo capture la ruta con parámetro.
router.get('/contratador', authMiddleware, async (req, res) => {
  res.json(await service.getJobsByEmployerAsync(req.userId));
});

// POST /api/trabajos -> "Publicar trabajo".
router.post('/', authMiddleware, async (req, res) => {
  const b = req.body ?? {};
  const id = await service.createJobAsync(trabajoDesdeBody(b, req.userId), b.imagenes ?? []);
  res.status(201).json({ id });
});

// PUT /api/trabajos/:id -> "Guardar cambios" (solo el dueño, trabajo no cerrado).
router.put('/:id', authMiddleware, async (req, res) => {
  const b = req.body ?? {};
  await service.updateJobAsync(req.params.id, req.userId, trabajoDesdeBody(b, req.userId), b.imagenes ?? []);
  res.status(200).json({ id: req.params.id });
});

// PATCH /api/trabajos/:id/completar -> el contratador marca su trabajo como completado.
router.patch('/:id/completar', authMiddleware, async (req, res) => {
  await service.completarAsync(req.params.id, req.userId);
  res.status(200).json({ id: req.params.id });
});

// PATCH /api/trabajos/:id/cancelar -> el contratador cancela su trabajo.
router.patch('/:id/cancelar', authMiddleware, async (req, res) => {
  await service.cancelarAsync(req.params.id, req.userId);
  res.status(200).json({ id: req.params.id });
});

// PATCH /api/trabajos/:id/reabrir { programado_para } -> reabre un trabajo en espera.
router.patch('/:id/reabrir', authMiddleware, async (req, res) => {
  await service.reabrirAsync(req.params.id, req.userId, req.body?.programado_para);
  res.status(200).json({ id: req.params.id });
});

// GET /api/trabajos/buscar?categoria=&provincia=&localidad= (todos opcionales)
// -> trabajos abiertos. Auth opcional: con sesión se excluyen los propios.
// Debe declararse ANTES de '/:id'.
router.get('/buscar', optionalAuthMiddleware, async (req, res) => {
  res.json(await service.buscarAbiertosAsync({
    idCategoria: parseOptionalId(req.query.categoria, 'categoria'),
    idProvincia: parseOptionalId(req.query.provincia, 'provincia'),
    idLocalidad: parseOptionalId(req.query.localidad, 'localidad'),
    idExcluirContratante: req.userId ?? null,
  }));
});

// GET /api/trabajos/:id -> detalle público (con sesión, incluye el precio
// propuesto propio si el que pregunta es un postulante).
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  res.status(200).json(await service.getJobByIdOrFail(req.params.id, req.userId ?? null));
});

export default router;
