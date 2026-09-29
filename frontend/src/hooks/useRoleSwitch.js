import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const MIN_SWITCH_DELAY_MS = 1400;

export const homeDeModo = (modo) => (modo === 'trabajador' ? '/trabajador/inicio' : '/inicio');

// Cambia el rol activo: muestra la pantalla de carga (`switching`) al menos
// MIN_SWITCH_DELAY_MS, aunque el PATCH sea instantáneo, para que se sienta como
// "está trayendo la info del otro rol", y navega al home de ese rol. Si el
// backend rechaza el cambio, no navega (switchModo ya revierte el modo).
export function useRoleSwitch() {
  const navigate = useNavigate();
  const { modo, switchModo } = useAuth();
  const [switching, setSwitching] = useState(false);

  const otroModo = modo === 'trabajador' ? 'contratador' : 'trabajador';

  const changeModo = async (nuevoModo) => {
    if (!nuevoModo || nuevoModo === modo) return;
    setSwitching(true);

    const start = Date.now();
    const ok = await switchModo(nuevoModo);
    const restante = MIN_SWITCH_DELAY_MS - (Date.now() - start);
    if (restante > 0) {
      await new Promise((resolve) => setTimeout(resolve, restante));
    }

    setSwitching(false);
    if (ok) navigate(homeDeModo(nuevoModo));
  };

  return { modo, otroModo, switching, changeModo };
}
