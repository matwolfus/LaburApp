import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Modal from '../Modal';
import DateTimePicker from '../DateTimeSelector/DateTimeSelector';
import { reabrirTrabajo } from '../../services/api';
import styles from './ReabrirTrabajoModal.module.css';

// Hoy en formato YYYY-MM-DD (hora local), para el min del input de fecha.
function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// El trabajador aceptado canceló y el trabajo quedó en espera: el
// contratante lo reabre eligiendo una fecha nueva. Los postulantes que el
// sistema había rechazado reciben un aviso para confirmar si siguen
// interesados (tienen 2 días).
export default function ReabrirTrabajoModal({ open, jobId, onClose, onReopened }) {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    setFecha('');
    setHora('');
    setError(null);
    onClose?.();
  };

  const handleReabrir = async () => {
    if (!fecha) {
      setError('Elegí una nueva fecha para el trabajo.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      // Mismo formato que NuevoTrabajo: hora Argentina sin offset.
      await reabrirTrabajo(jobId, `${fecha}T${hora || '00:00'}:00`);
      handleClose();
      onReopened?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className={styles.content}>
        <RotateCcw size={36} className={styles.icon} />
        <h2 className={styles.title}>Reabrir trabajo</h2>
        <p className={styles.text}>
          Elegí una nueva fecha. Los postulantes anteriores van a recibir un aviso
          para confirmar si siguen interesados (tienen 2 días para responder).
        </p>

        <div className={styles.picker}>
          <DateTimePicker
            fecha={fecha}
            hora={hora}
            onFechaChange={setFecha}
            onHoraChange={setHora}
            minFecha={hoyLocal()}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.confirmBtn} onClick={handleReabrir} disabled={enviando}>
          {enviando ? 'Reabriendo...' : 'Reabrir trabajo'}
        </button>
        <button className={styles.volverBtn} onClick={handleClose}>
          Volver
        </button>
      </div>
    </Modal>
  );
}
