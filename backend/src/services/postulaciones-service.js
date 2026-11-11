// backend/src/services/postulaciones-service.js
// Reglas de negocio de las postulaciones: postularse, aceptar, cancelar y
// reconfirmar. Cada acción valida permisos y estados (domain/estados.js),
// cambia todo lo que corresponde en una sola transacción y después avisa.
import Db from '../repositories/db-pg.js';
import PostulacionesRepository from '../repositories/postulaciones-repository.js';
import TrabajosRepository from '../repositories/trabajos-repository.js';
import ContratosService from './contratos-service.js';
import NotificacionesService from './notificaciones-service.js';
import { badRequest, conflict, forbidden, notFound } from '../helpers/http-error.js';
import { precioOpcional } from '../helpers/validaciones.js';
import { sinFallar } from '../helpers/sin-fallar.js';
import {
    ESTADO_POSTULACION,
    ESTADO_TRABAJO,
    exigirCambioEstadoTrabajo,
    exigirPuedeCancelarPostulacion,
    recibePostulaciones,
} from '../domain/estados.js';

const MSJ_CAMBIO_CONCURRENTE = 'La postulación o el trabajo cambiaron mientras tanto. Recargá la página.';

export default class PostulacionesService {

    constructor() {
        this.db = new Db();
        this.repository = new PostulacionesRepository();
        this.trabajosRepository = new TrabajosRepository();
        this.contratosService = new ContratosService();
        this.notificacionesService = new NotificacionesService();
    }

    // =========================================================
    // HELPERS
    // =========================================================

