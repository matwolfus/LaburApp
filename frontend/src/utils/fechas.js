// frontend/src/utils/fechas.js
// Helpers de fecha para los formularios (NuevoTrabajo, ReabrirTrabajoModal).
// Las fechas se manejan como hora local del navegador ('YYYY-MM-DD' y
// 'HH:MM'), igual que las guarda el backend (hora argentina sin zona).

const dosDigitos = (n) => String(n).padStart(2, '0');

// Hoy en formato YYYY-MM-DD, en hora local (no UTC).
export function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
}

// ¿Ya pasó esta fecha (y hora, si se eligió)? Sin hora, vence recién al
// terminar el día: misma regla que esFechaPasada() del backend.
export function fechaHoraYaPaso(fecha, hora) {
  if (!fecha) return false;
  const ahora = new Date();
  const hoy = hoyLocal();
  const hhmm = `${dosDigitos(ahora.getHours())}:${dosDigitos(ahora.getMinutes())}`;
  return fecha < hoy || (fecha === hoy && !!hora && hora < hhmm);
}
