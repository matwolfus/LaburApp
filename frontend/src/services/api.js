const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

// GET /api/trabajos/:id
export async function getTrabajoById(jobId) {
  const res = await fetch(`${BASE_URL}/trabajos/${jobId}`);
  if (!res.ok) throw new Error('Error al traer el trabajo');
  return res.json();
}

// GET /api/postulaciones/trabajo/:idTrabajo
export async function getPostulantesByTrabajo(jobId) {
  const res = await fetch(`${BASE_URL}/postulaciones/trabajo/${jobId}`);
  if (!res.ok) throw new Error('Error al traer los postulantes');
  return res.json();
}

// GET /api/categorias
export async function getCategorias() {
  const res = await fetch(`${BASE_URL}/categorias`);
  if (!res.ok) throw new Error('Error al traer las categorías');
  return res.json();
}

// GET /api/usuarios/:id
export async function getUsuarioById(id) {
  const res = await fetch(`${BASE_URL}/usuarios/${id}`);
  if (!res.ok) throw new Error('Error al traer el usuario');
  return res.json();
}

// GET /api/usuarios/recomendados
export async function getRecomendados() {
  const res = await fetch(`${BASE_URL}/usuarios/recomendados`);
  if (!res.ok) throw new Error('Error al traer los recomendados');
  return res.json();
}

// GET /api/trabajos/contratador?employer_id=X
export async function getTrabajos(employerId) {
  const res = await fetch(`${BASE_URL}/trabajos/contratador?employer_id=${employerId}`);
  if (!res.ok) throw new Error('Error al traer los trabajos');
  return res.json();
}

// GET /api/trabajos/ofertas?employer_id=X
export async function getOfertas(employerId) {
  const res = await fetch(`${BASE_URL}/trabajos/ofertas?employer_id=${employerId}`);
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al crear el trabajo');
  }
  return res.json(); // { id }
}