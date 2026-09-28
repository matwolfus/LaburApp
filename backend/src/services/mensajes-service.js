// backend/src/services/mensajes-service.js
import MensajesRepository from '../repositories/mensajes-repository.js';

const CUERPO_MAX_LENGTH = 2000;

export default class MensajesService {
  constructor() {
    this.repository = new MensajesRepository();
  }

  async getConversacionesAsync(idUsuario) {
    return await this.repository.getConversaciones(idUsuario);
  }

  // Valida participación server-side (no confía en el cliente, mismo
  // criterio que resenas-service.js) antes de mostrar u ordenar nada.
  async #validarParticipante(idContrato, idUsuario) {
    const contrato = await this.repository.getContratoParticipantes(idContrato);
    if (!contrato) {
      throw new Error('Contrato no encontrado');
    }
    const participa =
      Number(contrato.id_contratante) === Number(idUsuario) ||
      Number(contrato.id_trabajador) === Number(idUsuario);
    if (!participa) {
      const err = new Error('No participás de este chat');
      err.status = 403;
      throw err;
    }
  }

  async getMensajesAsync(idContrato, idUsuario, desdeId) {
    await this.#validarParticipante(idContrato, idUsuario);
    // Entrar a pedir el hilo (historial completo o "qué hay nuevo") implica
    // que el usuario lo está mirando: se marcan leídos los de la otra
    // persona en el mismo paso.
    await this.repository.marcarLeidos(idContrato, idUsuario);
    return await this.repository.getMensajes(idContrato, desdeId);
  }

  async crearMensajeAsync(idContrato, idRemitente, cuerpo) {
    await this.#validarParticipante(idContrato, idRemitente);

    const texto = (cuerpo ?? '').trim();
    if (!texto) {
      throw new Error('El mensaje no puede estar vacío');
    }
    if (texto.length > CUERPO_MAX_LENGTH) {
      throw new Error(`El mensaje no puede superar los ${CUERPO_MAX_LENGTH} caracteres`);
    }

    return await this.repository.crear(idContrato, idRemitente, texto);
  }

  // Para que el controller sepa a quién notificar sin volver a resolverlo.
  async getOtroParticipanteAsync(idContrato, idUsuario) {
    const contrato = await this.repository.getContratoParticipantes(idContrato);
    if (!contrato) return null;
    return Number(contrato.id_contratante) === Number(idUsuario)
      ? contrato.id_trabajador
      : contrato.id_contratante;
  }
}
