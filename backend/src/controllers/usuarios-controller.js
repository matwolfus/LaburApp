import { Router } from 'express';
import UsuariosService from '../services/usuarios-service.js';
import authMiddleware from '../middlewares/auth-middleware.js';

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
    const { nombre, apellido, email, telefono, contrasena, confirmacion, rol } = req.body;
    const result = await service.register(nombre, apellido, email, telefono, contrasena, confirmacion, rol);

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

// GET /api/usuarios/me -> el usuario logueado (identidad tomada del token, no de la URL).
// Debe declararse ANTES de '/:id' para que no lo capture la ruta con parámetro.
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const perfil = await service.getPerfil(req.userId);
        if (!perfil) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }
        res.json(perfil);
    } catch (error) {
        console.error('Error in GET /me:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

router.get('/:id/perfil', async (req, res) => {
    try {

        const perfil = await service.getPerfil(req.params.id);

        if (!perfil) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json(perfil);

    } catch (error) {

        console.error('Error in GET /:id/perfil:', error);

        res.status(500).json({
            error: 'Internal server error'
        });

    }
});

// GET /api/usuarios/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await service.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error in GET /:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/me', authMiddleware, async (req, res) => {

    try {

        const perfilActualizado = await service.updatePerfil(
            req.userId,
            req.body
        );

        if (!perfilActualizado) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json(perfilActualizado);

    } catch (error) {

        console.error('Error in PATCH /me:', error);

        res.status(500).json({
            error: 'Internal server error'
        });

    }

});

export default router;
