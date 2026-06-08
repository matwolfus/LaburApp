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
}