// backend/src/middlewares/error-middleware.js
// Única forma de responder un error en la API: siempre JSON { error }.
// Express 5 manda acá cualquier excepción de una ruta async (no hace falta
// try/catch en los controllers salvo para casos especiales).

// Para router.param: los ids de la URL tienen que ser enteros positivos.
// Sin esto, /api/trabajos/abc llegaba a Postgres y respondía un 500.
export function validarIdNumerico(req, res, next, valor) {
  if (!/^[1-9]\d*$/.test(valor)) {
    return res.status(400).json({ error: 'El id no es válido' });
  }
  next();
}

// Ruta inexistente dentro de /api (en vez de la página HTML de Express).
export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

// Errores de Postgres que son culpa del dato que mandó el cliente, no del
// servidor: se responden como 4xx con un texto propio (nunca el de Postgres).
const ERRORES_PG = {
  '22P02': [400, 'Algún dato tiene un formato inválido'],     // ej. texto donde va un número
  '22001': [400, 'Algún dato supera el largo permitido'],     // varchar(n) excedido
  '22003': [400, 'Algún número está fuera del rango permitido'], // numeric(10,2) excedido
  '22007': [400, 'Alguna fecha tiene un formato inválido'],
  '22008': [400, 'Alguna fecha está fuera de rango'],
  '23503': [400, 'Algún dato hace referencia a algo que no existe'], // foreign key
  '23505': [409, 'El registro ya existe'],                    // unique
  '23514': [400, 'Algún dato no tiene un valor permitido'],   // check
};

// Los 4 parámetros son obligatorios: así Express lo reconoce como manejador de errores.
export function manejarErrores(err, req, res, next) {
  // JSON mal formado en el body (lo detecta express.json()).
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la request no es un JSON válido' });
  }

  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }

  const pg = ERRORES_PG[err.code];
  if (pg) {
    return res.status(pg[0]).json({ error: pg[1] });
  }

  // Error del servidor: el detalle queda en el log, al cliente no se le muestra.
  console.error(`Error en ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
