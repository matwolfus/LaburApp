// frontend/src/services/api.js
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
