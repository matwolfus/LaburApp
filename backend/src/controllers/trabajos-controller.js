// TODO: trabajos controller
// backend/src/controllers/trabajos-controller.js
import { Router } from 'express';
import TrabajosService from '../services/trabajos-service.js';
import Trabajo from '../entities/trabajo.js';
import authMiddleware from '../middlewares/auth-middleware.js';

const router = Router();
const service = new TrabajosService();

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

    await service.completarTrabajoAsync(jobId, job.estado);

    return res.status(200).json({ id: jobId });
  } catch (error) {
    console.error('Error in PATCH /trabajos/:id/completar:', error.message);
    return res.status(400).json({ error: error.message });
  }
});

// GET /api/trabajos/buscar?categoria=<id> -> trabajos abiertos, para que un
// trabajador los descubra (Home / Buscar Trabajos). Sin auth: cualquiera
// puede navegar changas abiertas sin loguearse, igual que el detalle público.
// Debe declararse ANTES de '/:id' por el mismo motivo que el resto.
router.get('/buscar', async (req, res) => {
  try {
    const jobs = await service.buscarAbiertosAsync(req.query.categoria);
    res.json(jobs);
  } catch (error) {
    console.error('Error in GET /buscar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {


  const jobId = req.params.id;


  const job =
    await service.getJobById(jobId);


  if (!job) {


    return res.status(404).json({
      message: 'Trabajo no encontrado'
    });
  }


  return res.status(200).json(job);
});


export default router;