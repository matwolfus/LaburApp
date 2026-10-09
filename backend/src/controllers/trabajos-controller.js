// TODO: trabajos controller
// backend/src/controllers/trabajos-controller.js
import { Router } from 'express';
import TrabajosService from '../services/trabajos-service.js';
import Trabajo from '../entities/trabajo.js';
import authMiddleware, { optionalAuthMiddleware } from '../middlewares/auth-middleware.js';
import NotificacionesService from '../services/notificaciones-service.js';

const router = Router();
const service = new TrabajosService();
const notificacionesService = new NotificacionesService();

// router.get('/proximas'): Recibe el request, saca el employer_id de la URL, si no viene devuelve error 400, 
// si viene llama al service para traer próximos, devuelve la lista, si algo explota devuelve error 500.
// router.get('/activas'): Igual que proximas pero trae los activos.

// GET /api/trabajos/proximas -> el contratador sale del token, no de la query.
router.get('/proximas', authMiddleware, async (req, res) => {
  try {
    const jobs = await service.getUpcomingJobsAsync(req.userId);
    res.json(jobs);
  } catch (error) {
    console.error('Error in GET /proximas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/trabajos/activas -> el contratador sale del token, no de la query.
router.get('/activas', authMiddleware, async (req, res) => {
  try {
    const jobs = await service.getActiveJobsAsync(req.userId);
    res.json(jobs);
  } catch (error) {
    console.error('Error in GET /activas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ACÁ AGREGUÉ
// GET /api/trabajos/ofertas?employer_id=1 -> pantalla "Ofertas": TODAS las publicaciones
// del contratante (sin filtrar por estado), para que una changua recién publicada
// ('abierto') aparezca ahí también, no solo 'proxima'/'activa'.
router.get('/ofertas', authMiddleware, async (req, res) => {
  try {
    const jobs = await service.getAllJobsAsync(req.userId);
    res.json(jobs);
  } catch (error) {
    console.error('Error in GET /ofertas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ACÁ YA NO

// ACÁ AGREGUÉ
// GET /api/trabajos/contratador?employer_id=1  -> "Tus Trabajos" de la home
// Debe declararse ANTES de '/:id' para que no lo capture la ruta con parámetro.
router.get('/contratador', authMiddleware, async (req, res) => {
  try {
    const jobs = await service.getJobsByEmployerAsync(req.userId);
    res.json(jobs);
  } catch (error) {
    console.error('Error in GET /contratador:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ACÁ YA NO

// ACÁ AGREGUÉ
// POST /api/trabajos -> "Publicar tarea" (pantalla "Nuevo trabajo").
// No choca con GET /:id: son métodos HTTP distintos.
router.post('/', authMiddleware, async (req, res) => {
  try {
    const b = req.body;

    const entity = new Trabajo(
      req.userId,        // id_contratante: sale del token, NO del body (evita falsear el dueño)
      b.id_categoria,
      b.titulo,
      b.descripcion,
      b.id_localidad,
      b.presupuesto,
      null,            // estado: se omite a propósito -> usa el DEFAULT de la tabla ('abierto')
      b.programado_para,
      b.prioridad,
      b.duracion,
      b.direccion,
      b.lat,
      b.lng
    );

    const newId = await service.createJobAsync(entity, b.imagenes ?? []);

    return res.status(201).json({ id: newId });
  } catch (error) {
    // Las validaciones del service tiran Error -> las tratamos como 400 (bad request).
    console.error('Error in POST /trabajos:', error.message);
    return res.status(400).json({ error: error.message });
  }
});
// ACÁ YA NO

// ACÁ AGREGUÉ
// PUT /api/trabajos/:id -> "Guardar cambios" (pantalla "Editar trabajo").
// Solo el dueño del trabajo puede editarlo.
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id;

    const owner = await service.getJobOwnerAsync(jobId);
    if (owner === null) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }
    if (Number(owner) !== req.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const b = req.body;

    const entity = new Trabajo(
      req.userId,        // id_contratante: sale del token, NO del body
      b.id_categoria,
      b.titulo,
      b.descripcion,
      b.id_localidad,
      b.presupuesto,
      null,            // estado: no se edita acá
      b.programado_para,
      b.prioridad,
      b.duracion,
      b.direccion,
      b.lat,
      b.lng
    );

    await service.updateJobAsync(jobId, entity, b.imagenes ?? []);

    return res.status(200).json({ id: jobId });
  } catch (error) {
    console.error('Error in PUT /trabajos/:id:', error.message);
    return res.status(400).json({ error: error.message });
  }
});
// ACÁ YA NO

// PATCH /api/trabajos/:id/completar -> el contratador marca su trabajo
// 'activa' como completado (cierra también el contrato asociado).
router.patch('/:id/completar', authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id;

    const job = await service.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    const owner = await service.getJobOwnerAsync(jobId);
    if (Number(owner) !== req.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const resultado = await service.completarTrabajoAsync(jobId, job.estado);

    // Notificación DESPUÉS del commit, en su propio try/catch (mismo
    // criterio que cancelar/aceptar): avisa a ambas partes que ya pueden
    // dejarse una reseña mutuamente.
    try {
      await notificacionesService.crearAsync({
        id_usuario: owner,
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
  } catch (error) {
    console.error('Error in PATCH /trabajos/:id/completar:', error.message);
    return res.status(400).json({ error: error.message });
  }
});

// PATCH /api/trabajos/:id/cancelar -> el contratador cancela su propio
// trabajo (mientras no esté ya 'finalizado' o 'cancelado').
router.patch('/:id/cancelar', authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id;

    const job = await service.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    const owner = await service.getJobOwnerAsync(jobId);
    if (Number(owner) !== req.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const resultado = await service.cancelarTrabajoAsync(jobId, job.estado);

    // Notificaciones DESPUÉS del commit, en su propio try/catch (mismo
    // criterio que 'postulacion_aceptada'/'postulacion_rechazada' en
    // postulaciones-controller.js): un fallo acá no debe deshacer ni
    // reportar como error una cancelación que ya quedó guardada.
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
  } catch (error) {
    console.error('Error in PATCH /trabajos/:id/cancelar:', error.message);
    return res.status(400).json({ error: error.message });
  }
});

// PATCH /api/trabajos/:id/reabrir { programado_para } -> el contratador
// reabre un trabajo que quedó 'en_espera' porque el trabajador aceptado
// canceló. Los postulantes rechazados automáticamente reciben una
// notificación para reconfirmar su interés.
router.patch('/:id/reabrir', authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id;

    const job = await service.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    if (Number(job.id_contratante) !== req.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const resultado = await service.reabrirTrabajoAsync(jobId, job.estado, req.body?.programado_para);

    if (!resultado) {
      return res.status(400).json({ error: 'Solo se puede reabrir un trabajo en espera' });
    }

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
  } catch (error) {
    console.error('Error in PATCH /trabajos/:id/reabrir:', error.message);
    return res.status(400).json({ error: error.message });
  }
});

// GET /api/trabajos/buscar?categoria=&provincia=&localidad= (todos
// opcionales) -> trabajos abiertos, para que un trabajador los descubra (Home / Buscar Trabajos). Sin auth: cualquiera
// puede navegar changas abiertas sin loguearse, igual que el detalle público.
// Debe declararse ANTES de '/:id' por el mismo motivo que el resto.
// Auth opcional: sin sesión sigue siendo público; con sesión se excluyen
// los trabajos que publicó el propio usuario.
router.get('/buscar', optionalAuthMiddleware, async (req, res) => {
  try {
    const jobs = await service.buscarAbiertosAsync({
      idCategoria: req.query.categoria,
      idProvincia: req.query.provincia,
      idLocalidad: req.query.localidad,
      idExcluirContratante: req.userId ?? null,
    });
    res.json(jobs);
  } catch (error) {
    console.error('Error in GET /buscar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', optionalAuthMiddleware, async (req, res) => {


  const jobId = req.params.id;


  const job =
    await service.getJobById(jobId, req.userId ?? null);


  if (!job) {


    return res.status(404).json({
      message: 'Trabajo no encontrado'
    });
  }


  return res.status(200).json(job);
});


export default router;