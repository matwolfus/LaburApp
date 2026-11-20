// backend/src/services/mensajes-service.js
import MensajesRepository from '../repositories/mensajes-repository.js';
import NotificacionesService from './notificaciones-service.js';
import { HttpError, badRequest } from '../helpers/http-error.js';
import { sinFallar } from '../helpers/sin-fallar.js';
import { ESTADOS_CHAT_ABIERTO } from '../domain/estados.js';

const CUERPO_MAX_LENGTH = 2000;

export default class MensajesService {
  constructor() {
    this.repository = new MensajesRepository();
    this.notificacionesService = new NotificacionesService();
  }

  async getConversacionesAsync(idUsuario) {
    return await this.repository.getConversaciones(idUsuario);
  }

  async getNoLeidosCountAsync(idUsuario) {
    return await this.repository.getNoLeidosCount(idUsuario);
  }

  // Valida participación server-side (no confía en el cliente, mismo
  // criterio que resenas-service.js) antes de mostrar u ordenar nada.
  // Devuelve los participantes para no volver a pedirlos.
  async #validarParticipante(idPostulacion, idUsuario) {
    const chat = await this.repository.getParticipantes(idPostulacion);
    if (!chat) {
      throw new HttpError(404, 'Chat no encontrado');
    }
    const participa =
      Number(chat.id_contratante) === Number(idUsuario) ||
      Number(chat.id_trabajador) === Number(idUsuario);
    if (!participa) {
      throw new HttpError(403, 'No participás de este chat');
    }
    return chat;
  }

  async getChatInfoAsync(idPostulacion, idUsuario) {
    await this.#validarParticipante(idPostulacion, idUsuario);
    return await this.repository.getChatInfo(idPostulacion, idUsuario);
  }

  async getMensajesAsync(idPostulacion, idUsuario, desdeId) {
    await this.#validarParticipante(idPostulacion, idUsuario);
    // Entrar a pedir el hilo (historial completo o "qué hay nuevo") implica
    // que el usuario lo está mirando: se marcan leídos los de la otra
    // persona en el mismo paso.
    await this.repository.marcarLeidos(idPostulacion, idUsuario);
    return await this.repository.getMensajes(idPostulacion, desdeId);
  }

  async crearMensajeAsync(idPostulacion, idRemitente, cuerpo) {
    const chat = await this.#validarParticipante(idPostulacion, idRemitente);

    // Postulación retirada / rechazada: chat en solo lectura.
    if (!ESTADOS_CHAT_ABIERTO.includes(chat.estado)) {
      throw new HttpError(403, 'Este chat está cerrado: la postulación ya no está activa');
    }

    const texto = (cuerpo ?? '').trim();
    if (!texto) {
      throw badRequest('El mensaje no puede estar vacío');
    }
    if (texto.length > CUERPO_MAX_LENGTH) {
      throw badRequest(`El mensaje no puede superar los ${CUERPO_MAX_LENGTH} caracteres`);
    }

    const mensaje = await this.repository.crear(idPostulacion, idRemitente, texto);

    const idOtro = Number(chat.id_contratante) === Number(idRemitente)
      ? chat.id_trabajador
      : chat.id_contratante;

    await sinFallar('avisar nuevo mensaje', () =>
      this.notificacionesService.avisarNuevoMensaje({ idDestinatario: idOtro, idPostulacion })
    );

    return mensaje;
  }
}
