import NotificacionesRepository from './../repositories/notificaciones-repository.js';

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

        if (!entity?.id_usuario) {
            throw new Error('id_usuario es requerido');
        }

        if (!entity?.tipo) {
            throw new Error('tipo es requerido');
        }

        if (!entity?.titulo) {
            throw new Error('titulo es requerido');
        }

        return await this.repository.crearAsync(entity);
    }

    marcarLeidoAsync = async (id) => {

        return await this.repository.marcarLeidoAsync(id);
    }
}
