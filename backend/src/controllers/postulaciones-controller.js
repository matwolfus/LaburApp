// TODO: postulaciones controller

import { Router } from 'express';

import PostulacionesService
    from './../services/postulaciones-service.js';

import PostulacionEntity
    from './../entities/postulacion.js';

import authMiddleware
    from './../middlewares/auth-middleware.js';

import TrabajosService
    from './../services/trabajos-service.js';

const router = Router();

const service = new PostulacionesService();

const trabajosService = new TrabajosService();


// =========================================================
// GET POSTULACIONES POR TRABAJO
// =========================================================

router.get('/trabajo/:idTrabajo', authMiddleware, async (req, res) => {

    try {

        const idTrabajo = req.params.idTrabajo;

        // Solo el dueño del trabajo puede ver sus postulantes.
        const owner = await trabajosService.getJobOwnerAsync(idTrabajo);

        if (owner === null) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        if (Number(owner) !== req.userId) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        const postulaciones =
            await service.getByTrabajoIdAsync(idTrabajo);

        return res.status(200).json(postulaciones);

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Error obteniendo postulaciones'
        });
    }
});


// =========================================================
// GET COUNT POSTULACIONES
// =========================================================

router.get('/trabajo/:idTrabajo/count', authMiddleware, async (req, res) => {

    try {

        const idTrabajo = req.params.idTrabajo;

        // Solo el dueño del trabajo puede ver el conteo de sus postulantes.
        const owner = await trabajosService.getJobOwnerAsync(idTrabajo);

        if (owner === null) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        if (Number(owner) !== req.userId) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        const count =
            await service.getCountByTrabajoIdAsync(idTrabajo);

        return res.status(200).json(count);

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Error obteniendo count'
        });
    }
});


// =========================================================
// CREAR POSTULACION
// =========================================================

router.post('/', authMiddleware, async (req, res) => {

    try {

        // Validar que el trabajo al que se postula exista (evita el 500 por foreign key).
        const owner = await trabajosService.getJobOwnerAsync(req.body.id_trabajo);

        if (owner === null) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        const entity = new PostulacionEntity(

            0,

            req.body.id_trabajo,
            req.userId,        // id_trabajador: sale del token, NO del body

            req.body.precio_propuesto,

            req.body.estado ?? 'pendiente',

            null
        );

        const newId =
            await service.createAsync(entity);

        return res.status(201).json({
            id: newId
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: error.message
        });
    }
});


// =========================================================
// DELETE POSTULACION
// =========================================================

router.delete('/:id', authMiddleware, async (req, res) => {

    try {

        const id = req.params.id;

        // Solo el trabajador dueño de la postulación puede borrarla.
        const postulacion = await service.getByIdAsync(id);

        if (!postulacion) {

            return res.status(404).json({
                message: 'Postulacion no encontrada'
            });
        }

        if (Number(postulacion.id_trabajador) !== req.userId) {

            return res.status(403).json({
                message: 'No autorizado'
            });
        }

        const rowsAffected =
            await service.deleteByIdAsync(id);

        if (rowsAffected == 0) {

            return res.status(404).json({
                message: 'Postulacion no encontrada'
            });
        }

        return res.status(200).json({
            message: 'Postulacion eliminada'
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Error eliminando postulacion'
        });
    }
});

export default router;