// frontend/src/utils/formato.js
// Formatos de texto compartidos: plata, fechas e iniciales. Antes cada
// pantalla tenía su versión y mostraban lo mismo de formas distintas.

// ---------- Plata ----------

// 10000 -> "$10.000" (hasta 2 decimales si los tiene).
export function formatPesos(monto) {
  return `$${Number(monto).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

// Igual que formatPesos, pero con texto cuando no hay monto.
export function formatPesosOVacio(monto, vacio = 'A convenir') {
  return monto == null || monto === '' ? vacio : formatPesos(monto);
}

// ---------- Fechas ----------
// Las fechas del backend vienen en hora argentina sin zona
// ('YYYY-MM-DDTHH:MM:SS'): new Date() las toma como hora local tal cual.

// Cuando no se elige horario, el formulario guarda 00:00: se trata como "sin horario".
export function tieneHorario(fecha) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

// "lunes, 3 de marzo - 10:30 hs" (sin hora si no se eligió). null si no hay fecha.
export function formatFechaTrabajo(fecha) {
  if (!fecha) return null;
  const d = new Date(fecha);
  const dia = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  if (!tieneHorario(d)) return dia;
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} - ${hora} hs`;
}

// "vie, 13 mar".
export function formatFechaCorta(fecha) {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

// "vie, 13 mar, 10:30".
export function formatFechaHoraCorta(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// ---------- Personas ----------

// "Ana María López" -> "AM". Vacío -> fallback.
export function getIniciales(nombre, fallback = '?') {
  const iniciales = String(nombre ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase())
    .join('');
  return iniciales || fallback;
}

// Número estable de 1 a `cantidad` según el nombre: la misma persona siempre
// cae en el mismo color de avatar (ver --avatar-N-bg en index.css).
export function colorDeNombre(nombre, cantidad = 5) {
  const texto = String(nombre ?? '').trim().toLowerCase();
  let suma = 0;
  for (const letra of texto) suma = (suma * 31 + letra.charCodeAt(0)) % 9973;
  return (suma % cantidad) + 1;
}
