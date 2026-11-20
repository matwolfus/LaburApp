// frontend/src/services/api/trabajos.js — Trabajos
import { request, toQuery } from './cliente';

// GET /api/trabajos/:id (pública: si hay token lo manda para que el backend
// incluya el precio propuesto propio si corresponde)
export function getTrabajoById(jobId) {
  return request(`/trabajos/${jobId}`, { fallback: 'Error al traer el trabajo' });
}

// GET /api/trabajos/contratador -> el contratador se toma del token.
export function getTrabajos() {
  return request('/trabajos/contratador', { fallback: 'Error al traer los trabajos' });
}

// GET /api/trabajos/ofertas -> el contratador se toma del token.
export function getOfertas() {
  return request('/trabajos/ofertas', { fallback: 'Error al traer las ofertas' });
}

// POST /api/trabajos -> { id }
export function createTrabajo(data) {
  return request('/trabajos', { method: 'POST', body: data, fallback: 'Error al crear el trabajo' });
}

// PUT /api/trabajos/:id -> { id }
export function updateTrabajo(jobId, data) {
  return request(`/trabajos/${jobId}`, { method: 'PUT', body: data, fallback: 'Error al guardar los cambios' });
}

// PATCH /api/trabajos/:id/completar (solo el dueño)
export function completarTrabajo(jobId) {
  return request(`/trabajos/${jobId}/completar`, {
    method: 'PATCH', fallback: 'Error al marcar el trabajo como completado',
  });
}

// PATCH /api/trabajos/:id/cancelar (solo el dueño)
export function cancelarTrabajo(jobId) {
  return request(`/trabajos/${jobId}/cancelar`, { method: 'PATCH', fallback: 'Error al cancelar el trabajo' });
}

// PATCH /api/trabajos/:id/reabrir { programado_para } (solo el dueño)
export function reabrirTrabajo(jobId, programadoPara) {
  return request(`/trabajos/${jobId}/reabrir`, {
    method: 'PATCH', body: { programado_para: programadoPara }, fallback: 'Error al reabrir el trabajo',
  });
}

// GET /api/trabajos/buscar?categoria=&provincia=&localidad= -> trabajos abiertos.
// Manda el token si hay sesión: el backend excluye los trabajos propios.
export function buscarTrabajos({ categoria, provincia, localidad } = {}) {
  return request(`/trabajos/buscar${toQuery({ categoria, provincia, localidad })}`, {
    fallback: 'Error al buscar trabajos',
  });
}
