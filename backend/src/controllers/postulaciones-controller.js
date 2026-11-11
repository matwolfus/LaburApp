import { Router } from 'express';
import PostulacionesService from './../services/postulaciones-service.js';
import PostulacionEntity from './../entities/postulacion.js';
import authMiddleware from './../middlewares/auth-middleware.js';
import { idParam } from './../middlewares/error-middleware.js';
import TrabajosService from './../services/trabajos-service.js';
import NotificacionesService from './../services/notificaciones-service.js';
import { badRequest, conflict, forbidden, notFound, parseId } from './../helpers/http-error.js';
import { precioOpcional } from './../helpers/validaciones.js';

const router = Router();
const service = new PostulacionesService();
const trabajosService = new TrabajosService();
const notificacionesService = new NotificacionesService();

router.param('id', idParam);
router.param('idTrabajo', idParam);

// Los errores (HttpError de acá o del service, y fallas del servidor) los
// responde el middleware central de errores (middlewares/error-middleware.js).

// Verifica que el trabajo exista y que el usuario logueado sea su dueño.
// Devuelve el id del dueño.
async function verificarDuenoDelTrabajo(idTrabajo, userId) {
    const owner = await trabajosService.getJobOwnerAsync(idTrabajo);
    if (owner === null) throw notFound('Trabajo no encontrado');
    if (Number(owner) !== userId) throw forbidden();
    return owner;
}

// Trae la postulación y verifica que sea del trabajador logueado.
async function getPostulacionPropia(id, userId) {
    const postulacion = await service.getByIdAsync(id);
    if (!postulacion) throw notFound('Postulación no encontrada');
    if (Number(postulacion.id_trabajador) !== userId) throw forbidden();
    return postulacion;
}


// GET /api/postulaciones/trabajo/:idTrabajo -> solo el dueño ve sus postulantes.
router.get('/trabajo/:idTrabajo', authMiddleware, async (req, res) => {
    await verificarDuenoDelTrabajo(req.params.idTrabajo, req.userId);
    res.status(200).json(await service.getByTrabajoIdAsync(req.params.idTrabajo));
});


// GET /api/postulaciones/trabajo/:idTrabajo/count -> solo el dueño.
router.get('/trabajo/:idTrabajo/count', authMiddleware, async (req, res) => {
    await verificarDuenoDelTrabajo(req.params.idTrabajo, req.userId);
    res.status(200).json(await service.getCountByTrabajoIdAsync(req.params.idTrabajo));
});


// POST /api/postulaciones { id_trabajo, precio_propuesto? }
router.post('/', authMiddleware, async (req, res) => {

    const idTrabajo = parseId(req.body?.id_trabajo, 'id_trabajo');

    // precio_propuesto (contraoferta) es opcional: null/ausente = "al precio
    // publicado". Si viene, > 0 y que entre en numeric(10,2).
    const precioPropuesto = precioOpcional(req.body?.precio_propuesto, 'El precio propuesto');

    // Validar que el trabajo exista (evita el 500 por foreign key).
    const owner = await trabajosService.getJobOwnerAsync(idTrabajo);
    if (owner === null) throw notFound('Trabajo no encontrado');

    // No te podés postular a tu propio trabajo. Number(...) porque owner puede
    // venir como string desde el driver de pg.
    if (Number(owner) === req.userId) {
        throw forbidden('No podés postularte a tu propio trabajo');
    }

    const trabajo = await trabajosService.getJobById(idTrabajo);

    if (trabajo.estado !== 'abierto' && trabajo.estado !== 'proxima') {
        throw badRequest('Este trabajo ya no recibe postulaciones');
    }

    const entity = new PostulacionEntity(
        0,
        idTrabajo,
        req.userId,        // id_trabajador: sale del token, NO del body
        precioPropuesto,
        // Siempre 'pendiente': el estado NO se toma del body. Antes se podía
        // mandar estado: 'aceptado' y saltear la aceptación (y el contrato).
        'pendiente',
        null
    );

    let newId;
    try {
        newId = await service.createAsync(entity);
    } catch (error) {
        // UNIQUE (id_trabajo, id_trabajador): carrera entre dos requests.
        if (error.code === '23505') throw conflict('Ya te postulaste a este trabajo');
        throw error;
    }

    // Sin id: ya existía una postulación no retirada (ver createAsync).
    if (newId == null) throw conflict('Ya te postulaste a este trabajo');

    // Notificar al dueño del trabajo. Va en su propio try/catch: un problema
    // acá no debe hacer fallar la postulación, que ya se guardó.
    try {
        const localidad = await service.getLocalidadTrabajadorAsync(req.userId);

        await notificacionesService.crearAsync({
            id_usuario: owner,
            tipo: 'nueva_postulacion',
            titulo: `Nueva postulación para "${trabajo?.title ?? 'tu trabajo'}"`,
            cuerpo: null,
            id_referencia: req.userId, // id del trabajador que se postuló, para "Ver Perfil"
            // id_postulacion: para borrar esta notificación si se cancela la postulación.
            extra: { id_trabajo: idTrabajo, id_postulacion: newId, localidad },
        });
    } catch (notifError) {
        console.error('Error notificando nueva postulación:', notifError);
    }

    return res.status(201).json({ id: newId });
});


