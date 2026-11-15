// backend/src/services/trabajos-service.js
// Reglas de negocio de los trabajos: quién puede hacer qué, en qué estado,
// qué se cambia junto (transacción) y a quién se avisa. Los controladores
// solo leen la request y llaman a estos métodos.
import Db from '../repositories/db-pg.js';
import TrabajosRepository from '../repositories/trabajos-repository.js';
import PostulacionesRepository from '../repositories/postulaciones-repository.js';
import ContratosService from './contratos-service.js';
import NotificacionesService from './notificaciones-service.js';
import { badRequest, conflict, forbidden, notFound, parseId, parseOptionalId } from '../helpers/http-error.js';
import { LIMITES, precioOpcional, textoOpcional, textoRequerido } from '../helpers/validaciones.js';
import { sinFallar } from '../helpers/sin-fallar.js';
import { esUrlDelBucket } from '../middlewares/upload-middleware.js';
import {
  ESTADO_TRABAJO,
  PRIORIDADES,
  esTrabajoCerrado,
  exigirCambioEstadoTrabajo,
} from '../domain/estados.js';
import { esFechaPasada, normalizarFecha } from '../domain/fechas.js';

// Estado de la base -> estado que muestra HomeJobCard.
const STATUS_POR_ESTADO = {
  [ESTADO_TRABAJO.ABIERTO]:    'PENDIENTE',
  [ESTADO_TRABAJO.ACTIVA]:     'EN_CURSO',
  [ESTADO_TRABAJO.EN_ESPERA]:  'EN_ESPERA',
  [ESTADO_TRABAJO.FINALIZADO]: 'FINALIZADO',
  [ESTADO_TRABAJO.CANCELADO]:  'CANCELADO',
  [ESTADO_TRABAJO.VENCIDO]:    'VENCIDO',
};

const mapEstadoToStatus = (estado) => STATUS_POR_ESTADO[estado] ?? 'PENDIENTE';

export default class TrabajosService {
  constructor() {
    this.db = new Db();
    this.repository = new TrabajosRepository();
    this.postulacionesRepository = new PostulacionesRepository();
    this.contratosService = new ContratosService();
    this.notificacionesService = new NotificacionesService();
  }

  // =========================================================
  // LECTURAS
  // =========================================================

  // Todas las ofertas de un contratador (cualquier estado), pantalla "Ofertas".
  async getAllJobsAsync(employerId) {
    return await this.repository.getAllJobsByEmployer(employerId);
  }

  // "Tus trabajos" de la home del contratador.
  async getJobsByEmployerAsync(employerId) {
    const jobs = await this.repository.getJobsByEmployer(employerId);
    return jobs.map(({ estado, ...job }) => ({ ...job, status: mapEstadoToStatus(estado) }));
  }

  async getJobById(jobId, viewerUserId = null) {
    return await this.repository.getJobById(jobId, viewerUserId);
  }

  async getJobByIdOrFail(jobId, viewerUserId = null) {
    const job = await this.repository.getJobById(jobId, viewerUserId);
    if (!job) throw notFound('Trabajo no encontrado');
    return job;
  }

  // Trabajos abiertos para que un trabajador los descubra (filtros opcionales).
  async buscarAbiertosAsync(filtros) {
    return await this.repository.buscarAbiertos(filtros);
  }

  // Trae el trabajo y verifica que el usuario sea el dueño.
  async getTrabajoPropioAsync(jobId, userId) {
    const job = await this.getJobByIdOrFail(jobId);
    if (Number(job.id_contratante) !== Number(userId)) throw forbidden();
    return job;
  }

  // =========================================================
  // ALTA Y EDICIÓN
  // =========================================================

  // "Publicar trabajo". El trabajo y sus fotos se guardan juntos.
  async createJobAsync(entity, imagenes = []) {
    this.#validateJobFields(entity, imagenes);
    this.#exigirFotosDelBucket(imagenes);

    // Un trabajo nuevo en el pasado quedaría 'vencido' al instante.
    if (esFechaPasada(entity.programado_para)) {
      throw badRequest('La fecha y hora del trabajo ya pasaron');
    }

    return await this.db.withTransaction(async (tx) => {
      const newId = await this.repository.createJob(entity, tx);
      await this.repository.addImagesToJob(newId, imagenes ?? [], tx);
      return newId;
    });
  }

