// TODO: trabajos service
// backend/src/services/trabajos-service.js
import TrabajosRepository from '../repositories/trabajos-repository.js';

export default class TrabajosService {
  constructor() {
    this.repository = new TrabajosRepository();
  }

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