// backend/src/services/resenas-service.js
import ResenasRepository from '../repositories/resenas-repository.js';

export default class ResenasService {
  constructor() {
    this.repository = new ResenasRepository();
  }

  async getElegibilidadAsync(idTrabajo, idUsuario) {
    return await this.repository.getElegibilidad(idTrabajo, idUsuario);
  }

  // Recalcula la elegibilidad server-side en vez de confiar en lo que
  // mande el cliente (mismo criterio que el resto del código: id_contratante
  // sale del token, no del body, en trabajos-controller.js).
  async crearResenaAsync(idTrabajo, idUsuario, calificacion, comentario) {
    const calificacionNum = Number(calificacion);
    if (!Number.isInteger(calificacionNum) || calificacionNum < 1 || calificacionNum > 5) {
      throw new Error('La calificación tiene que ser un número entero entre 1 y 5');
    }

    const elegibilidad = await this.repository.getElegibilidad(idTrabajo, idUsuario);

    if (elegibilidad.idReceptor === null) {
      throw new Error('No participaste de este trabajo');
    }

    if (elegibilidad.yaReseño) {
      throw new Error('Ya dejaste tu reseña para este trabajo');
    }

    if (!elegibilidad.puedeResenar) {
      throw new Error('Este trabajo todavía no está completado');
    }

    try {
      const id = await this.repository.crear({
        idContrato: elegibilidad.idContrato,
        idAutor: idUsuario,
        idReceptor: elegibilidad.idReceptor,
        esContratante: elegibilidad.esContratante,
        calificacion: calificacionNum,
        comentario,
      });
      return { id, idReceptor: elegibilidad.idReceptor };
    } catch (err) {
      // 23505 = unique_violation en Postgres (SQLSTATE), no un texto de
      // mensaje: es el único chequeo confiable para distinguir "ya
      // reseñaste" de cualquier otro error real (ej. de conexión), que no
      // debe disfrazarse de "ya reseñaste".
      if (err.code === '23505') {
        throw new Error('Ya dejaste tu reseña para este trabajo');
      }
      throw err;
    }
  }
}
