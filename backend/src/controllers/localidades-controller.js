import { Router } from 'express';
import LocalidadesService from '../services/localidades-service.js';

const router = Router();
const service = new LocalidadesService();

// GET /api/localidades?provincia=<id>&q=<texto> (ambos opcionales)
router.get('/', async (req, res) => {

    try {

        const localidades = await service.getAll({
            idProvincia: req.query.provincia,
            q: req.query.q?.trim(),
        });

        res.status(200).json(localidades);

    } catch (error) {

        console.error('Error in GET /localidades:', error);

        res.status(500).json({
            error: 'Internal server error'
        });

    }

});

export default router;
