// backend/src/helpers/http-error.js
// Error con el status HTTP que corresponde (400, 403, 404, 409...). Los
// services lo tiran para errores de negocio; el error-middleware lo responde
// con ese status y su mensaje. Cualquier otro Error se toma como 500.
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
