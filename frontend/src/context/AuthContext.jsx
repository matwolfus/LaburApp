import { useCallback, useEffect, useState } from 'react';
import { actualizarRolActivo, getMiUsuario, logout } from '../services/api';
import { AuthContext } from './authContextBase';

// Modo activo (contratador / trabajador): una sola fuente de verdad.
//
// La verdad es usuarios.ultimo_rol en el backend. Este contexto es la única
// copia en el front: se carga una vez al abrir la app (si hay sesión), se
// fija al loguearse y se actualiza con el toggle. No se guarda en
// localStorage ni viaja en el JWT, así no hay copias que se desincronicen.
export function AuthProvider({ children }) {
  const [modo, setModoState] = useState(null);
  const [modoError, setModoError] = useState(null);

  // Al abrir la app (o recargar) con sesión iniciada: trae el modo del backend.
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    getMiUsuario()
      .then((usuario) => setModoState((actual) => actual ?? usuario?.ultimoRol ?? null))
      .catch((err) => console.error('No se pudo cargar el modo activo:', err));
  }, []);

  // Post-login / registro: el backend ya devolvió el rol, no hace falta otro request.
  const hydrateModo = useCallback((rol) => {
    setModoState(rol ?? null);
  }, []);

  // Acción del usuario al tocar el toggle: actualiza optimistamente y
  // persiste en el backend. Si falla, revierte y expone el error.
  const switchModo = useCallback(async (nuevoModo) => {
    const modoAnterior = modo;
    setModoError(null);
    setModoState(nuevoModo);

    try {
      await actualizarRolActivo(nuevoModo);
      return true;
    } catch (err) {
      console.error('Error al cambiar de modo:', err);
      setModoState(modoAnterior);
      setModoError('No se pudo cambiar de modo, intentá de nuevo.');
      return false;
    }
  }, [modo]);

  // Cierra la sesión: borra el token y también el modo en memoria (si no,
  // el siguiente usuario que entra en esa pestaña heredaba el modo anterior).
  const cerrarSesion = useCallback(() => {
    logout();
    setModoState(null);
    setModoError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ modo, hydrateModo, switchModo, modoError, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}
