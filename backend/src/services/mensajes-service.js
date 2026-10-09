// backend/src/services/mensajes-service.js
import MensajesRepository, { ESTADOS_CHAT_ABIERTO } from '../repositories/mensajes-repository.js';

const CUERPO_MAX_LENGTH = 2000;

export default class MensajesService {
  constructor() {
    this.repository = new MensajesRepository();
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
      const err = new Error('Chat no encontrado');
      err.status = 404;
      throw err;
    }
    const participa =
      Number(chat.id_contratante) === Number(idUsuario) ||
      Number(chat.id_trabajador) === Number(idUsuario);
    if (!participa) {
      const err = new Error('No participás de este chat');
      err.status = 403;
      throw err;
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
      const err = new Error('Este chat está cerrado: la postulación ya no está activa');
      err.status = 403;
      throw err;
    }

    const texto = (cuerpo ?? '').trim();
    if (!texto) {
      throw new Error('El mensaje no puede estar vacío');
    }
    if (texto.length > CUERPO_MAX_LENGTH) {
      throw new Error(`El mensaje no puede superar los ${CUERPO_MAX_LENGTH} caracteres`);
    }

    const mensaje = await this.repository.crear(idPostulacion, idRemitente, texto);

    const idOtro = Number(chat.id_contratante) === Number(idRemitente)
      ? chat.id_trabajador
      : chat.id_contratante;

    return { mensaje, idOtro };
  }
}
