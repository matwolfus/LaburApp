// TODO: postulaciones controller

import { Router } from 'express';

import PostulacionesService
    from './../services/postulaciones-service.js';

import PostulacionEntity
    from './../entities/postulacion.js';

const router = Router();

const service = new PostulacionesService();


// =========================================================
// GET POSTULACIONES POR TRABAJO
// =========================================================

router.get('/trabajo/:idTrabajo', async (req, res) => {

    try {

        const idTrabajo = req.params.idTrabajo;

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

router.get('/trabajo/:idTrabajo/count', async (req, res) => {

    try {

        const idTrabajo = req.params.idTrabajo;

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

router.post('/', async (req, res) => {

    try {

        const entity = new PostulacionEntity(

            0,

            req.body.id_trabajo,
            req.body.id_trabajador,

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

router.delete('/:id', async (req, res) => {

    try {

        const id = req.params.id;

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