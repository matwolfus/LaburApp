import LocalidadesRepository from '../repositories/localidades-repository.js';

export default class LocalidadesService {

    constructor() {
        this.repository = new LocalidadesRepository();
    }

    async getAll(filtros) {
        return await this.repository.getAll(filtros);
    }

    async getProvincias() {
        return await this.repository.getProvincias();
    }
}
