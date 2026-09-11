import { useCallback, useState } from 'react';
import { actualizarRolActivo } from '../services/api';
import { AuthContext } from './authContextBase';

const MODO_STORAGE_KEY = 'modoActivo';

export function AuthProvider({ children }) {
  // Empieza en null a propósito: no confiamos en un localStorage viejo como
  // verdad hasta que Perfil.jsx lo hidrate contra lo que diga el backend.
  const [modo, setModoState] = useState(null);
  const [modoError, setModoError] = useState(null);

  // Solo local: refleja un rol que la base YA tiene (post-login, o al
  // hidratar Perfil). Nunca pega al backend.
  const hydrateModo = useCallback((rol) => {
    localStorage.setItem(MODO_STORAGE_KEY, rol);
    setModoState(rol);
  }, []);

  // Acción del usuario al tocar el toggle: actualiza optimistamente y
  // persiste en el backend. Si falla, revierte y expone el error en vez de
  // dejar el frontend desincronizado en silencio con la base.
  const switchModo = useCallback(async (nuevoModo) => {
    const modoAnterior = modo;
    setModoError(null);
    localStorage.setItem(MODO_STORAGE_KEY, nuevoModo);
    setModoState(nuevoModo);

    try {
      await actualizarRolActivo(nuevoModo);
    } catch (err) {
      console.error('Error al cambiar de modo:', err);
      if (modoAnterior) {
        localStorage.setItem(MODO_STORAGE_KEY, modoAnterior);
      }
      setModoState(modoAnterior);
      setModoError('No se pudo cambiar de modo, intentá de nuevo.');
    }
  }, [modo]);

  return (
    <AuthContext.Provider value={{ modo, hydrateModo, switchModo, modoError }}>
      {children}
    </AuthContext.Provider>
  );
}
