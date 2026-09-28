export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

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

// GET /api/trabajos/:id
export async function getTrabajoById(jobId) {
  const res = await fetch(`${BASE_URL}/trabajos/${jobId}`);
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

// GET /api/localidades
export async function getLocalidades() {
  const res = await fetch(`${BASE_URL}/localidades`);

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

// GET /api/notificaciones (protegida: las del usuario logueado)
export async function getNotificaciones() {
  const res = await fetch(`${BASE_URL}/notificaciones`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Error al traer las notificaciones');
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

// Agregar al final de frontend/src/services/api.js
export async function buscarTrabajadoresPorCategoria(categoriaId) {
  const res = await fetch(`${BASE_URL}/usuarios/buscar?categoria=${categoriaId}`);
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

// GET /api/trabajos/buscar?categoria=<id> -> trabajos abiertos (categoria opcional)
export async function buscarTrabajosPorCategoria(categoriaId) {
  const query = categoriaId ? `?categoria=${categoriaId}` : '';
  const res = await fetch(`${BASE_URL}/trabajos/buscar${query}`);
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

// DELETE /api/postulaciones/:id -> cancelar una postulación propia
export async function cancelarPostulacion(id) {
  const res = await fetch(`${BASE_URL}/postulaciones/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Error al cancelar la postulación');
  }
  return res.json();
}
