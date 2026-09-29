import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare } from 'lucide-react';
import Modal from '../Modal';
import ResultModal from '../ResultModal';
import { postularme } from '../../services/api';
import styles from './PostularmeModal.module.css';

const formatPrecio = (n) => `$${Number(n).toLocaleString('es-AR')}`;

// Postulación en un paso: confirmar al precio publicado. La contraoferta es
// opcional y solo se muestra si el usuario la pide ("Proponer otro precio").
export default function PostularmeModal({ open, job, onClose, onPosted }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('confirm'); // 'confirm' | 'success'
  const [otroPrecio, setOtroPrecio] = useState(false);
  const [precioPropio, setPrecioPropio] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const reset = () => {
    setStep('confirm');
    setOtroPrecio(false);
    setPrecioPropio('');
    setError(null);
  };

  const handleClose = () => {
    onClose?.();
    reset();
  };

  const handleConfirmar = async () => {
    setError(null);

    if (otroPrecio && (!precioPropio || Number(precioPropio) <= 0)) {
      setError('Ingresá un precio válido.');
      return;
    }

    const precioFinal = otroPrecio ? Number(precioPropio) : job?.budget;

    setEnviando(true);
    try {
      await postularme(job.id, precioFinal);
      onPosted?.();
      setStep('success');
    } catch (err) {
      setError(err.status === 409 ? 'Ya te postulaste a este trabajo.' : (err.message || 'No se pudo enviar la postulación.'));
    } finally {
      setEnviando(false);
    }
  };

  if (step === 'success') {
    return (
      <ResultModal
        open={open}
        tone="success"
        title="Postulación enviada"
        subtitle={`Te postulaste a "${job?.title}"`}
        rows={[
          { icon: <Bell size={14} />, text: 'La otra persona será notificada' },
          { icon: <MessageSquare size={14} />, text: 'Podés seguir el estado desde tus postulaciones' },
        ]}
        primaryLabel="Ver mis postulaciones"
        onPrimary={() => { handleClose(); navigate('/trabajador/estado'); }}
        secondaryLabel="Seguir viendo el trabajo"
        onSecondary={handleClose}
      />
    );
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className={styles.content}>
        <h2 className={styles.title}>¿Postularte a este trabajo?</h2>
        <p className={styles.jobTitle}>{job?.title}</p>

        {!otroPrecio ? (
          <>
            <p className={styles.priceLabel}>Te postulás por</p>
            <p className={styles.price}>{job?.budget != null ? formatPrecio(job.budget) : 'A coordinar'}</p>
            <button type="button" className={styles.linkBtn} onClick={() => setOtroPrecio(true)}>
              Proponer otro precio
            </button>
          </>
        ) : (
          <>
            <label className={styles.priceLabel} htmlFor="precio-propio">
              Tu precio{job?.budget != null && ` (publicado: ${formatPrecio(job.budget)})`}
            </label>
            <input
              id="precio-propio"
              type="number"
              min="1"
              step="1"
              className={styles.priceInput}
              placeholder="Tu precio"
              value={precioPropio}
              onChange={(e) => setPrecioPropio(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => { setOtroPrecio(false); setPrecioPropio(''); setError(null); }}
            >
              Usar el precio publicado
            </button>
          </>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.confirmBtn} onClick={handleConfirmar} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Postularme'}
        </button>
        <button className={styles.cancelBtn} onClick={handleClose} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </Modal>
  );
}
