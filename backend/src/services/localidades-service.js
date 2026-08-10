import LocalidadesRepository from '../repositories/localidades-repository.js';

export default class LocalidadesService {

    constructor() {
        this.repository = new LocalidadesRepository();
    }

    async getAll() {
        return await this.repository.getAll();
    }
}