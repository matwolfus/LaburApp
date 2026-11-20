import { useState, useEffect, useCallback } from 'react';
import SectionHeader from '../../components/SectionHeader';
import CancelarPostulacionModal from '../../components/CancelarPostulacionModal';
import { getMisPostulaciones, reconfirmarPostulacion } from '../../services/api';
import PostulacionCard from '../../components/PostulacionCard';
import '../../styles/ofertas.css';

export default function EstadoTrabajos() {
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

  const handleReconfirmar = async (p, sigue) => {
    setRespondiendo(p.id);
    try {
      await reconfirmarPostulacion(p.id, sigue);
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
    <PostulacionCard
      key={p.id}
      postulacion={p}
      conChat
      onCancelar={setCancelarPostulacion}
      onReconfirmar={handleReconfirmar}
      respondiendo={respondiendo === p.id}
    />
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
