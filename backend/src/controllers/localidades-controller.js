import { Router } from 'express';
import LocalidadesService from '../services/localidades-service.js';

const router = Router();
const service = new LocalidadesService();

// GET /api/localidades
router.get('/', async (req, res) => {

    try {

        const localidades = await service.getAll();

        res.status(200).json(localidades);

    } catch (error) {

        console.error('Error in GET /localidades:', error);

        res.status(500).json({
            error: 'Internal server error'
        });

    }

});

export default router;