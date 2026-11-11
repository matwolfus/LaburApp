import NotificacionesRepository from './../repositories/notificaciones-repository.js';
import { PLAZO_RECONFIRMACION_DIAS } from '../domain/estados.js';

// Además de leer/marcar notificaciones, este servicio arma los avisos de
// cada evento del dominio (métodos avisar*). Así los textos y los datos
// extra de cada tipo de notificación están en un solo lugar y los demás
// servicios solo dicen "pasó tal cosa".
//
// Los avisar* pueden tirar: quien los llama los envuelve en sinFallar()
// (helpers/sin-fallar.js) porque corren después de una acción ya guardada.
export default class NotificacionesService {

    constructor() {
        this.repository = new NotificacionesRepository();
    }

    getByUsuarioAsync = async (idUsuario) => {
        return await this.repository.getByUsuarioAsync(idUsuario);
    }

    getByIdAsync = async (id) => {
        return await this.repository.getByIdAsync(id);
    }

    crearAsync = async (entity) => {
        if (!entity?.id_usuario) throw new Error('id_usuario es requerido');
        if (!entity?.tipo) throw new Error('tipo es requerido');
        if (!entity?.titulo) throw new Error('titulo es requerido');

        return await this.repository.crearAsync(entity);
    }

    marcarLeidoAsync = async (id) => {
        return await this.repository.marcarLeidoAsync(id);
    }

    getNoLeidasCountAsync = async (idUsuario) => {
        return await this.repository.getNoLeidasCountAsync(idUsuario);
    }

    marcarTodasLeidasAsync = async (idUsuario) => {
        return await this.repository.marcarTodasLeidasAsync(idUsuario);
    }

    // =========================================================
    // AVISOS DE POSTULACIONES
    // =========================================================

    // Al contratador: alguien se postuló (o reconfirmó su interés).
    // id_referencia = id del trabajador, para el botón "Ver perfil".
    // extra.id_postulacion: para borrar este aviso si la postulación se cancela.
    avisarNuevaPostulacion = async ({ idContratante, tituloTrabajo, idTrabajador, idTrabajo, idPostulacion, localidad, esReconfirmacion = false }) => {
        await this.crearAsync({
            id_usuario: idContratante,
            tipo: 'nueva_postulacion',
            titulo: esReconfirmacion
                ? `Un postulante sigue interesado en "${tituloTrabajo}"`
                : `Nueva postulación para "${tituloTrabajo}"`,
            cuerpo: null,
            id_referencia: idTrabajador,
            extra: { id_trabajo: Number(idTrabajo), id_postulacion: Number(idPostulacion), localidad },
        });
    }

    // Al trabajador aceptado y a los que quedaron afuera.
    avisarAceptacion = async ({ idTrabajo, tituloTrabajo, idTrabajadorAceptado, idsRechazados }) => {
        await this.crearAsync({
            id_usuario: idTrabajadorAceptado,
            tipo: 'postulacion_aceptada',
            titulo: `¡Te aceptaron para "${tituloTrabajo}"!`,
            cuerpo: null,
            id_referencia: idTrabajo,
        });

        for (const idTrabajador of idsRechazados) {
            await this.crearAsync({
                id_usuario: idTrabajador,
                tipo: 'postulacion_rechazada',
                titulo: `Tu postulación para "${tituloTrabajo}" no fue seleccionada`,
                cuerpo: null,
                id_referencia: idTrabajo,
            });
        }
    }

    // Al contratador: un postulante canceló. Se borra el aviso de "nueva
    // postulación" de esa persona, que ya no tiene sentido.
    avisarCancelacionDePostulacion = async ({ idPostulacion, idContratante, idTrabajo, tituloTrabajo, nombreTrabajador, trabajoEnEspera }) => {
        await this.repository.deleteNuevaPostulacionAsync(idPostulacion);

        await this.crearAsync({
            id_usuario: idContratante,
            tipo: 'postulacion_cancelada',
            titulo: trabajoEnEspera
                ? `${nombreTrabajador} canceló su participación en "${tituloTrabajo}". Podés reabrir el trabajo para elegir a otra persona.`
                : `${nombreTrabajador} canceló su postulación a "${tituloTrabajo}"`,
            cuerpo: null,
            id_referencia: idTrabajo,
        });
    }

    marcarReconfirmacionRespondidaAsync = async (idPostulacion) => {
        return await this.repository.marcarReconfirmacionRespondidaAsync(idPostulacion);
    }

    // =========================================================
    // AVISOS DE TRABAJOS
    // =========================================================

    // A las dos partes: ya pueden dejarse una reseña.
    avisarTrabajoCompletado = async ({ idTrabajo, tituloTrabajo, idContratante, idTrabajador }) => {
        await this.crearAsync({
            id_usuario: idContratante,
            tipo: 'trabajo_completado',
            titulo: `Marcaste "${tituloTrabajo}" como completado. ¡Dejá tu reseña!`,
            cuerpo: null,
            id_referencia: idTrabajo,
        });

        if (idTrabajador) {
            await this.crearAsync({
                id_usuario: idTrabajador,
                tipo: 'trabajo_completado',
                titulo: `"${tituloTrabajo}" se completó. ¡Dejá tu reseña!`,
                cuerpo: null,
                id_referencia: idTrabajo,
            });
        }
    }

    // A los postulantes y al trabajador contratado, si había.
    avisarTrabajoCancelado = async ({ idTrabajo, tituloTrabajo, idsTrabajadores }) => {
        for (const idTrabajador of idsTrabajadores) {
            await this.crearAsync({
                id_usuario: idTrabajador,
                tipo: 'trabajo_cancelado',
                titulo: `El trabajo "${tituloTrabajo}" fue cancelado por el contratador`,
                cuerpo: null,
                id_referencia: idTrabajo,
            });
        }
    }

    // A los postulantes que el sistema había rechazado: ¿siguen interesados?
    avisarReapertura = async ({ idTrabajo, tituloTrabajo, postulaciones }) => {
        const dias = PLAZO_RECONFIRMACION_DIAS === 1 ? '1 día' : `${PLAZO_RECONFIRMACION_DIAS} días`;
        for (const p of postulaciones) {
            await this.crearAsync({
                id_usuario: p.id_trabajador,
                tipo: 'reconfirmar_postulacion',
                titulo: `"${tituloTrabajo}" está disponible de nuevo. ¿Seguís interesado?`,
                cuerpo: `Tenés ${dias} para responder. Si no respondés, se toma como que ya no te interesa.`,
                id_referencia: Number(idTrabajo),
                extra: { id_postulacion: p.id, id_trabajo: Number(idTrabajo) },
            });
        }
    }

    // =========================================================
    // OTROS AVISOS
    // =========================================================

    avisarNuevoMensaje = async ({ idDestinatario, idPostulacion }) => {
        await this.crearAsync({
            id_usuario: idDestinatario,
            tipo: 'nuevo_mensaje',
            titulo: 'Tenés un mensaje nuevo',
            cuerpo: null,
            id_referencia: Number(idPostulacion),
            // Ver migracion-corregir.sql: marca que id_referencia ya es una postulación.
            extra: { ref_es_postulacion: true },
        });
    }

    avisarNuevaResena = async ({ idReceptor, idTrabajo }) => {
        await this.crearAsync({
            id_usuario: idReceptor,
            tipo: 'nueva_resena',
            titulo: 'Recibiste una nueva reseña',
            cuerpo: null,
            id_referencia: idTrabajo,
        });
    }
}
