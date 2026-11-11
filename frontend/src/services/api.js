export const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// =====================================================================
// Núcleo: una sola forma de llamar al backend y de leer sus errores.
// =====================================================================

// Error que tiran todas las funciones de este archivo. `message` ya viene
// listo para mostrar (texto del backend o el mensaje por defecto de cada
// función) y `status` permite distinguir casos (0 = sin conexión).
export class ApiError extends Error {
  constructor(message, status, body = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// Borra todo lo que identifica la sesión en el navegador.
export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('modoActivo');
}

// Cierra la sesión del usuario (botón "Cerrar sesión" del Sidebar).
export function logout() {
  clearSession();
}

// Lee el mensaje de error de una respuesta. El backend responde siempre
// { error }; `message` queda como respaldo por si algo viejo lo usa.
async function leerError(res) {
  const body = await res.json().catch(() => null);
  return { body, mensaje: body?.error || body?.message || null };
}

// Hace la request y devuelve el JSON. Si algo sale mal tira ApiError.
//   - auth: manda el JWT si hay sesión (por defecto sí).
//   - body: objeto (se manda como JSON) o FormData (se manda tal cual).
//   - fallback: mensaje si el backend no mandó uno.
//   - throwOnError: false para devolver el body igual en un 4xx (login/registro).
// Un 401 de una request que llevaba token = sesión vencida o inválida:
// se borra la sesión y se vuelve al login, desde cualquier pantalla.
async function request(path, { method = 'GET', body, auth = true, fallback = 'Ocurrió un error', throwOnError = true } = {}) {
  const headers = {};
  const token = auth ? localStorage.getItem('token') : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisá tu conexión.', 0);
  }

  if (res.status === 401 && token) {
    clearSession();
    if (window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
    throw new ApiError('Tu sesión venció. Iniciá sesión de nuevo.', 401);
  }

  if (!res.ok) {
    const { body: errorBody, mensaje } = await leerError(res);
    // throwOnError: false solo aplica a errores del usuario (4xx). Un 500 se tira siempre.
    if (!throwOnError && errorBody && res.status < 500) return errorBody;
    throw new ApiError(mensaje || fallback, res.status, errorBody);
  }

  if (res.status === 204) return null;
  return res.json().catch(() => null);
}

// Arma "?a=1&b=2" salteando los valores vacíos.
function toQuery(params) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return qs ? `?${qs}` : '';
}

// =====================================================================
// Usuarios
// =====================================================================

// POST /api/usuarios/login
// Devuelve el body tal cual también en error (no tira por un 4xx): el caller
// lee `data.success` / `data.errorCode`. Sí tira ApiError sin conexión o con un 500.
export function login(email, contrasena) {
  return request('/usuarios/login', {
    method: 'POST', auth: false, throwOnError: false,
    body: { email, contrasena },
    fallback: 'No se pudo iniciar sesión',
  });
}

// POST /api/usuarios/register (mismo criterio que login)
export function register(payload) {
  return request('/usuarios/register', {
    method: 'POST', auth: false, throwOnError: false,
    body: payload,
    fallback: 'No se pudo crear la cuenta',
  });
}

// GET /api/usuarios/me -> el usuario logueado (identidad tomada del token).
export function getMiUsuario() {
  return request('/usuarios/me', { fallback: 'Error al traer el usuario' });
}

// PUT /api/usuarios/me -> guarda el perfil del usuario logueado.
export function actualizarPerfil(datos) {
  return request('/usuarios/me', { method: 'PUT', body: datos, fallback: 'Error al guardar el perfil' });
}

// GET /api/usuarios/:id/perfil
export function getPerfil(idUsuario) {
  return request(`/usuarios/${idUsuario}/perfil`, { fallback: 'Error al traer el perfil' });
}

// GET /api/usuarios/recomendados
export function getRecomendados() {
  return request('/usuarios/recomendados', { auth: false, fallback: 'Error al traer los recomendados' });
}

// GET /api/usuarios/buscar?categoria=&provincia=&localidad= (al menos uno)
export function buscarTrabajadores({ categoria, provincia, localidad } = {}) {
  return request(`/usuarios/buscar${toQuery({ categoria, provincia, localidad })}`, {
    auth: false, fallback: 'Error al buscar trabajadores',
  });
}

// PATCH /api/usuarios/me/rol -> cambia el modo activo (contratador/trabajador)
export function actualizarRolActivo(rol) {
  return request('/usuarios/me/rol', { method: 'PATCH', body: { rol }, fallback: 'Error al cambiar de modo' });
}

// PUT /api/usuarios/me/categorias -> reemplaza el set de categorías que ofrece el usuario
export function actualizarMisCategorias(categoriaIds) {
  return request('/usuarios/me/categorias', {
    method: 'PUT', body: { categoriaIds }, fallback: 'Error al guardar las categorías',
  });
}

// =====================================================================
// Catálogos
// =====================================================================

// GET /api/categorias
export function getCategorias() {
  return request('/categorias', { auth: false, fallback: 'Error al traer las categorías' });
}

// GET /api/provincias
export function getProvincias() {
  return request('/provincias', { auth: false, fallback: 'Error al traer las provincias' });
}

// GET /api/localidades?provincia=&q= (ambos opcionales)
export function getLocalidades({ provincia, q } = {}) {
  return request(`/localidades${toQuery({ provincia, q })}`, {
    auth: false, fallback: 'Error al traer las localidades',
  });
}

// =====================================================================
// Uploads
// =====================================================================

// POST /api/uploads (requiere sesión) -> { urls }
export function uploadFotos(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('fotos', file));
  return request('/uploads', { method: 'POST', body: formData, fallback: 'Error al subir las fotos' });
}

// =====================================================================
// Trabajos
// =====================================================================

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

// =====================================================================
// Postulaciones
// =====================================================================

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

// =====================================================================
// Reseñas
// =====================================================================

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

// =====================================================================
// Mensajes
// =====================================================================

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

// =====================================================================
// Notificaciones
// =====================================================================

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
