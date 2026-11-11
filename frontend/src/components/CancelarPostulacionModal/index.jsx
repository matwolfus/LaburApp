import { useState } from 'react';
import { AlertTriangle, Bell, MessageSquare } from 'lucide-react';
import Modal from '../Modal';
import ResultModal from '../ResultModal';
import { cancelarPostulacion } from '../../services/api';
import styles from './CancelarPostulacionModal.module.css';

// Flujo completo de "Cancelar postulación" (confirmar -> éxito), reusado
// desde JobDetail y EstadoTrabajos en vez de window.confirm().
//
// Antes tenía un campo "Motivo de cancelación" que no se guardaba en ningún
// lado y avisos sobre una "reputación" que la app no tiene: se sacaron para
// no prometer cosas que no existen.
//
// aceptada: si la postulación ya estaba aceptada, el trabajo queda en
// espera hasta que el contratante lo reabra (el texto lo avisa).
export default function CancelarPostulacionModal({ open, postulacionId, aceptada = false, onClose, onCancelled }) {
  const [step, setStep] = useState('confirm'); // 'confirm' | 'success'
  const [entendido, setEntendido] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState(null);

  const resetState = () => {
    setStep('confirm');
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
          <p>El contratante va a recibir un aviso y no vas a poder deshacer la cancelación.</p>
        </div>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={entendido}
            onChange={(e) => setEntendido(e.target.checked)}
          />
          <span>Entiendo que la cancelación no se puede deshacer</span>
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
