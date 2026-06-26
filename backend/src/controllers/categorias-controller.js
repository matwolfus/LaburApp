// TODO: categorias controller
import { Router } from 'express';
import CategoriasService from '../services/categorias-service.js';

const router = Router();

const service =
    new CategoriasService();

router.get(
    '/:idCategoria/trabajadores',
    async (req, res) => {

        const { idCategoria } =
            req.params;

        const result =
            await service.getCategoryWorkers(
                idCategoria
            );

        if (!result) {

            return res.status(404).json({
                error: 'CATEGORY_NOT_FOUND'
            });
        }

        return res.status(200).json(
            result
        );
    }
);

export default router;