// TODO: postulaciones service
// TODO: postulaciones service
import PostulacionesRepository from './../repositories/postulaciones-repository.js';

export default class PostulacionesService {

    constructor() {
        this.repository = new PostulacionesRepository();
    }

    getByTrabajoIdAsync = async (idTrabajo) => {

        const postulaciones =
            await this.repository.getByTrabajoIdAsync(idTrabajo);

        return postulaciones;
    }

    getByTrabajadorIdAsync = async (idTrabajador) => {

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
}