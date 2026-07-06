const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

// Devuelve el header Authorization con el JWT guardado (si hay sesión).
// Se usa en las requests que pegan a rutas protegidas del backend.
function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
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