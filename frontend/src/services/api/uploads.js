// frontend/src/services/api/uploads.js — Uploads
import { request } from './cliente';

// POST /api/uploads (requiere sesión) -> { urls }
export function uploadFotos(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('fotos', file));
  return request('/uploads', { method: 'POST', body: formData, fallback: 'Error al subir las fotos' });
}
