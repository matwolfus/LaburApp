import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle2, XCircle, Bell, MessageSquare, UserMinus, RotateCcw, MapPin } from 'lucide-react';
import SectionHeader from '../../components/SectionHeader';
import { getNotificaciones, marcarNotificacionLeida, marcarTodasNotificacionesLeidas, reconfirmarPostulacion } from '../../services/api';
import { notificarCambioBadges } from '../../hooks/useBadges';
import '../../styles/notificaciones.css';

// Config por tipo de notificación: ícono + a dónde lleva el botón de acción.
// El target de cada tipo depende de QUIÉN recibe ese tipo de notificación,
// no del modo activo actual del usuario (que puede haber cambiado desde
// que se generó la notificación):
// - 'nueva_postulacion' la recibe el contratador -> id_referencia es el
//   id_trabajador que se postuló -> "Ver Perfil" de esa persona.
// - 'postulacion_aceptada'/'postulacion_rechazada' las recibe el
//   trabajador -> id_referencia es el id_trabajo -> "Ver trabajo".
// - 'postulacion_cancelada' la recibe el contratador -> id_referencia es el
//   id_trabajo -> detalle de su oferta (donde puede reabrirla).
// - 'reconfirmar_postulacion' la recibe el trabajador -> botones "Sigo
//   interesado" / "Ya no me interesa" (id_postulacion viene en la notificación).
// - 'nuevo_mensaje' -> id_referencia es el id_postulacion del chat.
const TIPO_CONFIG = {
  nueva_postulacion: {
    icon: UserPlus,
    actionLabel: 'Ver Perfil',
    getPath: (n) => `/perfil/${n.id_referencia}`,
  },
  postulacion_aceptada: {
    icon: CheckCircle2,
    actionLabel: 'Ver trabajo',
    getPath: (n) => `/trabajador/trabajos/${n.id_referencia}`,
  },
  postulacion_rechazada: {
    icon: XCircle,
    actionLabel: 'Ver trabajo',
    getPath: (n) => `/trabajador/trabajos/${n.id_referencia}`,
  },
  postulacion_cancelada: {
    icon: UserMinus,
    actionLabel: 'Ver detalle',
    getPath: (n) => `/ofertas/${n.id_referencia}/detalle`,
  },
  reconfirmar_postulacion: {
    icon: RotateCcw,
    actionLabel: 'Ver trabajo',
    getPath: (n) => `/trabajador/trabajos/${n.id_referencia}`,
  },
  nuevo_mensaje: {
    icon: MessageSquare,
    actionLabel: 'Ver chat',
    getPath: (n) => `/chats/${n.id_referencia}`,
  },
};

function esHoy(fechaIso) {
  const fecha = new Date(fechaIso);
  const hoy = new Date();
  return fecha.toDateString() === hoy.toDateString();
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [respondiendo, setRespondiendo] = useState(null);
  const [errorReconfirmar, setErrorReconfirmar] = useState(null);

  const fetchNotificaciones = () =>
    getNotificaciones()
      .then(setNotificaciones)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

  // Al entrar se marcan todas como leídas en el backend (así el contador de
  // la campanita se va), pero en pantalla las que eran nuevas siguen
  // resaltadas durante esta visita: el estado local no se toca.
  useEffect(() => {
    getNotificaciones()
      .then((lista) => {
        setNotificaciones(lista);
        if (lista.some((n) => !n.leido)) {
          marcarTodasNotificacionesLeidas()
            .then(notificarCambioBadges)
            .catch((err) => console.error('Error al marcar las notificaciones como leídas:', err));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const marcarLeida = async (n) => {
    if (n.leido) return;
    setNotificaciones((prev) => prev.map((x) => (x.id === n.id ? { ...x, leido: true } : x)));
    try {
      await marcarNotificacionLeida(n.id);
      notificarCambioBadges();
    } catch (err) {
      console.error('Error al marcar la notificación como leída:', err);
    }
  };

  // Tocar la acción la marca como leída y navega.
  const handleAccion = (n, path) => {
    marcarLeida(n);
    navigate(path);
  };

  const handleDescartar = async (id) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    try {
      await marcarNotificacionLeida(id);
      notificarCambioBadges();
    } catch (err) {
      console.error('Error al marcar la notificación como leída:', err);
    }
  };

  const handleReconfirmar = async (n, sigue) => {
    setRespondiendo(n.id);
    setErrorReconfirmar(null);
    try {
      await reconfirmarPostulacion(n.id_postulacion, sigue);
      notificarCambioBadges();
      await fetchNotificaciones();
    } catch (err) {
      setErrorReconfirmar({ id: n.id, message: err.message });
    } finally {
      setRespondiendo(null);
    }
  };

  if (loading) return <div className="notif-loading">Cargando notificaciones...</div>;
  if (error)   return <div className="notif-error">Error: {error}</div>;

  const hoy = notificaciones.filter((n) => esHoy(n.creado_en));
  const anteriores = notificaciones.filter((n) => !esHoy(n.creado_en));

  const renderItem = (n) => {
    const config = TIPO_CONFIG[n.tipo];
    const Icon = config?.icon ?? Bell;
    const pideReconfirmar = n.tipo === 'reconfirmar_postulacion' && n.id_postulacion && n.respondida !== 'true';
    return (
      <div className={`notif-card ${n.leido ? '' : 'notif-card--no-leida'}`} key={n.id}>
        <div className="notif-card__icon">
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="notif-card__body">
          <p className="notif-card__titulo">
            {!n.leido && <span className="notif-card__dot" aria-label="No leída" />}
            {n.titulo}
          </p>
          {n.cuerpo && <p className="notif-card__cuerpo">{n.cuerpo}</p>}
          {n.tipo === 'nueva_postulacion' && n.localidad && (
            <p className="notif-card__cuerpo notif-card__localidad">
              <MapPin size={13} /> {n.localidad}
            </p>
          )}
          {errorReconfirmar?.id === n.id && (
            <p className="notif-card__error">{errorReconfirmar.message}</p>
          )}
          <div className="notif-card__actions">
            {pideReconfirmar && (
              <>
                <button
                  className="notif-card__btn"
                  disabled={respondiendo === n.id}
                  onClick={() => handleReconfirmar(n, true)}
                >
                  Sigo interesado
                </button>
                <button
                  className="notif-card__btn notif-card__btn--outline"
                  disabled={respondiendo === n.id}
                  onClick={() => handleReconfirmar(n, false)}
                >
                  Ya no me interesa
                </button>
              </>
            )}
            {!pideReconfirmar && n.id_referencia && config?.getPath && (
              <button className="notif-card__btn" onClick={() => handleAccion(n, config.getPath(n))}>
                {config.actionLabel}
              </button>
            )}
            <button className="notif-card__btn notif-card__btn--outline" onClick={() => handleDescartar(n.id)}>
              Descartar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="notif-page">

      <div className="notif-page__header">
        <h1 className="notif-page__title">Notificaciones</h1>
      </div>

      {notificaciones.length === 0 ? (
        <p className="notif-empty">No tenés notificaciones.</p>
      ) : (
        <>
          {hoy.length > 0 && (
            <>
              <SectionHeader title="Hoy" />
              <div className="notif-list">{hoy.map(renderItem)}</div>
            </>
          )}

          {anteriores.length > 0 && (
            <>
              <SectionHeader title="Anteriores" />
              <div className="notif-list">{anteriores.map(renderItem)}</div>
            </>
          )}
        </>
      )}

      <p className="notif-footnote">Las notificaciones se borran tras 30 días.</p>

    </div>
  );
}
