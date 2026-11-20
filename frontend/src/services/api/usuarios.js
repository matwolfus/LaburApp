// frontend/src/services/api/usuarios.js — Usuarios
import { request, toQuery } from './cliente';

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
