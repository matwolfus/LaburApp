import { Router } from 'express';
import LocalidadesService from '../services/localidades-service.js';

const router = Router();
const service = new LocalidadesService();

// GET /api/provincias
router.get('/', async (req, res, next) => {

    try {

        const provincias = await service.getProvincias();

        res.status(200).json(provincias);

    } catch (error) {
        next(error);
    }

});

export default router;
