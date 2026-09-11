import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader';
import CancelarPostulacionModal from '../../components/CancelarPostulacionModal';
import { getMisPostulaciones } from '../../services/api';
import '../../styles/ofertas.css';

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  retirado: 'Retirado',
};

export default function EstadoTrabajos() {
  const navigate = useNavigate();
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelarId, setCancelarId] = useState(null);

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

  if (loading) return <div className="ofertas-loading">Cargando tus postulaciones...</div>;
  if (error) return <div className="ofertas-error">Error: {error}</div>;

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
            {p.categoria ? `${p.categoria} · ` : ''}${Number(p.precio_propuesto).toLocaleString('es-AR')}
          </p>
        </div>
      </div>
      <div className="job-card__bottom">
        <span className="job-card__count">{ESTADO_LABEL[p.estado] ?? p.estado}</span>
        <div className="job-card__actions">
          <button className="job-card__btn job-card__btn--outline" onClick={() => navigate(`/trabajador/trabajos/${p.id_trabajo}`)}>
            Ver detalle
          </button>
          {p.estado === 'pendiente' && (
            <button className="job-card__btn" onClick={() => setCancelarId(p.id)}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="ofertas-page">

      <div className="ofertas-page__header">
        <h1 className="ofertas-page__title">Mis postulaciones</h1>
        <p className="ofertas-page__subtitle">Seguí el estado de tus postulaciones</p>
      </div>

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
        open={cancelarId != null}
        postulacionId={cancelarId}
        onClose={() => setCancelarId(null)}
        onCancelled={fetchPostulaciones}
      />

    </div>
  );
}
