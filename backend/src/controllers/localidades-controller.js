import { Router } from 'express';
import LocalidadesService from '../services/localidades-service.js';
import { parseOptionalId } from '../helpers/http-error.js';

const router = Router();
const service = new LocalidadesService();

// GET /api/localidades?provincia=<id>&q=<texto> (ambos opcionales)
router.get('/', async (req, res) => {
    const localidades = await service.getAll({
        idProvincia: parseOptionalId(req.query.provincia, 'provincia'),
        // ?q=a&q=b llega como array: solo se acepta texto.
        q: typeof req.query.q === 'string' ? req.query.q.trim() : undefined,
    });

    res.status(200).json(localidades);
});

export default router;
