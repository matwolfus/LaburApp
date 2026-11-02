import { Router } from 'express';
import { validarIdNumerico } from '../middlewares/error-middleware.js';

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

router.param('id', validarIdNumerico);
router.param('idTrabajo', validarIdNumerico);

const service = new PostulacionesService();

const trabajosService = new TrabajosService();

const notificacionesService = new NotificacionesService();


// =========================================================
// GET POSTULACIONES POR TRABAJO
// =========================================================

router.get('/trabajo/:idTrabajo', authMiddleware, async (req, res, next) => {

    try {

        const idTrabajo = req.params.idTrabajo;

        // Solo el dueño del trabajo puede ver sus postulantes.
        const owner = await trabajosService.getJobOwnerAsync(idTrabajo);

        if (owner === null) {
            return res.status(404).json({ error: 'Trabajo no encontrado' });
        }

        if (Number(owner) !== req.userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const postulaciones =
            await service.getByTrabajoIdAsync(idTrabajo);

        return res.status(200).json(postulaciones);

    } catch (error) {
        next(error);
    }
});


// =========================================================
// GET COUNT POSTULACIONES
// =========================================================

router.get('/trabajo/:idTrabajo/count', authMiddleware, async (req, res, next) => {

    try {

        const idTrabajo = req.params.idTrabajo;

        // Solo el dueño del trabajo puede ver el conteo de sus postulantes.
        const owner = await trabajosService.getJobOwnerAsync(idTrabajo);

        if (owner === null) {
            return res.status(404).json({ error: 'Trabajo no encontrado' });
        }

        if (Number(owner) !== req.userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const count =
            await service.getCountByTrabajoIdAsync(idTrabajo);

        return res.status(200).json(count);

    } catch (error) {
        next(error);
    }
});


// =========================================================
// CREAR POSTULACION
// =========================================================

router.post('/', authMiddleware, async (req, res, next) => {

    try {

        // Validar que el trabajo al que se postula exista (evita el 500 por foreign key).
        const owner = await trabajosService.getJobOwnerAsync(req.body.id_trabajo);

        if (owner === null) {
            return res.status(404).json({ error: 'Trabajo no encontrado' });
        }

        // No te podés postular a tu propio trabajo. Se castea con Number(...)
        // porque owner puede venir como string desde el driver de pg.
        if (Number(owner) === req.userId) {
            return res.status(403).json({ error: 'No podés postularte a tu propio trabajo' });
        }

        const trabajo = await trabajosService.getJobById(req.body.id_trabajo);

        if (trabajo.estado !== 'abierto' && trabajo.estado !== 'proxima') {
            return res.status(400).json({ error: 'Este trabajo ya no recibe postulaciones' });
        }

        const entity = new PostulacionEntity(

            0,

            req.body.id_trabajo,
            req.userId,        // id_trabajador: sale del token, NO del body

            req.body.precio_propuesto,

            // Toda postulación nueva nace 'pendiente': el estado lo decide
            // el servidor, nunca el body (si no, con Postman uno podía
            // postularse directamente como 'aceptado').
            'pendiente',

            null
        );

        const newId =
            await service.createAsync(entity);

        // Sin id: ya existía una postulación no retirada (ver createAsync).
        if (newId == null) {
            return res.status(409).json({
                error: 'Ya te postulaste a este trabajo'
            });
        }

        // Notificar al dueño del trabajo. Va en su propio try/catch: un
        // problema acá no debe hacer fallar la creación de la postulación,
        // que ya se guardó con éxito.
        try {

            const localidad = await service.getLocalidadTrabajadorAsync(req.userId);

            await notificacionesService.crearAsync({
                id_usuario: owner,
                tipo: 'nueva_postulacion',
                titulo: `Nueva postulación para "${trabajo?.title ?? 'tu trabajo'}"`,
                cuerpo: null,
                id_referencia: req.userId, // id del trabajador que se postuló, para "Ver Perfil"
                // id_postulacion: para borrar esta notificación si se cancela la postulación.
                extra: { id_trabajo: Number(req.body.id_trabajo), id_postulacion: newId, localidad },
            });

        } catch (notifError) {

            console.log(notifError);
        }

        return res.status(201).json({
            id: newId
        });

    } catch (error) {

        // UNIQUE (id_trabajo, id_trabajador): ya existe una postulación de
        // este trabajador a este trabajo. Mensaje más específico que el
        // genérico del error-middleware.
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Ya te postulaste a este trabajo'
            });
        }

        next(error);
    }
});


// =========================================================
// CANCELAR POSTULACION (el trabajador se baja)
// =========================================================

