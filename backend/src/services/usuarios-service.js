// backend/src/services/usuarios-service.js
// ACÁ AGREGUÉ
import UsuariosRepository from '../repositories/usuarios-repository.js';

export default class UsuariosService {
  constructor() {
    this.repository = new UsuariosRepository();
  }

  async getRecommendedWorkersAsync() {
    const workers = await this.repository.getRecommendedWorkers();
    // Refuerzo del contrato: rating siempre number (el ::float ya lo asegura,
    // pero esto evita que una regresión en la query rompa rating.toFixed(1)).
    return workers.map((w) => ({ ...w, rating: Number(w.rating) }));
  }
}
// ACÁ YA NO
