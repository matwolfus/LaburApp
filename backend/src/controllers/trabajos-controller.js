// backend/src/controllers/trabajos-controller.js
import { Router } from 'express';
import TrabajosService from '../services/trabajos-service.js';
import Trabajo from '../entities/trabajo.js';
import authMiddleware, { optionalAuthMiddleware } from '../middlewares/auth-middleware.js';
import { idParam } from '../middlewares/error-middleware.js';
import { forbidden, notFound, parseOptionalId } from '../helpers/http-error.js';
import NotificacionesService from '../services/notificaciones-service.js';

const router = Router();
const service = new TrabajosService();
const notificacionesService = new NotificacionesService();

// Valida :id (entero positivo) en todas las rutas que lo usan.
router.param('id', idParam);

// Los errores (validaciones del service con HttpError, o fallas del servidor)
// los responde el middleware central de errores (middlewares/error-middleware.js).

// Trae el trabajo y verifica que el usuario logueado sea el dueño.
async function getTrabajoPropio(jobId, userId) {
  const job = await service.getJobById(jobId);
  if (!job) throw notFound('Trabajo no encontrado');
  if (Number(job.id_contratante) !== userId) throw forbidden();
  return job;
}

// Arma la entidad a partir del body. id_contratante sale del token, NO del
// body (evita falsear el dueño). estado va en null: en el alta usa el DEFAULT
// de la tabla ('abierto') y en la edición no se toca.
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

// GET /api/trabajos/proximas -> el contratador sale del token, no de la query.
router.get('/proximas', authMiddleware, async (req, res) => {
  res.json(await service.getUpcomingJobsAsync(req.userId));
});

// GET /api/trabajos/activas -> el contratador sale del token, no de la query.
router.get('/activas', authMiddleware, async (req, res) => {
  res.json(await service.getActiveJobsAsync(req.userId));
});

// GET /api/trabajos/ofertas -> pantalla "Ofertas": TODAS las publicaciones del
// contratante (sin filtrar por estado).
router.get('/ofertas', authMiddleware, async (req, res) => {
  res.json(await service.getAllJobsAsync(req.userId));
});

// GET /api/trabajos/contratador -> "Tus Trabajos" de la home.
// Debe declararse ANTES de '/:id' para que no lo capture la ruta con parámetro.
router.get('/contratador', authMiddleware, async (req, res) => {
  res.json(await service.getJobsByEmployerAsync(req.userId));
});

// POST /api/trabajos -> "Publicar tarea" (pantalla "Nuevo trabajo").
router.post('/', authMiddleware, async (req, res) => {
  const b = req.body ?? {};
  const newId = await service.createJobAsync(trabajoDesdeBody(b, req.userId), b.imagenes ?? []);
  return res.status(201).json({ id: newId });
});

// PUT /api/trabajos/:id -> "Guardar cambios" (pantalla "Editar trabajo").
// Solo el dueño, y no si el trabajo ya está finalizado o cancelado.
router.put('/:id', authMiddleware, async (req, res) => {
  const jobId = req.params.id;
  const job = await getTrabajoPropio(jobId, req.userId);
  const b = req.body ?? {};

  await service.updateJobAsync(jobId, trabajoDesdeBody(b, req.userId), b.imagenes ?? [], job.estado);

  return res.status(200).json({ id: jobId });
});

// PATCH /api/trabajos/:id/completar -> el contratador marca su trabajo
// 'activa' como completado (cierra también el contrato asociado).
router.patch('/:id/completar', authMiddleware, async (req, res) => {
  const jobId = req.params.id;
  const job = await getTrabajoPropio(jobId, req.userId);

  const resultado = await service.completarTrabajoAsync(jobId, job.estado);

  // Notificación DESPUÉS del commit, en su propio try/catch: avisa a ambas
  // partes que ya pueden dejarse una reseña mutuamente.
  try {
    await notificacionesService.crearAsync({
      id_usuario: req.userId,
      tipo: 'trabajo_completado',
      titulo: `Marcaste "${job.title}" como completado. ¡Dejá tu reseña!`,
      cuerpo: null,
      id_referencia: jobId,
    });

    if (resultado?.idTrabajador) {
      await notificacionesService.crearAsync({
        id_usuario: resultado.idTrabajador,
        tipo: 'trabajo_completado',
        titulo: `"${job.title}" se completó. ¡Dejá tu reseña!`,
        cuerpo: null,
        id_referencia: jobId,
      });
    }
  } catch (notifError) {
    console.error('Error notificando trabajo completado:', notifError);
  }

  return res.status(200).json({ id: jobId });
});

