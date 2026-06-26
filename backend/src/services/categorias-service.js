// TODO: categorias service
import CategoriasRepository
from '../repositories/categorias-repository.js';

export default class CategoriasService {

    constructor() {
        this.repository =
            new CategoriasRepository();
    }

    async getCategoryWorkers(idCategoria) {

        const categoria =
            await this.repository.getCategoryById(
                idCategoria
            );

        if (!categoria) {
            return null;
        }

        const trabajadores =
            await this.repository.getWorkersByCategory(
                idCategoria
            );

        return {
            categoria: categoria.nombre,
            trabajadores
        };
    }
}