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

import NotificacionesService
    from './../services/notificaciones-service.js';

const router = Router();

const service = new PostulacionesService();

const trabajosService = new TrabajosService();

const notificacionesService = new NotificacionesService();


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

        // No te podés postular a tu propio trabajo. Se castea con Number(...)
        // porque owner puede venir como string desde el driver de pg.
        if (Number(owner) === req.userId) {
            return res.status(403).json({ message: 'No podés postularte a tu propio trabajo' });
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

        // Notificar al dueño del trabajo. Va en su propio try/catch: un
        // problema acá no debe hacer fallar la creación de la postulación,
        // que ya se guardó con éxito.
        try {

            const trabajo = await trabajosService.getJobById(req.body.id_trabajo);

            await notificacionesService.crearAsync({
                id_usuario: owner,
                tipo: 'nueva_postulacion',
                titulo: `Nueva postulación para "${trabajo?.title ?? 'tu changa'}"`,
                cuerpo: null,
                id_referencia: req.userId, // id del trabajador que se postuló, para "Ver Perfil"
            });

        } catch (notifError) {

            console.log(notifError);
        }

        return res.status(201).json({
            id: newId
        });

    } catch (error) {

        console.log(error);

        // UNIQUE (id_trabajo, id_trabajador): ya existe una postulación de
        // este trabajador a este trabajo. Mensaje amigable en vez del 500
        // con el texto crudo de Postgres.
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Ya te postulaste a este trabajo'
            });
        }

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

// =========================================================
// ACEPTAR POSTULACION
// =========================================================

router.patch('/:id/aceptar', authMiddleware, async (req, res) => {

    try {

        const id = req.params.id;

        const postulacion = await service.getByIdAsync(id);

        if (!postulacion) {

            return res.status(404).json({
                message: 'Postulacion no encontrada'
            });
        }

        // Solo el dueño del trabajo puede aceptar postulantes.
        const owner = await trabajosService.getJobOwnerAsync(postulacion.id_trabajo);

        if (owner === null) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        if (Number(owner) !== req.userId) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        // Se pide ANTES de aceptar por dos motivos: (1) precioAcordado
        // necesita el presupuesto del trabajo como fallback cuando el
        // trabajador se postuló "al precio publicado" (precio_propuesto
        // null), y (2) reusa este mismo fetch para el título de las
        // notificaciones de más abajo, sin pedirlo dos veces.
        const trabajo = await trabajosService.getJobById(postulacion.id_trabajo);
        const tituloTrabajo = trabajo?.title ?? 'tu changa';
        const precioAcordado = postulacion.precio_propuesto ?? trabajo?.budget;

        // acceptAsync ya hizo commit acá (aceptar + rechazar al resto +
        // trabajo -> activa + crear contrato, todo en una transacción).
        // Los ids rechazados vienen de esa misma llamada, sin otra query.
        const idsRechazados = await service.acceptAsync(
            id,                          // idPostulacion
            postulacion.id_trabajo,      // idTrabajo
            owner,                       // idContratante
            postulacion.id_trabajador,   // idTrabajador
            precioAcordado                // precio_propuesto ?? trabajo.budget
        );

        // Notificaciones DESPUÉS del commit, en su propio try/catch: un
        // fallo acá no debe convertir un accept ya guardado en un 500
        // (mismo criterio que la notificación de 'nueva_postulacion').
        try {

            await notificacionesService.crearAsync({
                id_usuario: postulacion.id_trabajador,
                tipo: 'postulacion_aceptada',
                titulo: `¡Te aceptaron para "${tituloTrabajo}"!`,
                cuerpo: null,
                id_referencia: postulacion.id_trabajo,
            });

            for (const idTrabajadorRechazado of idsRechazados) {
                await notificacionesService.crearAsync({
                    id_usuario: idTrabajadorRechazado,
                    tipo: 'postulacion_rechazada',
                    titulo: `Tu postulación para "${tituloTrabajo}" no fue seleccionada`,
                    cuerpo: null,
                    id_referencia: postulacion.id_trabajo,
                });
            }

        } catch (notifError) {

            console.log(notifError);
        }

        return res.status(200).json({
            message: 'Postulacion aceptada'
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Error aceptando postulacion'
        });
    }
});

// =========================================================
// MIS POSTULACIONES
// =========================================================

router.get('/mias', authMiddleware, async (req, res) => {

    try {

        const postulaciones =
            await service.getByTrabajadorIdAsync(req.userId);

        return res.status(200).json(postulaciones);

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Error obteniendo tus postulaciones'
        });
    }
});

export default router;