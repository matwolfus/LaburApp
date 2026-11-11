// frontend/src/services/api/mensajes.js — Mensajes
import { request, toQuery } from './cliente';

// GET /api/mensajes/conversaciones
export function getConversaciones() {
  return request('/mensajes/conversaciones', { fallback: 'Error al traer las conversaciones' });
}

// GET /api/mensajes/no-leidos/count -> { count }
export function getMensajesNoLeidosCount() {
  return request('/mensajes/no-leidos/count', { fallback: 'Error al traer los mensajes no leídos' });
}

// GET /api/mensajes/postulacion/:id/info -> cabecera del chat
export function getChatInfo(idPostulacion) {
  return request(`/mensajes/postulacion/${idPostulacion}/info`, { fallback: 'Error al abrir el chat' });
}

// GET /api/mensajes/postulacion/:idPostulacion. desdeId es opcional: sin él
// trae todo el historial, con él solo los mensajes posteriores a ese id.
export function getMensajes(idPostulacion, desdeId) {
  return request(`/mensajes/postulacion/${idPostulacion}${toQuery({ desde: desdeId || undefined })}`, {
    fallback: 'Error al traer los mensajes',
  });
}

// POST /api/mensajes
export function enviarMensaje(idPostulacion, cuerpo) {
  return request('/mensajes', {
    method: 'POST', body: { id_postulacion: idPostulacion, cuerpo }, fallback: 'Error al enviar el mensaje',
  });
}