  // "Editar trabajo". Solo el dueño, y no si el trabajo ya está cerrado.
  // Siempre llega la lista final de fotos (vacía si las borró todas).
  async updateJobAsync(jobId, userId, entity, imagenes = []) {
    const job = await this.getTrabajoPropioAsync(jobId, userId);

    // Un trabajo cerrado ya no se edita (ej. cambiarle el presupuesto después de finalizarlo).
    if (esTrabajoCerrado(job.estado)) {
      throw conflict(`No se puede editar un trabajo ${job.estado}`);
    }

    this.#validateJobFields(entity, imagenes);
    // Las fotos que el trabajo ya tenía se aceptan tal cual (pueden ser
    // anteriores a Supabase Storage); las nuevas tienen que ser de nuestro bucket.
    this.#exigirFotosDelBucket(imagenes, (job.images ?? []).map((img) => img.url));

    // La fecha solo se revalida si cambió: así se puede editar un trabajo
    // vencido (otros campos) sin que lo bloquee, pero no ponerle otra fecha pasada.
    const cambioFecha = normalizarFecha(job.scheduled_at) !== normalizarFecha(entity.programado_para);
    const fechaPasada = esFechaPasada(entity.programado_para);
    if (cambioFecha && fechaPasada) {
      throw badRequest('La fecha y hora del trabajo ya pasaron');
    }

    // Vencido + fecha nueva no pasada -> vuelve a 'abierto' (transición
    // vencido -> abierto de domain/estados.js; el UPDATE lo hace el repository).
    const reabrir = job.estado === ESTADO_TRABAJO.VENCIDO && cambioFecha && !fechaPasada;

    return await this.repository.updateJobWithImages(jobId, entity, imagenes ?? [], reabrir);
  }

  // =========================================================
  // CAMBIOS DE ESTADO
  // =========================================================

  // El contratador marca su trabajo como completado: el trabajo pasa a
  // 'finalizado' y su contrato a 'completado', juntos.
  async completarAsync(jobId, userId) {
    const job = await this.getTrabajoPropioAsync(jobId, userId);
    exigirCambioEstadoTrabajo(job.estado, ESTADO_TRABAJO.FINALIZADO, 'marcar como completado');

    const contrato = await this.db.withTransaction(async (tx) => {
      const ok = await this.repository.cambiarEstadoAsync(jobId, [job.estado], ESTADO_TRABAJO.FINALIZADO, tx);
      if (!ok) throw conflict('El trabajo cambió mientras tanto. Recargá la página.');
      return await this.contratosService.completar(jobId, tx);
    });

    await sinFallar('avisar trabajo completado', () =>
      this.notificacionesService.avisarTrabajoCompletado({
        idTrabajo: jobId,
        tituloTrabajo: job.title,
        idContratante: userId,
        idTrabajador: contrato?.id_trabajador ?? null,
      })
    );
  }

  // El contratador cancela su trabajo: se rechazan las postulaciones que
  // seguían abiertas y se cancela el contrato activo, si había.
  async cancelarAsync(jobId, userId) {
    const job = await this.getTrabajoPropioAsync(jobId, userId);
    exigirCambioEstadoTrabajo(job.estado, ESTADO_TRABAJO.CANCELADO, 'cancelar');

    const idsTrabajadores = await this.db.withTransaction(async (tx) => {
      const ok = await this.repository.cambiarEstadoAsync(jobId, [job.estado], ESTADO_TRABAJO.CANCELADO, tx);
      if (!ok) throw conflict('El trabajo cambió mientras tanto. Recargá la página.');

      const rechazados = await this.postulacionesRepository.rechazarAbiertasDeTrabajoAsync(
        jobId, { automatico: false }, tx
      );
      const contrato = await this.contratosService.cancelarPorCancelacionDelTrabajo(jobId, tx);

      return contrato ? [...rechazados, contrato.id_trabajador] : rechazados;
    });

    await sinFallar('avisar trabajo cancelado', () =>
      this.notificacionesService.avisarTrabajoCancelado({
        idTrabajo: jobId,
        tituloTrabajo: job.title,
        idsTrabajadores,
      })
    );
  }

