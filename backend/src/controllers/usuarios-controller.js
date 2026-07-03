// backend/src/controllers/usuarios-controller.js
// ACÁ AGREGUÉ
import { Router } from 'express';
import UsuariosService from '../services/usuarios-service.js';

const router = Router();
const service = new UsuariosService();

// GET /api/usuarios/recomendados
router.get('/recomendados', async (req, res) => {
  try {
    const workers = await service.getRecommendedWorkersAsync();
    res.json(workers);
  } catch (error) {
    console.error('Error in GET /recomendados:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
// ACÁ YA NO
