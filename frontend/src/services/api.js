export const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Devuelve el header Authorization con el JWT guardado (si hay sesión).
// Se usa en las requests que pegan a rutas protegidas del backend.
function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
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

// GET /api/trabajos/:id (pública: funciona sin sesión, pero si hay token lo
// manda para que el backend pueda incluir el precio propuesto propio si
// corresponde)
export async function getTrabajoById(jobId) {
  const res = await fetch(`${BASE_URL}/trabajos/${jobId}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al traer el trabajo');
  return res.json();
}

// GET /api/postulaciones/trabajo/:idTrabajo (protegida: solo el dueño del trabajo)
export async function getPostulantesByTrabajo(jobId) {
  const res = await fetch(`${BASE_URL}/postulaciones/trabajo/${jobId}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al traer los postulantes');
  return res.json();
}

// GET /api/categorias
export async function getCategorias() {
  const res = await fetch(`${BASE_URL}/categorias`);
  if (!res.ok) throw new Error('Error al traer las categorías');
  return res.json();
}

// GET /api/usuarios/me -> el usuario logueado (identidad tomada del token).
export async function getMiUsuario() {
  const res = await fetch(`${BASE_URL}/usuarios/me`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al traer el usuario');
  return res.json();
}

// GET /api/usuarios/recomendados
export async function getRecomendados() {
  const res = await fetch(`${BASE_URL}/usuarios/recomendados`);
  if (!res.ok) throw new Error('Error al traer los recomendados');
  return res.json();
}

// GET /api/trabajos/contratador -> el contratador se toma del token, no de la query.
export async function getTrabajos() {
  const res = await fetch(`${BASE_URL}/trabajos/contratador`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al traer los trabajos');
  return res.json();
}

// GET /api/trabajos/ofertas -> el contratador se toma del token, no de la query.
export async function getOfertas() {
  const res = await fetch(`${BASE_URL}/trabajos/ofertas`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al traer las ofertas');
  return res.json();
}

// POST /api/uploads
export async function uploadFotos(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('fotos', file));

  const res = await fetch(`${BASE_URL}/uploads`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al subir las fotos');
  }
  return res.json(); // { urls }
}

// POST /api/trabajos
export async function createTrabajo(data) {
  const res = await fetch(`${BASE_URL}/trabajos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al crear el trabajo');
  }
  return res.json(); // { id }
}

// Cierra la sesión del usuario eliminando el JWT y el userId guardados
// (Login.jsx guarda ambos al iniciar sesión; antes acá solo se borraba el
// token y el userId quedaba pegado en localStorage entre sesiones).
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
}


// GET /api/usuarios/:id/perfil
export async function getPerfil(idUsuario) {

  const res = await fetch(`${BASE_URL}/usuarios/${idUsuario}/perfil`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Error al traer el perfil");
  }

  return await res.json();

}

// Arma "?a=1&b=2" salteando los valores vacíos.
function toQuery(params) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return qs ? `?${qs}` : '';
}

// GET /api/provincias
export async function getProvincias() {
  const res = await fetch(`${BASE_URL}/provincias`);
  if (!res.ok) throw new Error('Error al traer las provincias');
  return res.json();
}

// GET /api/localidades?provincia=&q= (ambos opcionales)
export async function getLocalidades({ provincia, q } = {}) {
  const res = await fetch(`${BASE_URL}/localidades${toQuery({ provincia, q })}`);

  if (!res.ok) {
    throw new Error('Error al traer las localidades');
  }

  return res.json();
}

// PUT /api/trabajos/:id
export async function updateTrabajo(jobId, data) {
  const res = await fetch(`${BASE_URL}/trabajos/${jobId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al guardar los cambios');
  }
  return res.json(); // { id }
}

// PATCH /api/trabajos/:id/completar (protegida: solo el dueño del trabajo)
export async function completarTrabajo(jobId) {
  const res = await fetch(`${BASE_URL}/trabajos/${jobId}/completar`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al marcar el trabajo como completado');
  }
  return res.json();
}

// PATCH /api/trabajos/:id/cancelar (protegida: solo el dueño del trabajo)
export async function cancelarTrabajo(jobId) {
  const res = await fetch(`${BASE_URL}/trabajos/${jobId}/cancelar`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al cancelar el trabajo');
  }
  return res.json();
}

// GET /api/resenas/elegibilidad/:idTrabajo (protegida: la del usuario logueado)
export async function getElegibilidadResena(jobId) {
  const res = await fetch(`${BASE_URL}/resenas/elegibilidad/${jobId}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al consultar la reseña');
  return res.json();
}

// POST /api/resenas (protegida)
export async function crearResena({ id_trabajo, calificacion, comentario }) {
  const res = await fetch(`${BASE_URL}/resenas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ id_trabajo, calificacion, comentario }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al enviar la reseña');
  }
  return res.json();
}

// GET /api/mensajes/conversaciones (protegida: las del usuario logueado)
export async function getConversaciones() {
  const res = await fetch(`${BASE_URL}/mensajes/conversaciones`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al traer las conversaciones');
  return res.json();
}

// GET /api/mensajes/no-leidos/count (protegida) -> { count }
export async function getMensajesNoLeidosCount() {
  const res = await fetch(`${BASE_URL}/mensajes/no-leidos/count`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al traer los mensajes no leídos');
  return res.json();
}

// GET /api/mensajes/postulacion/:id/info (protegida) -> cabecera del chat
export async function getChatInfo(idPostulacion) {
  const res = await fetch(`${BASE_URL}/mensajes/postulacion/${idPostulacion}/info`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al abrir el chat');
  }
  return res.json();
}

// GET /api/mensajes/postulacion/:idPostulacion (protegida). desdeId es opcional:
// sin él trae todo el historial, con él solo los mensajes posteriores a ese id.
export async function getMensajes(idPostulacion, desdeId) {
  const query = desdeId ? `?desde=${desdeId}` : '';
  const res = await fetch(`${BASE_URL}/mensajes/postulacion/${idPostulacion}${query}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al traer los mensajes');
  return res.json();
}

// POST /api/mensajes (protegida)
export async function enviarMensaje(idPostulacion, cuerpo) {
  const res = await fetch(`${BASE_URL}/mensajes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ id_postulacion: idPostulacion, cuerpo }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al enviar el mensaje');
  }
  return res.json();
}

// GET /api/notificaciones (protegida: las del usuario logueado)
export async function getNotificaciones() {
  const res = await fetch(`${BASE_URL}/notificaciones`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al traer las notificaciones');
  return res.json();
}

// GET /api/notificaciones/no-leidas/count (protegida) -> { count }
export async function getNotificacionesNoLeidasCount() {
  const res = await fetch(`${BASE_URL}/notificaciones/no-leidas/count`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al traer las notificaciones no leídas');
  return res.json();
}

// PATCH /api/notificaciones/leidas -> marca todas las del usuario como leídas
export async function marcarTodasNotificacionesLeidas() {
  const res = await fetch(`${BASE_URL}/notificaciones/leidas`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al marcar las notificaciones como leídas');
  return res.json();
}

// PATCH /api/notificaciones/:id/leido (protegida: solo el dueño de la notificación)
export async function marcarNotificacionLeida(id) {
  const res = await fetch(`${BASE_URL}/notificaciones/${id}/leido`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Error al marcar la notificación como leída');
  }
  return res.json();
}

// PATCH /api/postulaciones/:id/aceptar (protegida: solo el dueño del trabajo)
export async function aceptarPostulacion(id) {
  const res = await fetch(`${BASE_URL}/postulaciones/${id}/aceptar`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Error al aceptar la postulación');
  }
  return res.json();
}

// GET /api/usuarios/buscar?categoria=&provincia=&localidad= (al menos uno)
export async function buscarTrabajadores({ categoria, provincia, localidad } = {}) {
  const res = await fetch(`${BASE_URL}/usuarios/buscar${toQuery({ categoria, provincia, localidad })}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al buscar trabajadores');
  }
  return res.json();
}

// PATCH /api/usuarios/me/rol -> cambia el modo activo (contratador/trabajador)
export async function actualizarRolActivo(rol) {
  const res = await fetch(`${BASE_URL}/usuarios/me/rol`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ rol }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al cambiar de modo');
  }
  return res.json();
}

// PUT /api/usuarios/me/categorias -> reemplaza el set de categorías que ofrece el usuario
export async function actualizarMisCategorias(categoriaIds) {
  const res = await fetch(`${BASE_URL}/usuarios/me/categorias`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ categoriaIds }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al guardar las categorías');
  }
  return res.json();
}

// GET /api/trabajos/buscar?categoria=&provincia=&localidad= -> trabajos abiertos (filtros opcionales).
// Manda el token si hay sesión: el backend excluye los trabajos propios.
export async function buscarTrabajos({ categoria, provincia, localidad } = {}) {
  const res = await fetch(`${BASE_URL}/trabajos/buscar${toQuery({ categoria, provincia, localidad })}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al buscar trabajos');
  }
  return res.json();
}

// POST /api/postulaciones -> postularse a un trabajo
export async function postularme(idTrabajo, precioPropuesto) {
  const res = await fetch(`${BASE_URL}/postulaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ id_trabajo: idTrabajo, precio_propuesto: precioPropuesto }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || 'Error al postularse');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// GET /api/postulaciones/mias -> postulaciones propias (protegida)
export async function getMisPostulaciones() {
  const res = await fetch(`${BASE_URL}/postulaciones/mias`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al traer tus postulaciones');
  return res.json();
}

// PATCH /api/postulaciones/:id/cancelar -> cancelar una postulación propia
// (queda 'retirado'; si estaba aceptada, el trabajo queda en espera).
export async function cancelarPostulacion(id) {
  const res = await fetch(`${BASE_URL}/postulaciones/${id}/cancelar`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Error al cancelar la postulación');
  }
  return res.json();
}

// PATCH /api/postulaciones/:id/reconfirmar { sigue } -> "Sigo interesado" / "Ya no me interesa"
export async function reconfirmarPostulacion(id, sigue) {
  const res = await fetch(`${BASE_URL}/postulaciones/${id}/reconfirmar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ sigue }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Error al responder');
  }
  return res.json();
}

// PATCH /api/trabajos/:id/reabrir { programado_para } (protegida: solo el dueño)
export async function reabrirTrabajo(jobId, programadoPara) {
  const res = await fetch(`${BASE_URL}/trabajos/${jobId}/reabrir`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ programado_para: programadoPara }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al reabrir el trabajo');
  }
  return res.json();
}
