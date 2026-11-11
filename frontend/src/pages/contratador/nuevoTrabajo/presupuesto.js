// Formato del campo "Presupuesto" de NuevoTrabajo (formato argentino:
// punto de miles y coma decimal, máximo 2 decimales).

// "10000" -> "10.000"; "10000,5" -> "10.000,5"
export function formatPresupuesto(raw) {
  const [entero, decimales] = raw.split(',');
  const enteroConPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decimales !== undefined ? `${enteroConPuntos},${decimales}` : enteroConPuntos;
}

// Lo que escribe el usuario -> valor formateado para mostrar en el input.
export function limpiarEntradaPresupuesto(valor) {
  let raw = valor.replace(/[^\d,]/g, '');
  const [entero, ...resto] = raw.split(',');
  if (resto.length > 0) raw = `${entero},${resto.join('').slice(0, 2)}`;
  return raw === '' ? '' : formatPresupuesto(raw);
}

// "10.000,50" -> 10000.5 (lo que espera el backend)
export function parsePresupuesto(formatted) {
  return Number(formatted.replace(/\./g, '').replace(',', '.'));
}

// Número que viene del backend -> valor para el input (inverso de parsePresupuesto).
export function presupuestoParaInput(budget) {
  if (budget == null) return '';
  const num = Number(budget);
  if (isNaN(num)) return '';
  const tieneDecimales = Math.round((num % 1) * 100) !== 0;
  const raw = tieneDecimales ? num.toFixed(2).replace('.', ',') : String(Math.round(num));
  return formatPresupuesto(raw);
}
