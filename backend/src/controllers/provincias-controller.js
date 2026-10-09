import { Router } from 'express';
import LocalidadesService from '../services/localidades-service.js';

const router = Router();
const service = new LocalidadesService();

// GET /api/provincias
router.get('/', async (req, res) => {

    try {

        const provincias = await service.getProvincias();

        res.status(200).json(provincias);

    } catch (error) {

        console.error('Error in GET /provincias:', error);

        res.status(500).json({
            error: 'Internal server error'
        });

    }

});

export default router;
