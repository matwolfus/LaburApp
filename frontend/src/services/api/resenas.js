// frontend/src/services/api/resenas.js — Reseñas
import { request } from './cliente';

// GET /api/resenas/elegibilidad/:idTrabajo
export function getElegibilidadResena(jobId) {
  return request(`/resenas/elegibilidad/${jobId}`, { fallback: 'Error al consultar la reseña' });
}

// POST /api/resenas
export function crearResena({ id_trabajo, calificacion, comentario }) {
  return request('/resenas', {
    method: 'POST', body: { id_trabajo, calificacion, comentario }, fallback: 'Error al enviar la reseña',
  });
}
