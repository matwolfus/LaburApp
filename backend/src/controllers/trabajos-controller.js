// TODO: trabajos controller
// backend/src/controllers/trabajos-controller.js
import { Router } from 'express';
import TrabajosService from '../services/trabajos-service.js';
import Trabajo from '../entities/trabajo.js';

const router = Router();
const service = new TrabajosService();

// router.get('/proximas'): Recibe el request, saca el employer_id de la URL, si no viene devuelve error 400, 
// si viene llama al service para traer próximos, devuelve la lista, si algo explota devuelve error 500.
// router.get('/activas'): Igual que proximas pero trae los activos.

// GET /api/trabajos/proximas?employer_id=1
router.get('/proximas', async (req, res) => {
  try {
    const { employer_id } = req.query;
    if (!employer_id) {
      return res.status(400).json({ error: 'employer_id is required' });
    }
    const jobs = await service.getUpcomingJobsAsync(parseInt(employer_id));
    res.json(jobs);
  } catch (error) {
    console.error('Error in GET /proximas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/trabajos/activas?employer_id=1
router.get('/activas', async (req, res) => {
  try {
    const { employer_id } = req.query;
    if (!employer_id) {
      return res.status(400).json({ error: 'employer_id is required' });
    }
    const jobs = await service.getActiveJobsAsync(parseInt(employer_id));
    res.json(jobs);
  } catch (error) {
    console.error('Error in GET /activas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ACÁ AGREGUÉ
// GET /api/trabajos/contratador?employer_id=1  -> "Tus Trabajos" de la home
// Debe declararse ANTES de '/:id' para que no lo capture la ruta con parámetro.
router.get('/contratador', async (req, res) => {
  try {
    const { employer_id } = req.query;
    if (!employer_id) {
      return res.status(400).json({ error: 'employer_id is required' });
    }
    const jobs = await service.getJobsByEmployerAsync(parseInt(employer_id));
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
router.post('/', async (req, res) => {
  try {
    const b = req.body;

    const entity = new Trabajo(
      b.id_contratante,
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