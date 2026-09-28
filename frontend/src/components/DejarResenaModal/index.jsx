import { useState } from 'react';
import { Star } from 'lucide-react';
import Modal from '../Modal';
import ResultModal from '../ResultModal';
import { crearResena } from '../../services/api';
import styles from './DejarResenaModal.module.css';

// Flujo completo de "Dejar reseña" (elegir estrellas -> comentario opcional
// -> éxito), mismo patrón que CancelarPostulacionModal (Modal + ResultModal).
export default function DejarResenaModal({ open, jobId, onClose, onSubmitted, onDone }) {
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const resetState = () => {
    setStep('form');
    setCalificacion(0);
    setComentario('');
    setError(null);
  };

  const handleClose = () => {
    onClose?.();
    resetState();
  };

  const handleEnviar = async () => {
    if (calificacion < 1) {
      setError('Elegí una calificación de 1 a 5 estrellas.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await crearResena({ id_trabajo: jobId, calificacion, comentario: comentario.trim() || null });
      onSubmitted?.();
      setStep('success');
    } catch (err) {
      setError(err.message || 'No se pudo enviar la reseña.');
    } finally {
      setEnviando(false);
    }
  };

  if (step === 'success') {
    // Al confirmar, va directo al home (no tiene sentido volver al detalle
    // de un trabajo del que ya no queda nada por hacer) en vez de solo
    // cerrar el modal.
    return (
      <ResultModal
        open={open}
        tone="success"
        title="¡Reseña enviada!"
        subtitle="Gracias por calificar tu experiencia"
        primaryLabel="Listo"
        onPrimary={onDone ?? handleClose}
      />
    );
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className={styles.content}>

        <h2 className={styles.title}>Dejar reseña</h2>
        <p className={styles.subtitle}>¿Cómo calificarías tu experiencia?</p>

        <div className={styles.stars} role="radiogroup" aria-label="Calificación">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={styles.starBtn}
              role="radio"
              aria-checked={calificacion === n}
              aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
              onClick={() => setCalificacion(n)}
            >
              <Star
                size={32}
                strokeWidth={1.5}
                className={n <= calificacion ? styles.starFilled : styles.starEmpty}
                fill={n <= calificacion ? 'currentColor' : 'none'}
              />
            </button>
          ))}
        </div>

        <label className={styles.fieldLabel} htmlFor="comentario-resena">
          Comentario (opcional)
        </label>
        <textarea
          id="comentario-resena"
          className={styles.textarea}
          placeholder="Contá cómo fue tu experiencia..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.confirmBtn}
          onClick={handleEnviar}
          disabled={enviando}
        >
          {enviando ? 'Enviando...' : 'Enviar reseña'}
        </button>

        <button className={styles.volverBtn} onClick={handleClose}>
          Cancelar
        </button>

      </div>
    </Modal>
  );
}