router.patch('/:id/cancelar', authMiddleware, async (req, res) => {

    try {

        const id = req.params.id;

        const postulacion = await service.getByIdAsync(id);

        if (!postulacion) {

            return res.status(404).json({
                error: 'Postulacion no encontrada'
            });
        }

        // Solo el trabajador dueño de la postulación puede cancelarla.
        if (Number(postulacion.id_trabajador) !== req.userId) {

            return res.status(403).json({
                error: 'No autorizado'
            });
        }

        const trabajo = await trabajosService.getJobById(postulacion.id_trabajo);

        const { trabajoEnEspera } =
            await service.cancelarAsync(postulacion, trabajo?.estado);

        // Notificaciones DESPUÉS del commit, en su propio try/catch.
        try {

            await notificacionesService.deleteNuevaPostulacionAsync(postulacion.id);

            const nombre = await service.getNombreTrabajadorAsync(req.userId);

            await notificacionesService.crearAsync({
                id_usuario: trabajo.id_contratante,
                tipo: 'postulacion_cancelada',
                titulo: trabajoEnEspera
                    ? `${nombre} canceló su participación en "${trabajo.title}". Podés reabrir el trabajo para elegir a otra persona.`
                    : `${nombre} canceló su postulación a "${trabajo.title}"`,
                cuerpo: null,
                id_referencia: postulacion.id_trabajo,
            });

        } catch (notifError) {

            console.log(notifError);
        }

        return res.status(200).json({
            message: 'Postulacion cancelada',
            trabajoEnEspera
        });

    } catch (error) {

        console.log(error);

        return res.status(error.status ?? 500).json({
            error: error.status ? error.message : 'Error cancelando postulacion'
        });
    }
});

// =========================================================
// RECONFIRMAR POSTULACION (después de que el trabajo se reabrió)
// =========================================================

router.patch('/:id/reconfirmar', authMiddleware, async (req, res) => {

    try {

        const id = req.params.id;
        const sigue = req.body?.sigue === true;

        // Primero vencer las que pasaron el plazo, así una respuesta tardía
        // no se acepta.
        await service.expirarReconfirmacionesAsync();

        const postulacion = await service.getByIdAsync(id);

        if (!postulacion) {

            return res.status(404).json({
                error: 'Postulacion no encontrada'
            });
        }

        if (Number(postulacion.id_trabajador) !== req.userId) {

            return res.status(403).json({
                error: 'No autorizado'
            });
        }

        const trabajo = await trabajosService.getJobById(postulacion.id_trabajo);

        await service.reconfirmarAsync(postulacion, trabajo?.estado, sigue);

        try {

            await notificacionesService.marcarReconfirmacionRespondidaAsync(postulacion.id);

            if (sigue) {

                const localidad = await service.getLocalidadTrabajadorAsync(req.userId);

                await notificacionesService.crearAsync({
                    id_usuario: trabajo.id_contratante,
                    tipo: 'nueva_postulacion',
                    titulo: `Un postulante sigue interesado en "${trabajo.title}"`,
                    cuerpo: null,
                    id_referencia: req.userId,
                    extra: { id_trabajo: postulacion.id_trabajo, id_postulacion: postulacion.id, localidad },
                });
            }

        } catch (notifError) {

            console.log(notifError);
        }

        return res.status(200).json({
            message: sigue ? 'Postulacion reactivada' : 'Postulacion retirada'
        });

    } catch (error) {

        console.log(error);

        return res.status(error.status ?? 500).json({
            error: error.status ? error.message : 'Error reconfirmando postulacion'
        });
    }
});

// =========================================================
// ACEPTAR POSTULACION
// =========================================================

router.patch('/:id/aceptar', authMiddleware, async (req, res, next) => {

    try {

        const id = req.params.id;

        const postulacion = await service.getByIdAsync(id);

        if (!postulacion) {

            return res.status(404).json({
                error: 'Postulacion no encontrada'
            });
        }

        // Solo el dueño del trabajo puede aceptar postulantes.
        const owner = await trabajosService.getJobOwnerAsync(postulacion.id_trabajo);

        if (owner === null) {
            return res.status(404).json({ error: 'Trabajo no encontrado' });
        }

        if (Number(owner) !== req.userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (postulacion.estado !== 'pendiente') {
            return res.status(400).json({ error: 'Esta postulación ya no está pendiente' });
        }

        // Se pide ANTES de aceptar por dos motivos: (1) precioAcordado
        // necesita el presupuesto del trabajo como fallback cuando el
        // trabajador se postuló "al precio publicado" (precio_propuesto
        // null), y (2) reusa este mismo fetch para el título de las
        // notificaciones de más abajo, sin pedirlo dos veces. De paso,
        // getJobById corre expirarVencidos() antes de leer el trabajo, así
        // que trabajo.estado ya viene actualizado si la fecha programada
        // ya pasó (antes esto no se chequeaba acá: se podía aceptar un
        // postulante de un trabajo vencido/cancelado/ya finalizado).
        const trabajo = await trabajosService.getJobById(postulacion.id_trabajo);

        if (!trabajo) {
            return res.status(404).json({ error: 'Trabajo no encontrado' });
        }

        if (trabajo.estado !== 'abierto' && trabajo.estado !== 'proxima') {
            const motivo = {
                vencido: 'venció',
                cancelado: 'fue cancelado',
                activa: 'ya tiene un trabajador aceptado',
                finalizado: 'ya fue completado',
            }[trabajo.estado] ?? `está en estado '${trabajo.estado}'`;

            return res.status(400).json({ error: `No se puede aceptar: el trabajo ${motivo}` });
        }

        const tituloTrabajo = trabajo?.title ?? 'tu trabajo';
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
        next(error);
    }
});

// =========================================================
// MIS POSTULACIONES
// =========================================================

router.get('/mias', authMiddleware, async (req, res, next) => {

    try {

        const postulaciones =
            await service.getByTrabajadorIdAsync(req.userId);

        return res.status(200).json(postulaciones);

    } catch (error) {
        next(error);
    }
});

export default router;