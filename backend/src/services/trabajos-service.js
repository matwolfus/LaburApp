// TODO: trabajos service
// backend/src/services/trabajos-service.js
import TrabajosRepository from '../repositories/trabajos-repository.js';

// ACÁ AGREGUÉ
// Estados que significan "buscando trabajadores" -> PENDIENTE en la UI.
// 'abierto' es el DEFAULT de la tabla (trabajos recién creados); 'proxima' viene de datos previos.
// Cualquier otro estado se muestra como finalizado (HomeJobCard solo distingue 'PENDIENTE').
function mapEstadoToStatus(estado) {
  return ['proxima', 'abierto'].includes(estado) ? 'PENDIENTE' : 'FINALIZADO';
}
// ACÁ YA NO

export default class TrabajosService {
  constructor() {
    this.repository = new TrabajosRepository();
  }

  // ACÁ AGREGUÉ
  // Todas las ofertas de un contratante (cualquier estado) para la pantalla "Ofertas".
  async getAllJobsAsync(employerId) {
    return await this.repository.getAllJobsByEmployer(employerId);
  }
  // ACÁ YA NO

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

  // Devuelve el id del contratador dueño del trabajo (o null si el trabajo no existe).
  async getJobOwnerAsync(jobId) {
    return await this.repository.getOwnerId(jobId);
  }

  // ACÁ AGREGUÉ
  // Crea un trabajo (POST de "Publicar tarea"). Valida con el mismo estilo de throw
  // que postulaciones-service y, si vienen, inserta las fotos en imagenes_trabajo.
  async createJobAsync(entity, imagenes = []) {
    // Requeridos
    if (!entity?.id_contratante) throw new Error('id_contratante es requerido');
    if (!entity?.id_categoria)   throw new Error('id_categoria es requerido');
    if (!entity?.titulo)         throw new Error('titulo es requerido');

    // programado_para: si viene, que sea una fecha parseable
    if (entity.programado_para != null && isNaN(Date.parse(entity.programado_para))) {
      throw new Error('programado_para no es una fecha válida');
    }

    // presupuesto: si viene, number > 0
    if (entity.presupuesto != null) {
      const p = Number(entity.presupuesto);
      if (isNaN(p) || p <= 0) throw new Error('presupuesto debe ser un número mayor a 0');
    }

    // prioridad: si viene, dentro de los valores permitidos
    if (entity.prioridad != null && !['normal', 'urgente'].includes(entity.prioridad)) {
      throw new Error("prioridad debe ser 'normal' o 'urgente'");
    }

    // lat / lng: si vienen, numbers en rango
    if (entity.lat != null) {
      const lat = Number(entity.lat);
      if (isNaN(lat) || lat < -90 || lat > 90) throw new Error('lat fuera de rango (-90..90)');
    }
    if (entity.lng != null) {
      const lng = Number(entity.lng);
      if (isNaN(lng) || lng < -180 || lng > 180) throw new Error('lng fuera de rango (-180..180)');
    }

    // imagenes: si viene, array de strings
    if (imagenes != null) {
      if (!Array.isArray(imagenes) || imagenes.some((u) => typeof u !== 'string')) {
        throw new Error('imagenes debe ser un array de strings (URLs)');
      }
    }

    const newId = await this.repository.createJob(entity);

    if (Array.isArray(imagenes) && imagenes.length > 0) {
      await this.repository.addImagesToJob(newId, imagenes);
    }

    return newId;
  }
  // ACÁ YA NO

}