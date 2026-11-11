import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader';
import CancelarPostulacionModal from '../../components/CancelarPostulacionModal';
import { getMisPostulaciones, reconfirmarPostulacion } from '../../services/api';
import '../../styles/ofertas.css';

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  retirado: 'Retirado',
  por_reconfirmar: 'Confirmá tu interés',
};

// Una postulación aceptada muestra el estado del trabajo: "Aceptado" no dice
// si ya se hizo o si el contratador lo canceló.
const ESTADO_TRABAJO_ACEPTADO_LABEL = {
  finalizado: 'Completado',
  cancelado: 'Trabajo cancelado',
};

function labelEstado(p) {
  if (p.estado === 'aceptado' && ESTADO_TRABAJO_ACEPTADO_LABEL[p.estado_trabajo]) {
    return ESTADO_TRABAJO_ACEPTADO_LABEL[p.estado_trabajo];
  }
  return ESTADO_LABEL[p.estado] ?? p.estado;
}

// Mismas reglas que PostulacionesService.cancelarAsync en el backend: una
// pendiente se cancela mientras el trabajo siga abierto; una aceptada,
// mientras el trabajo esté activo.
function puedeCancelar(p) {
  if (p.estado === 'pendiente') return ['abierto', 'proxima'].includes(p.estado_trabajo);
  if (p.estado === 'aceptado') return p.estado_trabajo === 'activa';
  return false;
}

// Estados en los que el chat con el contratante está abierto.
const CHAT_ABIERTO = ['pendiente', 'aceptado', 'por_reconfirmar'];

function formatPlazo(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function EstadoTrabajos() {
  const navigate = useNavigate();
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelarPostulacion, setCancelarPostulacion] = useState(null);
  const [respondiendo, setRespondiendo] = useState(null);

  // No togglea `loading` en cada llamada: onCancelled la reusa para refrescar
  // la lista en segundo plano tras cancelar, y si volviera a mostrar el
  // "Cargando..." de pantalla completa, desmontaría el modal de cancelación
  // a mitad de su transición al paso de éxito.
  const fetchPostulaciones = useCallback(() => {
    return getMisPostulaciones()
      .then(setPostulaciones)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    fetchPostulaciones().finally(() => setLoading(false));
  }, [fetchPostulaciones]);

  const handleReconfirmar = async (id, sigue) => {
    setRespondiendo(id);
    try {
      await reconfirmarPostulacion(id, sigue);
      await fetchPostulaciones();
    } catch (err) {
      setError(err.message);
    } finally {
      setRespondiendo(null);
    }
  };

  if (loading) return <div className="ofertas-loading">Cargando tus postulaciones...</div>;
  if (error) return <div className="ofertas-error">Error: {error}</div>;

  const porReconfirmar = postulaciones.filter((p) => p.estado === 'por_reconfirmar');
  const pendientes = postulaciones.filter((p) => p.estado === 'pendiente');
  const aceptadas = postulaciones.filter((p) => p.estado === 'aceptado');
  const historial = postulaciones.filter((p) => ['rechazado', 'retirado'].includes(p.estado));

  const renderCard = (p) => (
    <div className="job-card" key={p.id}>
      <div className="job-card__top">
        {p.image_url ? (
          <img className="job-card__image" src={p.image_url} alt={p.titulo_trabajo} />
        ) : (
          <div className="job-card__image job-card__image--placeholder" aria-hidden="true">🧰</div>
        )}
        <div className="job-card__info">
          <h3 className="job-card__title">{p.titulo_trabajo}</h3>
          <p className="job-card__date">
            {p.categoria ? `${p.categoria} · ` : ''}
            {/* precio_propuesto null = se postuló al precio publicado */}
            {(p.precio_propuesto ?? p.presupuesto_trabajo) != null
              ? `$${Number(p.precio_propuesto ?? p.presupuesto_trabajo).toLocaleString('es-AR')}`
              : 'A convenir'}
          </p>
        </div>
      </div>
      <div className="job-card__bottom">
        <span className="job-card__count">{labelEstado(p)}</span>
        <div className="job-card__actions">
          <button className="job-card__btn job-card__btn--outline" onClick={() => navigate(`/trabajador/trabajos/${p.id_trabajo}`)}>
            Ver detalle
          </button>
          {CHAT_ABIERTO.includes(p.estado) && (
            <button className="job-card__btn job-card__btn--outline" onClick={() => navigate(`/chats/${p.id}`)}>
              Chat
            </button>
          )}
          {puedeCancelar(p) && (
            <button className="job-card__btn" onClick={() => setCancelarPostulacion(p)}>
              Cancelar
            </button>
          )}
        </div>
      </div>
      {p.estado === 'por_reconfirmar' && (
        <div className="job-card__reconfirmar">
          <p>
            El trabajo está disponible de nuevo. ¿Seguís interesado?
            {p.reconfirmar_hasta && <> Respondé antes del {formatPlazo(p.reconfirmar_hasta)}.</>}
          </p>
          <div className="job-card__actions">
            <button
              className="job-card__btn"
              disabled={respondiendo === p.id}
              onClick={() => handleReconfirmar(p.id, true)}
            >
              Sigo interesado
            </button>
            <button
              className="job-card__btn job-card__btn--outline"
              disabled={respondiendo === p.id}
              onClick={() => handleReconfirmar(p.id, false)}
            >
              Ya no me interesa
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="ofertas-page">

      <div className="ofertas-page__header">
        <h1 className="ofertas-page__title">Mis postulaciones</h1>
        <p className="ofertas-page__subtitle">Seguí el estado de tus postulaciones</p>
      </div>

      {porReconfirmar.length > 0 && (
        <>
          <SectionHeader title="Confirmá tu interés" />
          <div className="job-list">{porReconfirmar.map(renderCard)}</div>
        </>
      )}

      <SectionHeader title="Pendientes" />
      <div className="job-list">
        {pendientes.length === 0
          ? <p className="ofertas-empty">No tenés postulaciones pendientes.</p>
          : pendientes.map(renderCard)
        }
      </div>

      <SectionHeader title="Aceptadas" />
      <div className="job-list">
        {aceptadas.length === 0
          ? <p className="ofertas-empty">No tenés postulaciones aceptadas.</p>
          : aceptadas.map(renderCard)
        }
      </div>

      <SectionHeader title="Historial" />
      <div className="job-list">
        {historial.length === 0
          ? <p className="ofertas-empty">Sin historial todavía.</p>
          : historial.map(renderCard)
        }
      </div>

      <CancelarPostulacionModal
        open={cancelarPostulacion != null}
        postulacionId={cancelarPostulacion?.id}
        aceptada={cancelarPostulacion?.estado === 'aceptado'}
        onClose={() => setCancelarPostulacion(null)}
        onCancelled={fetchPostulaciones}
      />

    </div>
  );
}
