import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import CancelarPostulacionModal from '../CancelarPostulacionModal';
import PostularmeModal from '../PostularmeModal';
import { getMisPostulaciones, reconfirmarPostulacion } from '../../services/api';
import { recibePostulaciones } from '../../constants/dominio';
import styles from './JobDetail.module.css';

// Acciones de un trabajador sobre un trabajo ajeno: postularse, cancelar,
// reconfirmar y chatear. Carga su propia postulación a este trabajo (si
// tiene) para saber qué ofrecerle. onCambio() recarga el trabajo.
export default function AccionesTrabajador({ job, jobId, onCambio }) {
  const navigate = useNavigate();
  const [miPostulacion, setMiPostulacion] = useState(null);
  const [cargada, setCargada] = useState(false);
  const [error, setError] = useState(null);
  const [respondiendo, setRespondiendo] = useState(false);
  const [showPostular, setShowPostular] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);

  // La ruta del trabajador no garantiza que el trabajo sea ajeno: si alguien
  // cambia a modo trabajador y entra a un trabajo propio, no se le ofrece postularse.
  const esPropio = String(job.id_contratante) === String(localStorage.getItem('userId'));
  const aceptaPostulaciones = recibePostulaciones(job.estado);

  const cargarMiPostulacion = useCallback(() => {
    return getMisPostulaciones()
      .then((postulaciones) => {
        setMiPostulacion(postulaciones.find((p) => String(p.id_trabajo) === String(jobId)) ?? null);
      })
      .catch((err) => console.error('Error al traer tus postulaciones:', err))
      .finally(() => setCargada(true));
  }, [jobId]);

  useEffect(() => {
    cargarMiPostulacion();
  }, [cargarMiPostulacion]);

  const reconfirmar = async (sigue) => {
    setRespondiendo(true);
    setError(null);
    try {
      await reconfirmarPostulacion(miPostulacion.id, sigue);
      await cargarMiPostulacion();
    } catch (err) {
      setError(err.message);
    } finally {
      setRespondiendo(false);
    }
  };

  const renderEstado = () => {
    if (!cargada) return <p className={styles.msg}>Cargando...</p>;
    if (esPropio) return <p className={styles.msg}>Este es un trabajo que publicaste vos.</p>;

    if (!miPostulacion) {
      if (job.estado === 'vencido') return <p className={styles.msg}>Este trabajo venció, ya no se puede postular.</p>;
      if (!aceptaPostulaciones) return <p className={styles.msg}>Este trabajo ya no recibe postulaciones.</p>;
      return <button className={styles.postularmeBtn} onClick={() => setShowPostular(true)}>Postularme</button>;
    }

    switch (miPostulacion.estado) {
      case 'pendiente':
        return (
          <div className={styles.postuladoBlock}>
            <span className={styles.postuladoLabel}>Ya te postulaste — Pendiente</span>
            <button className={styles.cancelarBtn} onClick={() => setShowCancelar(true)}>Cancelar postulación</button>
          </div>
        );
      case 'aceptado':
        return (
          <div className={styles.postuladoBlock}>
            <span className={styles.aceptadoBadge}>🎉 ¡Te aceptaron para este trabajo!</span>
            {job.estado === 'activa' && (
              <button className={styles.cancelarBtn} onClick={() => setShowCancelar(true)}>Cancelar mi participación</button>
            )}
          </div>
        );
      case 'por_reconfirmar':
        return (
          <div className={styles.postuladoBlock}>
            <span className={styles.postuladoLabel}>El trabajo está disponible de nuevo. ¿Seguís interesado?</span>
            <button className={styles.postularmeBtn} onClick={() => reconfirmar(true)} disabled={respondiendo}>Sigo interesado</button>
            <button className={styles.cancelarBtn} onClick={() => reconfirmar(false)} disabled={respondiendo}>Ya no me interesa</button>
          </div>
        );
      case 'retirado':
        // Si el trabajo sigue abierto puede volver a postularse (se reactiva la misma postulación).
        return aceptaPostulaciones ? (
          <div className={styles.postuladoBlock}>
            <span className={styles.postuladoLabel}>Cancelaste tu postulación</span>
            <button className={styles.postularmeBtn} onClick={() => setShowPostular(true)}>Postularme de nuevo</button>
          </div>
        ) : <span className={styles.postuladoLabel}>Cancelaste tu postulación</span>;
      default:
        return <span className={styles.postuladoLabel}>Tu postulación no fue seleccionada</span>;
    }
  };

  return (
    <>
      {error && <p className={styles.actionError}>{error}</p>}

      <div className={styles.actions}>{renderEstado()}</div>

      {/* Chat con el contratador desde la propia postulación (si está retirada
          o rechazada, el chat queda en solo lectura). */}
      {miPostulacion && !esPropio && (
        <button className={styles.postulantesBtn} onClick={() => navigate(`/chats/${miPostulacion.id}`)}>
          <MessageSquare size={16} />
          Chat
        </button>
      )}

      <PostularmeModal open={showPostular} job={job} onClose={() => setShowPostular(false)} onPosted={cargarMiPostulacion} />

      <CancelarPostulacionModal
        open={showCancelar}
        postulacionId={miPostulacion?.id}
        aceptada={miPostulacion?.estado === 'aceptado'}
        onClose={() => setShowCancelar(false)}
        onCancelled={() => { cargarMiPostulacion(); onCambio(); }}
      />
    </>
  );
}
