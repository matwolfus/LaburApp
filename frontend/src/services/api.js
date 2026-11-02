export const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Devuelve el header Authorization con el JWT guardado (si hay sesión).
// Se usa en las requests que pegan a rutas protegidas del backend.
function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Sesión vencida o token inválido: se limpia y se vuelve al login. Recarga
// completa a propósito, para que no quede en memoria estado del usuario.
function cerrarSesionVencida() {
  logout();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

// Única forma de pegarle a la API (salvo login/register). El backend
// responde todos los errores como { error }: si la respuesta no es ok, se
// tira un Error con ese texto (o `fallback` si no vino ninguno) y con el
// status HTTP en err.status, para las pantallas que distinguen casos.
// `body` se manda como JSON; `form` como multipart (FormData).
async function request(path, { method = 'GET', body, form, fallback = 'Ocurrió un error' } = {}) {
  const headers = { ...authHeaders() };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (res.status === 401 && localStorage.getItem('token')) {
    cerrarSesionVencida();
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || fallback);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

// POST /api/usuarios/login
// Devuelve el body parseado tal cual (no tira excepción en error): el caller
// distingue éxito/error leyendo `data.success` / `data.errorCode`, igual que
// hacía antes con el fetch directo.
export async function login(email, contrasena) {
  const res = await fetch(`${BASE_URL}/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, contrasena }),
  });
  return res.json();
}

// POST /api/usuarios/register (mismo criterio que login: devuelve el body tal cual)
export async function register(payload) {
  const res = await fetch(`${BASE_URL}/usuarios/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Cierra la sesión del usuario eliminando el JWT, el userId y el modo activo
// guardados (Login.jsx guarda los dos primeros al iniciar sesión; AuthContext
// el modo).
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("modoActivo");
}

// Arma "?a=1&b=2" salteando los valores vacíos.
function toQuery(params) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return qs ? `?${qs}` : '';
}

// =========================================================
// TRABAJOS
// =========================================================

// GET /api/trabajos/:id (pública: funciona sin sesión, pero si hay token lo
// manda para que el backend pueda incluir el precio propuesto propio si
// corresponde)
export function getTrabajoById(jobId) {
  return request(`/trabajos/${jobId}`, { fallback: 'Error al traer el trabajo' });
}

// GET /api/trabajos/contratador -> el contratador se toma del token, no de la query.
export function getTrabajos() {
  return request('/trabajos/contratador', { fallback: 'Error al traer los trabajos' });
}

// GET /api/trabajos/ofertas -> el contratador se toma del token, no de la query.
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

// PATCH /api/trabajos/:id/completar (protegida: solo el dueño del trabajo)
export function completarTrabajo(jobId) {
  return request(`/trabajos/${jobId}/completar`, { method: 'PATCH', fallback: 'Error al marcar el trabajo como completado' });
}

// PATCH /api/trabajos/:id/cancelar (protegida: solo el dueño del trabajo)
export function cancelarTrabajo(jobId) {
  return request(`/trabajos/${jobId}/cancelar`, { method: 'PATCH', fallback: 'Error al cancelar el trabajo' });
}

// PATCH /api/trabajos/:id/reabrir { programado_para } (protegida: solo el dueño)
export function reabrirTrabajo(jobId, programadoPara) {
  return request(`/trabajos/${jobId}/reabrir`, {
    method: 'PATCH',
    body: { programado_para: programadoPara },
    fallback: 'Error al reabrir el trabajo',
  });
}

// GET /api/trabajos/buscar?categoria=&provincia=&localidad= -> trabajos abiertos (filtros opcionales).
// Manda el token si hay sesión: el backend excluye los trabajos propios.
export function buscarTrabajos({ categoria, provincia, localidad } = {}) {
  return request(`/trabajos/buscar${toQuery({ categoria, provincia, localidad })}`, { fallback: 'Error al buscar trabajos' });
}

// POST /api/uploads (protegida: requiere sesión) -> { urls }
export function uploadFotos(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('fotos', file));
  return request('/uploads', { method: 'POST', form: formData, fallback: 'Error al subir las fotos' });
}

// =========================================================
// POSTULACIONES
// =========================================================

// GET /api/postulaciones/trabajo/:idTrabajo (protegida: solo el dueño del trabajo)
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

// GET /api/postulaciones/mias -> postulaciones propias (protegida)
export function getMisPostulaciones() {
  return request('/postulaciones/mias', { fallback: 'Error al traer tus postulaciones' });
}

// PATCH /api/postulaciones/:id/aceptar (protegida: solo el dueño del trabajo)
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
  return request(`/postulaciones/${id}/reconfirmar`, { method: 'PATCH', body: { sigue }, fallback: 'Error al responder' });
}

// =========================================================
// USUARIOS
// =========================================================

// GET /api/usuarios/me -> el usuario logueado (identidad tomada del token).
export function getMiUsuario() {
  return request('/usuarios/me', { fallback: 'Error al traer el usuario' });
}