// PATCH /api/trabajos/:id/cancelar -> el contratador cancela su propio
// trabajo (mientras no esté ya 'finalizado' o 'cancelado').
router.patch('/:id/cancelar', authMiddleware, async (req, res) => {
  const jobId = req.params.id;
  const job = await getTrabajoPropio(jobId, req.userId);

  const resultado = await service.cancelarTrabajoAsync(jobId, job.estado);

  // Notificaciones DESPUÉS del commit, en su propio try/catch: un fallo acá
  // no debe deshacer ni reportar como error una cancelación ya guardada.
  try {
    for (const idTrabajador of resultado.idsANotificar) {
      await notificacionesService.crearAsync({
        id_usuario: idTrabajador,
        tipo: 'trabajo_cancelado',
        titulo: `El trabajo "${job.title}" fue cancelado por el contratador`,
        cuerpo: null,
        id_referencia: jobId,
      });
    }
  } catch (notifError) {
    console.error('Error notificando cancelación:', notifError);
  }

  return res.status(200).json({ id: jobId });
});

// PATCH /api/trabajos/:id/reabrir { programado_para } -> el contratador
// reabre un trabajo que quedó 'en_espera' porque el trabajador aceptado
// canceló. Los postulantes rechazados automáticamente reciben una
// notificación para reconfirmar su interés.
router.patch('/:id/reabrir', authMiddleware, async (req, res) => {
  const jobId = req.params.id;
  const job = await getTrabajoPropio(jobId, req.userId);

  const resultado = await service.reabrirTrabajoAsync(jobId, job.estado, req.body?.programado_para);

  try {
    for (const p of resultado.aReconfirmar) {
      await notificacionesService.crearAsync({
        id_usuario: p.id_trabajador,
        tipo: 'reconfirmar_postulacion',
        titulo: `"${job.title}" está disponible de nuevo. ¿Seguís interesado?`,
        cuerpo: 'Tenés 2 días para responder. Si no respondés, se toma como que ya no te interesa.',
        id_referencia: Number(jobId),
        extra: { id_postulacion: p.id, id_trabajo: Number(jobId) },
      });
    }
  } catch (notifError) {
    console.error('Error notificando reapertura:', notifError);
  }

  return res.status(200).json({ id: jobId });
});

// GET /api/trabajos/buscar?categoria=&provincia=&localidad= (todos opcionales)
// -> trabajos abiertos, para que un trabajador los descubra. Auth opcional:
// sin sesión es público; con sesión se excluyen los trabajos propios.
// Debe declararse ANTES de '/:id'.
router.get('/buscar', optionalAuthMiddleware, async (req, res) => {
  const jobs = await service.buscarAbiertosAsync({
    idCategoria: parseOptionalId(req.query.categoria, 'categoria'),
    idProvincia: parseOptionalId(req.query.provincia, 'provincia'),
    idLocalidad: parseOptionalId(req.query.localidad, 'localidad'),
    idExcluirContratante: req.userId ?? null,
  });
  res.json(jobs);
});

// GET /api/trabajos/:id -> detalle público (con sesión, incluye el precio
// propuesto propio si el que pregunta es un postulante).
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  const job = await service.getJobById(req.params.id, req.userId ?? null);
  if (!job) throw notFound('Trabajo no encontrado');
  return res.status(200).json(job);
});

export default router;
