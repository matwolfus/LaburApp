// frontend/src/utils/perfil.js
// Datos del perfil según el modo que se está mirando (trabajador o
// contratador). Lo usan "Mi perfil" y "Ver perfil" (antes cada uno tenía su
// copia del mismo useMemo).
export function datosPerfilSegunModo(perfil, modo) {
  if (!perfil || !modo) return null;

  const esTrabajador = modo === 'trabajador';

  return {
    esTrabajador,
    rating: esTrabajador ? perfil.ratingTrabajador : perfil.ratingContratante,
    cantidadTrabajos: esTrabajador ? perfil.trabajosRealizados : perfil.trabajosPublicados,
    cantidadResenas: esTrabajador ? perfil.cantidadResenasTrabajador : perfil.cantidadResenasContratante,
    biografia: esTrabajador ? perfil.biografiaTrabajador : perfil.biografiaContratante,
    categorias: esTrabajador
      ? (perfil.insignias || []).map((c) => c.nombre)
      : perfil.categoriasContrata,
    resenas: esTrabajador ? perfil.resenasTrabajador : perfil.resenasContratante,
  };
}