    async #getTrabajoOrFail(idTrabajo) {
        // getJobById corre expirarVencidos() antes de leer: el estado ya viene al día.
        const trabajo = await this.trabajosRepository.getJobById(idTrabajo);
        if (!trabajo) throw notFound('Trabajo no encontrado');
        return trabajo;
    }

    async #getTrabajoPropio(idTrabajo, userId) {
        const trabajo = await this.#getTrabajoOrFail(idTrabajo);
        if (Number(trabajo.id_contratante) !== Number(userId)) throw forbidden();
        return trabajo;
    }

    async #getPostulacionOrFail(id) {
        const postulacion = await this.repository.getByIdAsync(id);
        if (!postulacion) throw notFound('Postulación no encontrada');
        return postulacion;
    }

    async #getPostulacionPropia(id, userId) {
        const postulacion = await this.#getPostulacionOrFail(id);
        if (Number(postulacion.id_trabajador) !== Number(userId)) throw forbidden();
        return postulacion;
    }

    // =========================================================
    // LECTURAS
    // =========================================================

    // Postulantes de un trabajo: solo para el dueño.
    async listarPostulantesAsync(idTrabajo, userId) {
        await this.#getTrabajoPropio(idTrabajo, userId);
        await this.repository.expirarReconfirmaciones();
        return await this.repository.getByTrabajoIdAsync(idTrabajo);
    }

    async misPostulacionesAsync(idTrabajador) {
        await this.repository.expirarReconfirmaciones();
        return await this.repository.getByTrabajadorIdAsync(idTrabajador);
    }

    async expirarReconfirmacionesAsync() {
        return await this.repository.expirarReconfirmaciones();
    }

    // =========================================================
    // POSTULARSE
    // =========================================================

    // El estado siempre arranca en 'pendiente' (nunca sale del cliente).
    //
    // Precio: toda postulación guarda el suyo. Si el trabajador no propone
    // uno, se copia el presupuesto publicado EN ESE MOMENTO. Así, si el
    // contratador cambia el presupuesto después, el que se postuló "al
    // precio publicado" queda con el precio que vio y aceptó, y al aceptarlo
    // el contratador ve que es distinto al publicado (ConfirmModal).
    async postularseAsync(idTrabajo, idTrabajador, precioIngresado) {
        const precioPropuesto = precioOpcional(precioIngresado, 'El precio propuesto');
        const trabajo = await this.#getTrabajoOrFail(idTrabajo);

        if (Number(trabajo.id_contratante) === Number(idTrabajador)) {
            throw forbidden('No podés postularte a tu propio trabajo');
        }
        if (!recibePostulaciones(trabajo.estado)) {
            throw conflict('Este trabajo ya no recibe postulaciones');
        }

        const precio = precioPropuesto ?? (trabajo.budget != null ? Number(trabajo.budget) : null);
        if (precio == null) {
            throw badRequest('Este trabajo no tiene presupuesto publicado: proponé un precio');
        }

        let idPostulacion;
        try {
            idPostulacion = await this.repository.crearPendienteAsync({ idTrabajo, idTrabajador, precioPropuesto: precio });
        } catch (error) {
            // UNIQUE (id_trabajo, id_trabajador): carrera entre dos requests.
            if (error.code === '23505') throw conflict('Ya te postulaste a este trabajo');
            throw error;
        }
        // Sin id: ya existía una postulación no retirada.
        if (idPostulacion == null) throw conflict('Ya te postulaste a este trabajo');

        await sinFallar('avisar nueva postulación', async () => {
            const localidad = await this.repository.getLocalidadTrabajadorAsync(idTrabajador);
            await this.notificacionesService.avisarNuevaPostulacion({
                idContratante: trabajo.id_contratante,
                tituloTrabajo: trabajo.title,
                idTrabajador,
                idTrabajo,
                idPostulacion,
                localidad,
            });
        });

        return idPostulacion;
    }

    // =========================================================
    // ACEPTAR (el contratador elige a un postulante)
    // =========================================================

    // En una transacción: la postulación pasa a 'aceptado', el trabajo a
    // 'activa', las demás postulaciones abiertas se rechazan (automático) y
    // se crea el contrato.
    async aceptarAsync(idPostulacion, userId) {
        const postulacion = await this.#getPostulacionOrFail(idPostulacion);
        const trabajo = await this.#getTrabajoPropio(postulacion.id_trabajo, userId);

        if (postulacion.estado !== ESTADO_POSTULACION.PENDIENTE) {
            throw conflict('Esta postulación ya no está pendiente');
        }
        exigirCambioEstadoTrabajo(trabajo.estado, ESTADO_TRABAJO.ACTIVA, 'aceptar');

        const idsRechazados = await this.db.withTransaction(async (tx) => {
            const aceptada = await this.repository.aceptarAsync(postulacion.id, tx);
            const activado = await this.trabajosRepository.cambiarEstadoAsync(
                postulacion.id_trabajo, [trabajo.estado], ESTADO_TRABAJO.ACTIVA, tx
            );
            if (!aceptada || !activado) throw conflict(MSJ_CAMBIO_CONCURRENTE);

            const rechazados = await this.repository.rechazarAbiertasDeTrabajoAsync(
                postulacion.id_trabajo, { exceptoId: postulacion.id, automatico: true }, tx
            );
            await this.contratosService.crearParaPostulacion(postulacion, trabajo, tx);
            return rechazados;
        });

        await sinFallar('avisar aceptación', () =>
            this.notificacionesService.avisarAceptacion({
                idTrabajo: postulacion.id_trabajo,
                tituloTrabajo: trabajo.title,
                idTrabajadorAceptado: postulacion.id_trabajador,
                idsRechazados,
            })
        );
    }

    // =========================================================
    // CANCELAR (el trabajador se baja)
    // =========================================================

    // pendiente / por_reconfirmar -> retirado.
    // aceptado -> retirado + contrato cancelado + trabajo 'en_espera' (el
    // contratador decide si lo reabre). Todo en una transacción.
    async cancelarAsync(idPostulacion, userId) {
        const postulacion = await this.#getPostulacionPropia(idPostulacion, userId);
        const trabajo = await this.#getTrabajoOrFail(postulacion.id_trabajo);

        exigirPuedeCancelarPostulacion(postulacion.estado, trabajo.estado);
        const trabajoEnEspera = postulacion.estado === ESTADO_POSTULACION.ACEPTADO;

        await this.db.withTransaction(async (tx) => {
            const retirada = await this.repository.retirarAsync(postulacion.id, tx);
            if (!retirada) throw conflict(MSJ_CAMBIO_CONCURRENTE);

            if (trabajoEnEspera) {
                await this.contratosService.cancelarPorBajaDelTrabajador(postulacion.id, tx);
                const enEspera = await this.trabajosRepository.cambiarEstadoAsync(
                    postulacion.id_trabajo, [ESTADO_TRABAJO.ACTIVA], ESTADO_TRABAJO.EN_ESPERA, tx
                );
                if (!enEspera) throw conflict(MSJ_CAMBIO_CONCURRENTE);
            }
        });

        await sinFallar('avisar cancelación de postulación', async () => {
            const nombreTrabajador = await this.repository.getNombreTrabajadorAsync(userId);
            await this.notificacionesService.avisarCancelacionDePostulacion({
                idPostulacion: postulacion.id,
                idContratante: trabajo.id_contratante,
                idTrabajo: postulacion.id_trabajo,
                tituloTrabajo: trabajo.title,
                nombreTrabajador,
                trabajoEnEspera,
            });
        });

        return { trabajoEnEspera };
    }

    // =========================================================
    // RECONFIRMAR (después de que el trabajo se reabrió)
    // =========================================================

    async reconfirmarAsync(idPostulacion, userId, sigue) {
        // Primero vencer las que pasaron el plazo: una respuesta tardía no se acepta.
        await this.repository.expirarReconfirmaciones();

        const postulacion = await this.#getPostulacionPropia(idPostulacion, userId);
        const trabajo = await this.#getTrabajoOrFail(postulacion.id_trabajo);

        if (postulacion.estado !== ESTADO_POSTULACION.POR_RECONFIRMAR) {
            throw conflict('Esta postulación ya no está esperando confirmación');
        }
        if (sigue && !recibePostulaciones(trabajo.estado)) {
            throw conflict('El trabajo ya no está disponible');
        }

        const ok = await this.repository.reconfirmarAsync(postulacion.id, sigue);
        if (!ok) throw conflict(MSJ_CAMBIO_CONCURRENTE);

        await sinFallar('avisar reconfirmación', async () => {
            await this.notificacionesService.marcarReconfirmacionRespondidaAsync(postulacion.id);
            if (!sigue) return;

            const localidad = await this.repository.getLocalidadTrabajadorAsync(userId);
            await this.notificacionesService.avisarNuevaPostulacion({
                idContratante: trabajo.id_contratante,
                tituloTrabajo: trabajo.title,
                idTrabajador: userId,
                idTrabajo: postulacion.id_trabajo,
                idPostulacion: postulacion.id,
                localidad,
                esReconfirmacion: true,
            });
        });
    }
}
