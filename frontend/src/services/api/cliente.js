// frontend/src/services/api/cliente.js
// Núcleo de la comunicación con el backend: una sola forma de hacer
// requests y de leer sus errores. Los demás archivos de esta carpeta (uno
// por recurso) solo declaran endpoints usando request().
export const BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
export async function request(path, { method = 'GET', body, auth = true, fallback = 'Ocurrió un error', throwOnError = true } = {}) {
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
export function toQuery(params) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return qs ? `?${qs}` : '';
}