// PUT /api/usuarios/me -> guarda los datos del perfil del usuario logueado.
export function actualizarMiPerfil(datos) {
  return request('/usuarios/me', { method: 'PUT', body: datos, fallback: 'Error al guardar el perfil' });
}

// GET /api/usuarios/:id/perfil
export function getPerfil(idUsuario) {
  return request(`/usuarios/${idUsuario}/perfil`, { fallback: 'Error al traer el perfil' });
}

// GET /api/usuarios/recomendados
export function getRecomendados() {
  return request('/usuarios/recomendados', { fallback: 'Error al traer los recomendados' });
}

// GET /api/usuarios/buscar?categoria=&provincia=&localidad= (al menos uno)
export function buscarTrabajadores({ categoria, provincia, localidad } = {}) {
  return request(`/usuarios/buscar${toQuery({ categoria, provincia, localidad })}`, { fallback: 'Error al buscar trabajadores' });
}

// PATCH /api/usuarios/me/rol -> cambia el modo activo (contratador/trabajador)
export function actualizarRolActivo(rol) {
  return request('/usuarios/me/rol', { method: 'PATCH', body: { rol }, fallback: 'Error al cambiar de modo' });
}

// PUT /api/usuarios/me/categorias -> reemplaza el set de categorías que ofrece el usuario
export function actualizarMisCategorias(categoriaIds) {
  return request('/usuarios/me/categorias', { method: 'PUT', body: { categoriaIds }, fallback: 'Error al guardar las categorías' });
}

// =========================================================
// CATÁLOGOS
// =========================================================

// GET /api/categorias
export function getCategorias() {
  return request('/categorias', { fallback: 'Error al traer las categorías' });
}

// GET /api/provincias
export function getProvincias() {
  return request('/provincias', { fallback: 'Error al traer las provincias' });
}

// GET /api/localidades?provincia=&q= (ambos opcionales)
export function getLocalidades({ provincia, q } = {}) {
  return request(`/localidades${toQuery({ provincia, q })}`, { fallback: 'Error al traer las localidades' });
}

// =========================================================
// RESEÑAS
// =========================================================

// GET /api/resenas/elegibilidad/:idTrabajo (protegida: la del usuario logueado)
export function getElegibilidadResena(jobId) {
  return request(`/resenas/elegibilidad/${jobId}`, { fallback: 'Error al consultar la reseña' });
}

// POST /api/resenas (protegida)
export function crearResena({ id_trabajo, calificacion, comentario }) {
  return request('/resenas', {
    method: 'POST',
    body: { id_trabajo, calificacion, comentario },
    fallback: 'Error al enviar la reseña',
  });
}

// =========================================================
// MENSAJES
// =========================================================

// GET /api/mensajes/conversaciones (protegida: las del usuario logueado)
export function getConversaciones() {
  return request('/mensajes/conversaciones', { fallback: 'Error al traer las conversaciones' });
}

// GET /api/mensajes/no-leidos/count (protegida) -> { count }
export function getMensajesNoLeidosCount() {
  return request('/mensajes/no-leidos/count', { fallback: 'Error al traer los mensajes no leídos' });
}

// GET /api/mensajes/postulacion/:id/info (protegida) -> cabecera del chat
export function getChatInfo(idPostulacion) {
  return request(`/mensajes/postulacion/${idPostulacion}/info`, { fallback: 'Error al abrir el chat' });
}

// GET /api/mensajes/postulacion/:idPostulacion (protegida). desdeId es opcional:
// sin él trae todo el historial, con él solo los mensajes posteriores a ese id.
export function getMensajes(idPostulacion, desdeId) {
  const query = desdeId ? `?desde=${desdeId}` : '';
  return request(`/mensajes/postulacion/${idPostulacion}${query}`, { fallback: 'Error al traer los mensajes' });
}

// POST /api/mensajes (protegida)
export function enviarMensaje(idPostulacion, cuerpo) {
  return request('/mensajes', {
    method: 'POST',
    body: { id_postulacion: idPostulacion, cuerpo },
    fallback: 'Error al enviar el mensaje',
  });
}

// =========================================================
// NOTIFICACIONES
// =========================================================

// GET /api/notificaciones (protegida: las del usuario logueado)
export function getNotificaciones() {
  return request('/notificaciones', { fallback: 'Error al traer las notificaciones' });
}

// GET /api/notificaciones/no-leidas/count (protegida) -> { count }
export function getNotificacionesNoLeidasCount() {
  return request('/notificaciones/no-leidas/count', { fallback: 'Error al traer las notificaciones no leídas' });
}

// PATCH /api/notificaciones/leidas -> marca todas las del usuario como leídas
export function marcarTodasNotificacionesLeidas() {
  return request('/notificaciones/leidas', { method: 'PATCH', fallback: 'Error al marcar las notificaciones como leídas' });
}

// PATCH /api/notificaciones/:id/leido (protegida: solo el dueño de la notificación)
export function marcarNotificacionLeida(id) {
  return request(`/notificaciones/${id}/leido`, { method: 'PATCH', fallback: 'Error al marcar la notificación como leída' });
}
