// frontend/src/services/api.js
// Punto de entrada único para hablar con el backend. Cada recurso vive en su
// archivo dentro de services/api/ y acá se re-exporta todo, así las
// pantallas siguen importando desde '../services/api'.
export { BASE_URL, ApiError, clearSession, logout } from './api/cliente';
export * from './api/usuarios';
export * from './api/catalogos';
export * from './api/uploads';
export * from './api/trabajos';
export * from './api/postulaciones';
export * from './api/resenas';
export * from './api/mensajes';
export * from './api/notificaciones';
