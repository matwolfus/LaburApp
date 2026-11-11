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

// Días que tiene un postulante para reconfirmar cuando se reabre un trabajo.
export const PLAZO_RECONFIRMACION_DIAS = 2;
