import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle2, MessageSquare } from 'lucide-react';
import ReabrirTrabajoModal from '../ReabrirTrabajoModal';
import ConfirmModal from '../ConfirmModal';
import { completarTrabajo, cancelarTrabajo } from '../../services/api';
import styles from './JobDetail.module.css';

// Acciones del contratador sobre su propio trabajo: ver postulantes, editar,
// completar, cancelar y reabrir. onCambio() recarga el trabajo después de
// cada acción.
export default function AccionesDueno({ job, jobId, onCambio }) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [showReabrir, setShowReabrir] = useState(false);
  // Acción esperando confirmación: null | 'completar' | 'cancelar'.
  const [confirmacion, setConfirmacion] = useState(null);
  const [ejecutando, setEjecutando] = useState(false);

  const applicantsCount = Number(job.applicants_count) || 0;
  const cerrado = job.estado === 'finalizado' || job.estado === 'cancelado';

  // Corre la acción confirmada (completar o cancelar) y recarga el trabajo.
  const ejecutar = async (accion) => {
    setEjecutando(true);
    setError(null);
    try {
      await accion(jobId);
      await onCambio();
    } catch (err) {
      setError(err.message);
    } finally {
      setEjecutando(false);
      setConfirmacion(null);
    }
  };

  return (
    <>
      <button className={styles.applicantsRow} onClick={() => navigate(`/ofertas/${jobId}/postulantes`)}>
        <Users size={16} className={styles.infoIcon} />
        <span>{applicantsCount} {applicantsCount === 1 ? 'postulante' : 'postulantes'}</span>
      </button>

      {error && <p className={styles.actionError}>{error}</p>}

      {job.estado === 'en_espera' && (
        <div className={styles.enEsperaBox}>
          <p>
            La persona que habías aceptado canceló su participación. El trabajo
            quedó en espera: podés reabrirlo con una nueva fecha para elegir a otra persona.
          </p>
          <button className={styles.postularmeBtn} onClick={() => setShowReabrir(true)}>
            Reabrir trabajo
          </button>
        </div>
      )}

      <div className={styles.actions}>
        {!cerrado && (
          <button className={styles.editBtn} onClick={() => navigate(`/ofertas/${jobId}/editar`)}>
            Editar
          </button>
        )}
        <button className={styles.postulantesBtn} onClick={() => navigate(`/ofertas/${jobId}/postulantes`)}>
          Ver postulantes
        </button>
        {job.estado === 'activa' && (
          <button className={styles.completarBtn} onClick={() => setConfirmacion('completar')} disabled={ejecutando}>
            <CheckCircle2 size={16} />
            {ejecutando && confirmacion === 'completar' ? 'Marcando...' : 'Marcar como completado'}
          </button>
        )}
        {!cerrado && (
          <button className={styles.cancelarBtn} onClick={() => setConfirmacion('cancelar')} disabled={ejecutando}>
            {ejecutando && confirmacion === 'cancelar' ? 'Cancelando...' : 'Cancelar trabajo'}
          </button>
        )}
      </div>

      {/* Chat con el trabajador aceptado. */}
      {job.id_postulacion_aceptada && (
        <button className={styles.postulantesBtn} onClick={() => navigate(`/chats/${job.id_postulacion_aceptada}`)}>
          <MessageSquare size={16} />
          Chat
        </button>
      )}

      <ReabrirTrabajoModal open={showReabrir} jobId={jobId} onClose={() => setShowReabrir(false)} onReopened={onCambio} />

      <ConfirmModal
        open={confirmacion === 'completar'}
        title="¿Marcar el trabajo como completado?"
        message="Se cierra el contrato y los dos van a poder dejarse una reseña."
        confirmLabel="Sí, está completado"
        cancelLabel="Volver"
        confirming={ejecutando}
        onConfirm={() => ejecutar(completarTrabajo)}
        onCancel={() => setConfirmacion(null)}
      />

      <ConfirmModal
        open={confirmacion === 'cancelar'}
        title="¿Cancelar este trabajo?"
        message="Se cierran los postulantes pendientes y el contrato activo, si hay. Esto no se puede deshacer."
        confirmLabel="Sí, cancelar trabajo"
        cancelLabel="Volver"
        confirming={ejecutando}
        onConfirm={() => ejecutar(cancelarTrabajo)}
        onCancel={() => setConfirmacion(null)}
      />
    </>
  );
}
