// backend/src/repositories/sql-calificaciones.js
// Única definición de "calificación de un usuario", para que el perfil, el
// buscador, los recomendados, el detalle del trabajo y los postulantes muestren
// el mismo número.
//
// Se calcula en vivo desde la tabla resenas. Las columnas
// usuarios.prom_calif_trabajador / prom_calif_contratante NO se usan: nunca se
// escriben (no hay trigger ni servicio que las mantenga) y tienen valores viejos.
//
// Polaridad de resenas.es_contratante (ver resenas-repository.js):
//   false -> reseña sobre el receptor COMO TRABAJADOR
//   true  -> reseña sobre el receptor COMO CONTRATADOR
//
// `columnaIdUsuario` es SQL de confianza escrito en el código (ej. 'u.id'),
// nunca un valor que venga del cliente.

// Promedio (float) o NULL si todavía no tiene reseñas.
export const promedioComoTrabajador = (columnaIdUsuario) => `(
    SELECT AVG(r.calificacion)::float FROM resenas r
    WHERE r.id_receptor = ${columnaIdUsuario} AND r.es_contratante = false
)`;

export const promedioComoContratador = (columnaIdUsuario) => `(
    SELECT AVG(r.calificacion)::float FROM resenas r
    WHERE r.id_receptor = ${columnaIdUsuario} AND r.es_contratante = true
)`;

// Cantidad de reseñas (int, 0 si no tiene).
export const cantidadComoTrabajador = (columnaIdUsuario) => `(
    SELECT COUNT(*)::int FROM resenas r
    WHERE r.id_receptor = ${columnaIdUsuario} AND r.es_contratante = false
)`;

export const cantidadComoContratador = (columnaIdUsuario) => `(
    SELECT COUNT(*)::int FROM resenas r
    WHERE r.id_receptor = ${columnaIdUsuario} AND r.es_contratante = true
)`;
