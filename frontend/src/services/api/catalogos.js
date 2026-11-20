// frontend/src/services/api/catalogos.js — Catálogos
import { request, toQuery } from './cliente';

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
