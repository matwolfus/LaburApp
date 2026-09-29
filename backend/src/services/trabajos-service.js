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
   async getJobById(jobId, viewerUserId = null) {
    return await this.repository.getJobById(jobId, viewerUserId);
  }

  // Trabajos abiertos para que un trabajador los descubra (idCategoria opcional).
  async buscarAbiertosAsync(idCategoria) {
    return await this.repository.buscarAbiertos(idCategoria);
  }

  // Marca un trabajo 'activa' como completado (cierra también su contrato).
  // Valida el estado acá, no en el repository, mismo criterio que el resto
  // de las validaciones de negocio de este service.
  async completarTrabajoAsync(jobId, currentEstado) {
    if (currentEstado !== 'activa') {
      throw new Error("Solo se puede completar un trabajo en estado 'activa'");
    }
    return await this.repository.completarTrabajo(jobId);
  }

  // Un trabajo ya 'finalizado' o 'cancelado' no se puede volver a cancelar.
  async cancelarTrabajoAsync(jobId, currentEstado) {
    if (currentEstado === 'finalizado' || currentEstado === 'cancelado') {
      throw new Error(`No se puede cancelar un trabajo en estado '${currentEstado}'`);
    }
    return await this.repository.cancelarTrabajo(jobId);
  }

  // Devuelve el id del contratador dueño del trabajo (o null si el trabajo no existe).
  async getJobOwnerAsync(jobId) {
    return await this.repository.getOwnerId(jobId);
  }

  // ACÁ AGREGUÉ
  // Validaciones compartidas por crear y editar un trabajo. OJO: no valida "estado" a
  // propósito (updateJobAsync manda estado: null porque acá no se edita el estado).
  #validateJobFields(entity, imagenes) {
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
  }

  // Crea un trabajo (POST de "Publicar tarea"). Valida con el mismo estilo de throw
  // que postulaciones-service y, si vienen, inserta las fotos en imagenes_trabajo.
  async createJobAsync(entity, imagenes = []) {
    this.#validateJobFields(entity, imagenes);

    // Un trabajo nuevo en el pasado quedaría 'vencido' al instante (ver
    // expirarVencidos) y nunca se listaría.
    if (this.#esFechaPasada(entity.programado_para)) {
      throw new Error('La fecha y hora del trabajo ya pasaron');
    }

    const newId = await this.repository.createJob(entity);

    if (Array.isArray(imagenes) && imagenes.length > 0) {
      await this.repository.addImagesToJob(newId, imagenes);
    }

    return newId;
  }
  // ACÁ YA NO

  // ACÁ AGREGUÉ
  // Edita un trabajo (pantalla "Editar trabajo", reusa el form de "Nuevo trabajo").
  // A diferencia de crear, acá SIEMPRE se manda la lista final de fotos (vacía si el
  // usuario las borró todas), y el update + reemplazo de fotos son atómicos (ver repository).
  async updateJobAsync(jobId, entity, imagenes = []) {
    this.#validateJobFields(entity, imagenes);

    // La fecha solo se revalida si cambió: así se puede editar un trabajo vencido
    // (otros campos) sin que lo bloquee, pero no ponerle otra fecha pasada.
    const actual = await this.repository.getSchedule(jobId);
    const cambioFecha = this.#normalizarFecha(actual?.programado_para) !== this.#normalizarFecha(entity.programado_para);
    const fechaPasada = this.#esFechaPasada(entity.programado_para);
    if (cambioFecha && fechaPasada) {
      throw new Error('La fecha y hora del trabajo ya pasaron');
    }

    // Vencido + fecha nueva no pasada -> vuelve a 'abierto' (ver repository).
    const reabrir = cambioFecha && !fechaPasada;

    return await this.repository.updateJobWithImages(jobId, entity, imagenes ?? [], reabrir);
  }

  // 'YYYY-MM-DDTHH:MM' (sin segundos ni offset) para comparar fechas del form contra la base.
  #normalizarFecha(valor) {
    if (valor == null) return null;
    return String(valor).replace(' ', 'T').slice(0, 16);
  }

  // programado_para es hora Argentina sin offset. Sin horario (00:00) vence recién al pasar el día,
  // igual que expirarVencidos() en el repository.
  #esFechaPasada(programadoPara) {
    if (programadoPara == null) return false;
    const ahoraAR = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).replace(' ', 'T');
    const [fecha, hora] = String(programadoPara).split('T');
    const sinHorario = !hora || hora.startsWith('00:00');
    return sinHorario ? fecha < ahoraAR.slice(0, 10) : String(programadoPara) < ahoraAR;
  }
  // ACÁ YA NO

}