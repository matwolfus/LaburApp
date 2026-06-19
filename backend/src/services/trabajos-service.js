// TODO: trabajos service
// backend/src/services/trabajos-service.js
import TrabajosRepository from '../repositories/trabajos-repository.js';

// ACÁ AGREGUÉ
// El estado 'proxima' = el trabajo sigue buscando trabajadores -> PENDIENTE en la UI.
// Cualquier otro estado se muestra como finalizado (HomeJobCard solo distingue 'PENDIENTE').
function mapEstadoToStatus(estado) {
  return estado === 'proxima' ? 'PENDIENTE' : 'FINALIZADO';
}
// ACÁ YA NO

export default class TrabajosService {
  constructor() {
    this.repository = new TrabajosRepository();
  }

  // ACÁ AGREGUÉ
  async getJobsByEmployerAsync(employerId) {
    const jobs = await this.repository.getJobsByEmployer(employerId);
    return jobs.map(({ estado, ...job }) => ({
      ...job,
      status: mapEstadoToStatus(estado),
    }));
  }
  // ACÁ YA NO

  async getUpcomingJobsAsync(employerId) {
    return await this.repository.getJobsByEmployerAndStatus(employerId, 'proxima');
  }

  async getActiveJobsAsync(employerId) {
    return await this.repository.getJobsByEmployerAndStatus(employerId, 'activa');
  }
   async getJobById(jobId) {
    return await this.repository.getJobById(jobId);
  }

}