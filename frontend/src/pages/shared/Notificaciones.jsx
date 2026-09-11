import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle2, XCircle, Bell } from 'lucide-react';
import SectionHeader from '../../components/SectionHeader';
import { getNotificaciones, marcarNotificacionLeida } from '../../services/api';
import '../../styles/notificaciones.css';

// Config por tipo de notificación: ícono + a dónde lleva el botón de acción.
// El target de cada tipo depende de QUIÉN recibe ese tipo de notificación,
// no del modo activo actual del usuario (que puede haber cambiado desde
// que se generó la notificación):
// - 'nueva_postulacion' la recibe el contratador -> id_referencia es el
//   id_trabajador que se postuló -> "Ver Perfil" de esa persona.
// - 'postulacion_aceptada'/'postulacion_rechazada' las recibe el
//   trabajador -> id_referencia es el id_trabajo -> "Ver changa".
const TIPO_CONFIG = {
  nueva_postulacion: {
    icon: UserPlus,
    actionLabel: 'Ver Perfil',
    getPath: (n) => `/perfil/${n.id_referencia}`,
  },
  postulacion_aceptada: {
    icon: CheckCircle2,
    actionLabel: 'Ver changa',
    getPath: (n) => `/trabajador/trabajos/${n.id_referencia}`,
  },
  postulacion_rechazada: {
    icon: XCircle,
    actionLabel: 'Ver changa',
    getPath: (n) => `/trabajador/trabajos/${n.id_referencia}`,
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

  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        setNotificaciones(await getNotificaciones());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificaciones();
  }, []);

  const handleDescartar = async (id) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    try {
      await marcarNotificacionLeida(id);
    } catch (err) {
      console.error('Error al marcar la notificación como leída:', err);
    }
  };

  if (loading) return <div className="notif-loading">Cargando notificaciones...</div>;
  if (error)   return <div className="notif-error">Error: {error}</div>;

  const hoy = notificaciones.filter((n) => esHoy(n.creado_en));
  const anteriores = notificaciones.filter((n) => !esHoy(n.creado_en));

  const renderItem = (n) => {
    const config = TIPO_CONFIG[n.tipo];
    const Icon = config?.icon ?? Bell;
    return (
      <div className="notif-card" key={n.id}>
        <div className="notif-card__icon">
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="notif-card__body">
          <p className="notif-card__titulo">{n.titulo}</p>
          {n.cuerpo && <p className="notif-card__cuerpo">{n.cuerpo}</p>}
          <div className="notif-card__actions">
            {n.id_referencia && config?.getPath && (
              <button className="notif-card__btn" onClick={() => navigate(config.getPath(n))}>
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
