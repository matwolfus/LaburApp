import PostulacionesRepository from './../repositories/postulaciones-repository.js';
import { HttpError } from '../helpers/http-error.js';

export default class PostulacionesService {

    constructor() {
        this.repository = new PostulacionesRepository();
    }

    getByTrabajoIdAsync = async (idTrabajo) => {

        await this.repository.expirarReconfirmaciones();

        const postulaciones =
            await this.repository.getByTrabajoIdAsync(idTrabajo);

        return postulaciones;
    }

    getByTrabajadorIdAsync = async (idTrabajador) => {

        await this.repository.expirarReconfirmaciones();

        return await this.repository.getByTrabajadorIdAsync(idTrabajador);
    }

    getByIdAsync = async (id) => {

        return await this.repository.getByIdAsync(id);
    }

    getCountByTrabajoIdAsync = async (idTrabajo) => {

        const count =
            await this.repository.getCountByTrabajoIdAsync(idTrabajo);

        return count;
    }

    createAsync = async (entity) => {

        if (!entity?.id_trabajo) {
            throw new Error('id_trabajo es requerido');
        }

        if (!entity?.id_trabajador) {
            throw new Error('id_trabajador es requerido');
        }

        const newId =
            await this.repository.createAsync(entity);

        return newId;
    }

    deleteByIdAsync = async (id) => {

        const rowsAffected =
            await this.repository.deleteByIdAsync(id);

        return rowsAffected;
    }

    // Acepta una postulación: rechaza al resto de pendientes de la misma
    // changa, pasa el trabajo a 'activa' y crea el contrato (ver
    // PostulacionesRepository.acceptAsync). Misma firma que el repository,
    // pass-through sin reordenar nada.
    acceptAsync = async (idPostulacion, idTrabajo, idContratante, idTrabajador, precioAcordado) => {

        if (!idPostulacion) {
            throw new Error('idPostulacion es requerido');
        }

        if (!idTrabajo) {
            throw new Error('idTrabajo es requerido');
        }

        if (!idContratante) {
            throw new Error('idContratante es requerido');
        }

        if (!idTrabajador) {
            throw new Error('idTrabajador es requerido');
        }

        if (precioAcordado == null) {
            throw new Error('precioAcordado es requerido');
        }

        return await this.repository.acceptAsync(idPostulacion, idTrabajo, idContratante, idTrabajador, precioAcordado);
    }

    expirarReconfirmacionesAsync = async () => {

        return await this.repository.expirarReconfirmaciones();
    }

    getNombreTrabajadorAsync = async (idTrabajador) => {

        return await this.repository.getNombreTrabajadorAsync(idTrabajador);
    }

    getLocalidadTrabajadorAsync = async (idTrabajador) => {

        return await this.repository.getLocalidadTrabajadorAsync(idTrabajador);
    }

    // Valida el estado acá (no en el repository), mismo criterio que
    // TrabajosService.cancelarTrabajoAsync. Los errores llevan .status para
    // que el controller responda el código correcto.
    cancelarAsync = async (postulacion, estadoTrabajo) => {

        if (postulacion.estado === 'retirado') {
            throw new HttpError(409, 'Esta postulación ya fue cancelada');
        }

        // Estados del trabajo en los que tiene sentido cancelar cada tipo de
        // postulación. Fuera de esto (trabajo cancelado, vencido, finalizado o
        // en espera) no se cancela: el aviso al contratante sería incorrecto
        // (ej. "podés reabrir el trabajo" sobre un trabajo ya cancelado).
        const estadosTrabajoValidos = {
            pendiente:       ['abierto', 'proxima'],
            por_reconfirmar: ['abierto', 'proxima'],
            aceptado:        ['activa'],
        }[postulacion.estado];

        if (!estadosTrabajoValidos) {
            throw new HttpError(400, `No se puede cancelar una postulación en estado '${postulacion.estado}'`);
        }

        if (!estadosTrabajoValidos.includes(estadoTrabajo)) {
            const motivo = {
                finalizado: 'ya fue completado',
                cancelado:  'fue cancelado',
                vencido:    'venció',
                en_espera:  'está en espera',
            }[estadoTrabajo] ?? 'ya no admite cambios';

            throw new HttpError(409, `No se puede cancelar: el trabajo ${motivo}`);
        }

        return await this.repository.cancelarAsync(postulacion);
    }

    reconfirmarAsync = async (postulacion, estadoTrabajo, sigue) => {

        if (postulacion.estado !== 'por_reconfirmar') {
            throw new HttpError(409, 'Esta postulación ya no está esperando confirmación');
        }

        if (sigue && estadoTrabajo !== 'abierto') {
            throw new HttpError(400, 'El trabajo ya no está disponible');
        }

        return await this.repository.reconfirmarAsync(postulacion.id, sigue);
    }
}
