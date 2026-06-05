// TODO: trabajos controller
// backend/src/controllers/trabajos-controller.js
import { Router } from 'express';
import TrabajosService from '../services/trabajos-service.js';

const router = Router();
const service = new TrabajosService();

//las api son para los filtros
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