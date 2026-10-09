import { useState } from 'react';
import { AlertTriangle, Bell, MessageSquare } from 'lucide-react';
import Modal from '../Modal';
import ResultModal from '../ResultModal';
import { cancelarPostulacion } from '../../services/api';
import styles from './CancelarPostulacionModal.module.css';

// Flujo completo de "Cancelar postulación" (confirmar -> éxito), reusado
// desde JobDetail y EstadoTrabajos en vez de window.confirm().
//
// El campo "Motivo de cancelación" es solo visual por ahora: la tabla
// postulaciones no tiene ninguna columna para guardarlo. Si más adelante se
// quiere persistir, hay que agregar esa columna y mandar `motivo` en el
// body de cancelarPostulacion (que hoy solo recibe el id).
//
// aceptada: si la postulación ya estaba aceptada, el trabajo queda en
// espera hasta que el contratante lo reabra (el texto lo avisa).
export default function CancelarPostulacionModal({ open, postulacionId, aceptada = false, onClose, onCancelled }) {
  const [step, setStep] = useState('confirm'); // 'confirm' | 'success'
  const [motivo, setMotivo] = useState('');
  const [entendido, setEntendido] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState(null);

  const resetState = () => {
    setStep('confirm');
    setMotivo('');
    setEntendido(false);
    setError(null);
  };

  const handleClose = () => {
    onClose?.();
    resetState();
  };

  const handleConfirmar = async () => {
    setCancelando(true);
    setError(null);
    try {
      await cancelarPostulacion(postulacionId);
      onCancelled?.();
      setStep('success');
    } catch (err) {
      setError(err.message || 'No se pudo cancelar la postulación.');
    } finally {
      setCancelando(false);
    }
  };

  if (step === 'success') {
    return (
      <ResultModal
        open={open}
        tone="error"
        title="Postulación cancelada"
        subtitle="Cancelaste tu postulación correctamente"
        rows={[
          { icon: <Bell size={14} />, text: 'La otra persona será notificada' },
          { icon: <MessageSquare size={14} />, text: 'El chat queda disponible solo para lectura' },
        ]}
        primaryLabel="Entendido"
        onPrimary={handleClose}
      />
    );
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className={styles.content}>

        <AlertTriangle size={40} className={styles.warningIcon} />
        <h2 className={styles.title}>{aceptada ? '¿Cancelar tu participación?' : '¿Cancelar postulación?'}</h2>

        <div className={styles.alertBox}>
          {aceptada && (
            <p>Ya te habían aceptado: el trabajo queda en espera hasta que el contratante lo reabra.</p>
          )}
          <p>Atención, si estás a menos de 24 horas de la tarea puede afectar a tu reputación en la plataforma</p>
        </div>

        <label className={styles.fieldLabel} htmlFor="motivo-cancelacion">
          Motivo de cancelación (opcional)
        </label>
        <textarea
          id="motivo-cancelacion"
          className={styles.textarea}
          placeholder="Explicá brevemente por qué no podés realizar el trabajo..."
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
        />

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={entendido}
            onChange={(e) => setEntendido(e.target.checked)}
          />
          <span>Entiendo que esto puede afectar mi reputación en la app</span>
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.confirmBtn}
          onClick={handleConfirmar}
          disabled={!entendido || cancelando}
        >
          {cancelando ? 'Cancelando...' : 'Confirmar cancelación'}
        </button>

        <button className={styles.volverBtn} onClick={handleClose}>
          Volver
        </button>

      </div>
    </Modal>
  );
}
