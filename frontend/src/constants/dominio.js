// frontend/src/constants/dominio.js
// Constantes del dominio compartidas por las pantallas. Reflejan las del
// backend (backend/src/domain/estados.js y helpers/validaciones.js): si
// cambia una regla allá, cambiarla acá.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Tipos de imagen que acepta POST /api/uploads.
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPT_IMAGENES = TIPOS_IMAGEN.join(',');

// El trabajo recibe postulaciones nuevas (y se pueden aceptar) solo abierto.
export const recibePostulaciones = (estadoTrabajo) => estadoTrabajo === 'abierto';

// Estados de la postulación en los que el chat sigue abierto para escribir.
export const ESTADOS_CHAT_ABIERTO = ['pendiente', 'aceptado', 'por_reconfirmar'];

// Texto de cada estado de postulación (vista del trabajador).
export const ESTADO_POSTULACION_LABEL = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  retirado: 'Retirado',
  por_reconfirmar: 'Confirmá tu interés',
};

// ---------- Colores de los chips de estado ----------
// Cada tono es una clase global job-chip--<tono> (ver index.css). Única tabla
// de colores por estado: la usan JobCard, PostulacionCard y HomeJobCard.

// Estado del trabajo (como está en la base) -> tono.
export const TONO_ESTADO_TRABAJO = {
  abierto: 'azul',
  activa: 'ambar',
  en_espera: 'naranja',
  finalizado: 'verde',
  cancelado: 'rojo',
  vencido: 'gris',
};

export const tonoEstadoTrabajo = (estado) => TONO_ESTADO_TRABAJO[estado] ?? 'gris';

// El Inicio del contratador recibe el estado ya traducido por el backend
// (mapEstadoToStatus en trabajos-service.js): se vuelve al estado de la base
// para usar la misma tabla de colores.
export const ESTADO_TRABAJO_POR_STATUS = {
  PENDIENTE: 'abierto',
  EN_CURSO: 'activa',
  EN_ESPERA: 'en_espera',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
  VENCIDO: 'vencido',
};

// Estado de la postulación -> tono.
export const TONO_ESTADO_POSTULACION = {
  pendiente: 'ambar',
  aceptado: 'verde',
  rechazado: 'rojo',
  retirado: 'gris',
  por_reconfirmar: 'naranja',
};

// p: postulación con `estado` y `estado_trabajo`. Una aceptada cuyo trabajo
// se canceló va en rojo (su etiqueta es "Trabajo cancelado").
export function tonoEstadoPostulacion(p) {
  if (p.estado === 'aceptado' && p.estado_trabajo === 'cancelado') return 'rojo';
  return TONO_ESTADO_POSTULACION[p.estado] ?? 'gris';
}

// Una postulación aceptada muestra el estado del trabajo: "Aceptado" no dice
// si ya se hizo o si el contratador lo canceló.
const ESTADO_TRABAJO_ACEPTADO_LABEL = {
  finalizado: 'Completado',
  cancelado: 'Trabajo cancelado',
};

// p: postulación con `estado` y `estado_trabajo` (GET /postulaciones/mias).
export function labelEstadoPostulacion(p) {
  if (p.estado === 'aceptado' && ESTADO_TRABAJO_ACEPTADO_LABEL[p.estado_trabajo]) {
    return ESTADO_TRABAJO_ACEPTADO_LABEL[p.estado_trabajo];
  }
  return ESTADO_POSTULACION_LABEL[p.estado] ?? p.estado;
}

// Mismas reglas que exigirPuedeCancelarPostulacion() del backend: una
// pendiente se cancela mientras el trabajo siga abierto; una aceptada,
// mientras el trabajo esté activo. (Una por_reconfirmar también se puede
// cancelar, pero para eso ya está el botón "Ya no me interesa".)
export function puedeCancelarPostulacion(p) {
  if (p.estado === 'pendiente') return recibePostulaciones(p.estado_trabajo);
  if (p.estado === 'aceptado') return p.estado_trabajo === 'activa';
  return false;
}

// Días que tiene un postulante para reconfirmar cuando se reabre un trabajo.
export const PLAZO_RECONFIRMACION_DIAS = 2;
