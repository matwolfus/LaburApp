import { Router } from 'express';
import UsuariosService from '../services/usuarios-service.js';

const router = Router();
const service = new UsuariosService();

router.post('/login', async (req, res) => {
    const { email, contrasena } = req.body;
    const result = await service.login(email, contrasena);

    if (!result.success) {
        return res.status(401).json(result);
    }
    return res.status(200).json(result);
});

router.post('/register', async (req, res) => {
    const { nombre, apellido, email, telefono, contrasena, confirmacion } = req.body;
    const result = await service.register(nombre, apellido, email, telefono, contrasena, confirmacion);

    if (!result.success) {
        return res.status(400).json(result);
    }
    return res.status(201).json(result);
});

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
