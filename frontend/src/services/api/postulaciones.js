// frontend/src/services/api/postulaciones.js — Postulaciones
import { request } from './cliente';

// GET /api/postulaciones/trabajo/:idTrabajo (solo el dueño del trabajo)
export function getPostulantesByTrabajo(jobId) {
  return request(`/postulaciones/trabajo/${jobId}`, { fallback: 'Error al traer los postulantes' });
}

// POST /api/postulaciones -> postularse a un trabajo
export function postularme(idTrabajo, precioPropuesto) {
  return request('/postulaciones', {
    method: 'POST',
    body: { id_trabajo: idTrabajo, precio_propuesto: precioPropuesto },
    fallback: 'Error al postularse',
  });
}

// GET /api/postulaciones/mias -> postulaciones propias
export function getMisPostulaciones() {
  return request('/postulaciones/mias', { fallback: 'Error al traer tus postulaciones' });
}

// PATCH /api/postulaciones/:id/aceptar (solo el dueño del trabajo)
export function aceptarPostulacion(id) {
  return request(`/postulaciones/${id}/aceptar`, { method: 'PATCH', fallback: 'Error al aceptar la postulación' });
}

// PATCH /api/postulaciones/:id/cancelar -> cancelar una postulación propia
// (queda 'retirado'; si estaba aceptada, el trabajo queda en espera).
export function cancelarPostulacion(id) {
  return request(`/postulaciones/${id}/cancelar`, { method: 'PATCH', fallback: 'Error al cancelar la postulación' });
}

// PATCH /api/postulaciones/:id/reconfirmar { sigue } -> "Sigo interesado" / "Ya no me interesa"
export function reconfirmarPostulacion(id, sigue) {
  return request(`/postulaciones/${id}/reconfirmar`, {
    method: 'PATCH', body: { sigue }, fallback: 'Error al responder',
  });
}
