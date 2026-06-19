// backend/src/services/categorias-service.js
// ACÁ AGREGUÉ
import CategoriasRepository from '../repositories/categorias-repository.js';

export default class CategoriasService {
  constructor() {
    this.repository = new CategoriasRepository();
  }

  async getAllAsync() {
    return await this.repository.getAll();
  }
}
// ACÁ YA NO