// PATCH /api/postulaciones/:id/cancelar -> el trabajador se baja.
router.patch('/:id/cancelar', authMiddleware, async (req, res) => {

    const postulacion = await getPostulacionPropia(req.params.id, req.userId);
    const trabajo = await trabajosService.getJobById(postulacion.id_trabajo);

    // El service valida que la postulación y el trabajo estén en un estado
    // que permita cancelar (si no, tira HttpError 400/409).
    const { trabajoEnEspera } = await service.cancelarAsync(postulacion, trabajo?.estado);

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
        console.error('Error notificando cancelación de postulación:', notifError);
    }

    return res.status(200).json({ message: 'Postulacion cancelada', trabajoEnEspera });
});


// PATCH /api/postulaciones/:id/reconfirmar { sigue } -> después de que el trabajo se reabrió.
router.patch('/:id/reconfirmar', authMiddleware, async (req, res) => {

    const sigue = req.body?.sigue === true;

    // Primero vencer las que pasaron el plazo, así una respuesta tardía no se acepta.
    await service.expirarReconfirmacionesAsync();

    const postulacion = await getPostulacionPropia(req.params.id, req.userId);
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
        console.error('Error notificando reconfirmación:', notifError);
    }

    return res.status(200).json({ message: sigue ? 'Postulacion reactivada' : 'Postulacion retirada' });
});


// PATCH /api/postulaciones/:id/aceptar -> solo el dueño del trabajo.
router.patch('/:id/aceptar', authMiddleware, async (req, res) => {

    const id = req.params.id;
    const postulacion = await service.getByIdAsync(id);
    if (!postulacion) throw notFound('Postulación no encontrada');

    const owner = await verificarDuenoDelTrabajo(postulacion.id_trabajo, req.userId);

    if (postulacion.estado !== 'pendiente') {
        throw badRequest('Esta postulación ya no está pendiente');
    }

    // Se pide ANTES de aceptar por dos motivos: (1) precioAcordado necesita
    // el presupuesto del trabajo como fallback cuando el trabajador se postuló
    // "al precio publicado" (precio_propuesto null), y (2) reusa este fetch
    // para el título de las notificaciones. getJobById corre expirarVencidos()
    // antes de leer, así que trabajo.estado ya viene actualizado.
    const trabajo = await trabajosService.getJobById(postulacion.id_trabajo);
    if (!trabajo) throw notFound('Trabajo no encontrado');

    if (trabajo.estado !== 'abierto' && trabajo.estado !== 'proxima') {
        const motivo = {
            vencido: 'venció',
            cancelado: 'fue cancelado',
            activa: 'ya tiene un trabajador aceptado',
            finalizado: 'ya fue completado',
        }[trabajo.estado] ?? `está en estado '${trabajo.estado}'`;

        throw badRequest(`No se puede aceptar: el trabajo ${motivo}`);
    }

    const tituloTrabajo = trabajo?.title ?? 'tu trabajo';
    const precioAcordado = postulacion.precio_propuesto ?? trabajo?.budget;

    // acceptAsync ya hizo commit acá (aceptar + rechazar al resto + trabajo ->
    // activa + crear contrato, todo en una transacción).
    const idsRechazados = await service.acceptAsync(
        id,                          // idPostulacion
        postulacion.id_trabajo,      // idTrabajo
        owner,                       // idContratante
        postulacion.id_trabajador,   // idTrabajador
        precioAcordado               // precio_propuesto ?? trabajo.budget
    );

    // Notificaciones DESPUÉS del commit, en su propio try/catch: un fallo acá
    // no debe convertir un accept ya guardado en un 500.
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
        console.error('Error notificando aceptación:', notifError);
    }

    return res.status(200).json({ message: 'Postulacion aceptada' });
});


// GET /api/postulaciones/mias -> postulaciones propias.
router.get('/mias', authMiddleware, async (req, res) => {
    res.status(200).json(await service.getByTrabajadorIdAsync(req.userId));
});

export default router;
