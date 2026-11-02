// backend/src/controllers/categorias-controller.js
// ACÁ AGREGUÉ
import { Router } from 'express';
import CategoriasService from '../services/categorias-service.js';

const router = Router();
const service = new CategoriasService();

// GET /api/categorias
router.get('/', async (req, res, next) => {
  try {
    const categorias = await service.getAllAsync();
    res.json(categorias);
  } catch (error) {
    next(error);
  }
});

export default router;
// ACÁ YA NO