  // Reabre un trabajo que quedó 'en_espera' porque el trabajador aceptado
  // se bajó. Necesita una fecha nueva que no esté en el pasado. Los
  // postulantes que el sistema había rechazado reciben un aviso para
  // reconfirmar su interés.
  async reabrirAsync(jobId, userId, programadoPara) {
    const job = await this.getTrabajoPropioAsync(jobId, userId);

    // De 'vencido' también se puede volver a 'abierto', pero eso es editando
    // la fecha (updateJobAsync). "Reabrir" es solo para un trabajo en espera.
    if (job.estado !== ESTADO_TRABAJO.EN_ESPERA) {
      throw conflict('Solo se puede reabrir un trabajo en espera');
    }
    if (typeof programadoPara !== 'string' || isNaN(Date.parse(programadoPara))) {
      throw badRequest('Elegí una nueva fecha para el trabajo');
    }
    if (esFechaPasada(programadoPara)) {
      throw badRequest('La fecha y hora del trabajo ya pasaron');
    }

    const aReconfirmar = await this.db.withTransaction(async (tx) => {
      const ok = await this.repository.reabrirAsync(jobId, programadoPara, tx);
      if (!ok) throw conflict('El trabajo cambió mientras tanto. Recargá la página.');
      return await this.postulacionesRepository.pasarAReconfirmarAsync(jobId, tx);
    });

    await sinFallar('avisar reapertura', () =>
      this.notificacionesService.avisarReapertura({
        idTrabajo: jobId,
        tituloTrabajo: job.title,
        postulaciones: aReconfirmar,
      })
    );
  }

  // =========================================================
  // VALIDACIONES
  // =========================================================

  // Las fotos de un trabajo solo pueden ser URLs de nuestro bucket (subidas
  // por /api/uploads), igual que el avatar. `permitidas`: las que el trabajo
  // ya tenía, que se pueden conservar al editar.
  #exigirFotosDelBucket(imagenes, permitidas = []) {
    for (const url of imagenes ?? []) {
      if (!permitidas.includes(url) && !esUrlDelBucket(url)) {
        throw badRequest('Las fotos del trabajo tienen que subirse desde la app');
      }
    }
  }

  // Validaciones compartidas por crear y editar. Además de validar,
  // NORMALIZA la entidad en el lugar (trim de textos, ids y presupuesto
  // como Number) para que el repository guarde datos limpios. No toca
  // "estado": ni el alta ni la edición lo eligen.
  //
  // Fecha, presupuesto y dirección son obligatorios: son las mismas reglas
  // que el formulario de NuevoTrabajo, pero acá no se pueden saltear.
  #validateJobFields(entity, imagenes) {
    if (!entity?.id_contratante) throw badRequest('id_contratante es requerido');
    entity.id_categoria = parseId(entity.id_categoria, 'id_categoria');
    entity.id_localidad = parseOptionalId(entity.id_localidad, 'id_localidad') ?? null;

    // Textos: largo máximo según las columnas (titulo es varchar(255) en la
    // base, pero se limita a 100 para que entre en las tarjetas).
    entity.titulo      = textoRequerido(entity.titulo, 'El título', LIMITES.TITULO);
    entity.descripcion = textoOpcional(entity.descripcion, 'La descripción', LIMITES.DESCRIPCION);
    // La duración se guarda como texto (varchar), pero el formulario la manda
    // en minutos como número: se aceptan las dos formas.
    const duracion = typeof entity.duracion === 'number' ? String(entity.duracion) : entity.duracion;
    entity.duracion    = textoOpcional(duracion, 'La duración', LIMITES.DURACION);
    entity.direccion   = textoRequerido(entity.direccion, 'La dirección', LIMITES.DIRECCION);

    if (typeof entity.programado_para !== 'string' || !entity.programado_para || isNaN(Date.parse(entity.programado_para))) {
      throw badRequest('Elegí una fecha válida para el trabajo');
    }

    // presupuesto: obligatorio, > 0 y que entre en numeric(10,2)
    entity.presupuesto = precioOpcional(entity.presupuesto, 'El presupuesto');
    if (entity.presupuesto == null) throw badRequest('El presupuesto es obligatorio');

    if (entity.prioridad != null && !PRIORIDADES.includes(entity.prioridad)) {
      throw badRequest(`prioridad debe ser ${PRIORIDADES.map((p) => `'${p}'`).join(' o ')}`);
    }

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
}
