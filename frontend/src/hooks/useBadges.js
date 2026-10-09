import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getNotificacionesNoLeidasCount, getMensajesNoLeidosCount } from '../services/api';

const POLL_INTERVAL_MS = 30000;
const EVENTO_REFRESH = 'laburapp:badges-refresh';

// Para que una pantalla (ej. Notificaciones al marcar como leída) pida
// actualizar los contadores al instante, sin esperar al próximo polling.
export function notificarCambioBadges() {
  window.dispatchEvent(new Event(EVENTO_REFRESH));
}

// Contadores de no leídos para la campanita (notificaciones) y la pestaña
// Chats del BottomNav. Se actualizan cada 30 s, al cambiar de pantalla y
// cuando alguien llama a notificarCambioBadges().
export default function useBadges() {
  const location = useLocation();
  const [notificaciones, setNotificaciones] = useState(0);
  const [mensajes, setMensajes] = useState(0);

  const refrescar = useCallback(() => {
    if (!localStorage.getItem('token')) return;
    getNotificacionesNoLeidasCount()
      .then((r) => setNotificaciones(Number(r?.count) || 0))
      .catch(() => {});
    getMensajesNoLeidosCount()
      .then((r) => setMensajes(Number(r?.count) || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refrescar();
  }, [location.pathname, refrescar]);

  useEffect(() => {
    const interval = setInterval(refrescar, POLL_INTERVAL_MS);
    window.addEventListener(EVENTO_REFRESH, refrescar);
    return () => {
      clearInterval(interval);
      window.removeEventListener(EVENTO_REFRESH, refrescar);
    };
  }, [refrescar]);

  return { notificaciones, mensajes };
}
