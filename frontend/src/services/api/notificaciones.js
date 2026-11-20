// frontend/src/services/api/notificaciones.js — Notificaciones
import { request } from './cliente';

// GET /api/notificaciones
export function getNotificaciones() {
  return request('/notificaciones', { fallback: 'Error al traer las notificaciones' });
}

// GET /api/notificaciones/no-leidas/count -> { count }
export function getNotificacionesNoLeidasCount() {
  return request('/notificaciones/no-leidas/count', { fallback: 'Error al traer las notificaciones no leídas' });
}

// PATCH /api/notificaciones/leidas -> marca todas las del usuario como leídas
export function marcarTodasNotificacionesLeidas() {
  return request('/notificaciones/leidas', {
    method: 'PATCH', fallback: 'Error al marcar las notificaciones como leídas',
  });
}

// PATCH /api/notificaciones/:id/leido (solo el dueño de la notificación)
export function marcarNotificacionLeida(id) {
  return request(`/notificaciones/${id}/leido`, {
    method: 'PATCH', fallback: 'Error al marcar la notificación como leída',
  });
}
