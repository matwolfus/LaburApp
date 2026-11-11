// TODO: trabajos service
// backend/src/services/trabajos-service.js
import TrabajosRepository from '../repositories/trabajos-repository.js';
import { badRequest, conflict, parseId, parseOptionalId } from '../helpers/http-error.js';
import { LIMITES, precioOpcional, textoOpcional, textoRequerido } from '../helpers/validaciones.js';

// Estado de la base -> estado que muestra HomeJobCard. Antes todo lo que no
// fuera abierto/proxima se mostraba "Finalizado", incluso un trabajo 'activa'
// (con trabajador aceptado, todavía sin hacer).
const STATUS_POR_ESTADO = {
  abierto:    'PENDIENTE',   // buscando trabajadores (DEFAULT de la tabla)
  proxima:    'PENDIENTE',   // viene de datos previos, equivale a abierto
  activa:     'EN_CURSO',    // hay un trabajador aceptado
  en_espera:  'EN_ESPERA',   // el aceptado canceló, falta reabrir
  finalizado: 'FINALIZADO',
  cancelado:  'CANCELADO',
  vencido:    'VENCIDO',
};

function mapEstadoToStatus(estado) {
  return STATUS_POR_ESTADO[estado] ?? 'PENDIENTE';
}

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

  // Trabajos abiertos para que un trabajador los descubra (filtros opcionales).
  async buscarAbiertosAsync(filtros) {
    return await this.repository.buscarAbiertos(filtros);
  }

  // Solo un trabajo 'en_espera' se reabre, y siempre con una fecha nueva
  // que no esté en el pasado (si no, vencería en el acto).
  async reabrirTrabajoAsync(jobId, currentEstado, programadoPara) {
    if (currentEstado !== 'en_espera') {
      throw badRequest("Solo se puede reabrir un trabajo en espera");
    }
    if (!programadoPara || isNaN(Date.parse(programadoPara))) {
      throw badRequest('Elegí una nueva fecha para el trabajo');
    }
    if (this.#esFechaPasada(programadoPara)) {
      throw badRequest('La fecha y hora del trabajo ya pasaron');
    }
    return await this.repository.reabrirTrabajo(jobId, programadoPara);
  }

  // Marca un trabajo 'activa' como completado (cierra también su contrato).
  // Valida el estado acá, no en el repository, mismo criterio que el resto
  // de las validaciones de negocio de este service.
  async completarTrabajoAsync(jobId, currentEstado) {
    if (currentEstado !== 'activa') {
      throw badRequest("Solo se puede completar un trabajo en estado 'activa'");
    }
    return await this.repository.completarTrabajo(jobId);
  }

  // Un trabajo ya 'finalizado' o 'cancelado' no se puede volver a cancelar.
  async cancelarTrabajoAsync(jobId, currentEstado) {
    if (currentEstado === 'finalizado' || currentEstado === 'cancelado') {
      throw badRequest(`No se puede cancelar un trabajo en estado '${currentEstado}'`);
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
  // Además de validar, NORMALIZA la entidad en el lugar (trim de textos, ids y
  // presupuesto como Number) para que el repository guarde datos limpios.
  #validateJobFields(entity, imagenes) {
    // Requeridos
    if (!entity?.id_contratante) throw badRequest('id_contratante es requerido');
    entity.id_categoria = parseId(entity.id_categoria, 'id_categoria');
    entity.id_localidad = parseOptionalId(entity.id_localidad, 'id_localidad') ?? null;

    // Textos: largo máximo según las columnas (titulo varchar(255) en la base,
    // pero se limita a 100 para que entre en las tarjetas).
    entity.titulo      = textoRequerido(entity.titulo, 'El título', LIMITES.TITULO);
    entity.descripcion = textoOpcional(entity.descripcion, 'La descripción', LIMITES.DESCRIPCION);
    entity.duracion    = textoOpcional(entity.duracion, 'La duración', LIMITES.DURACION);
    entity.direccion   = textoOpcional(entity.direccion, 'La dirección', LIMITES.DIRECCION);

    // programado_para: si viene, que sea una fecha parseable
    if (entity.programado_para === '') entity.programado_para = null;
    if (entity.programado_para != null && (typeof entity.programado_para !== 'string' || isNaN(Date.parse(entity.programado_para)))) {
      throw badRequest('programado_para no es una fecha válida');
    }

    // presupuesto: si viene, number > 0 y que entre en numeric(10,2)
    entity.presupuesto = precioOpcional(entity.presupuesto, 'El presupuesto');

    // prioridad: si viene, dentro de los valores permitidos
    if (entity.prioridad != null && !['normal', 'urgente'].includes(entity.prioridad)) {
      throw badRequest("prioridad debe ser 'normal' o 'urgente'");
    }

    // lat / lng: si vienen, numbers en rango
    if (entity.lat != null) {
      const lat = Number(entity.lat);
      if (isNaN(lat) || lat < -90 || lat > 90) throw badRequest('lat fuera de rango (-90..90)');
    }
    if (entity.lng != null) {
      const lng = Number(entity.lng);
      if (isNaN(lng) || lng < -180 || lng > 180) throw badRequest('lng fuera de rango (-180..180)');
    }

    // imagenes: si viene, array de hasta 2 URLs (lo mismo que acepta /api/uploads)
    if (imagenes != null) {
      if (!Array.isArray(imagenes) || imagenes.some((u) => typeof u !== 'string' || !u || u.length > LIMITES.URL)) {
        throw badRequest('imagenes debe ser un array de URLs');
      }
      if (imagenes.length > LIMITES.IMAGENES_POR_TRABAJO) {
        throw badRequest(`Se pueden cargar hasta ${LIMITES.IMAGENES_POR_TRABAJO} fotos`);
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
      throw badRequest('La fecha y hora del trabajo ya pasaron');
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
  async updateJobAsync(jobId, entity, imagenes = [], currentEstado) {
    // Un trabajo cerrado ya no se edita (ej. cambiarle el presupuesto después de finalizarlo).
    if (currentEstado === 'finalizado' || currentEstado === 'cancelado') {
      throw conflict(`No se puede editar un trabajo ${currentEstado}`);
    }

    this.#validateJobFields(entity, imagenes);

    // La fecha solo se revalida si cambió: así se puede editar un trabajo vencido
    // (otros campos) sin que lo bloquee, pero no ponerle otra fecha pasada.
    const actual = await this.repository.getSchedule(jobId);
    const cambioFecha = this.#normalizarFecha(actual?.programado_para) !== this.#normalizarFecha(entity.programado_para);
    const fechaPasada = this.#esFechaPasada(entity.programado_para);
    if (cambioFecha && fechaPasada) {
      throw badRequest('La fecha y hora del trabajo ya pasaron');
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