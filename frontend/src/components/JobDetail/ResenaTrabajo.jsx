import { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import DejarResenaModal from '../DejarResenaModal';
import { getElegibilidadResena } from '../../services/api';
import styles from './JobDetail.module.css';

// "Dejar reseña" en un trabajo finalizado, para cualquiera de los dos lados.
// onDone: a dónde ir después de reseñar.
export default function ResenaTrabajo({ jobId, onDone }) {
  const [elegibilidad, setElegibilidad] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const cargar = useCallback(() => {
    return getElegibilidadResena(jobId)
      .then(setElegibilidad)
      .catch((err) => console.error('Error al consultar elegibilidad de reseña:', err));
  }, [jobId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <>
      {elegibilidad?.puedeResenar && (
        <button className={styles.completarBtn} onClick={() => setShowModal(true)}>
          <Star size={16} />
          Dejar reseña
        </button>
      )}

      {elegibilidad?.yaReseño && <p className={styles.msg}>Ya dejaste tu reseña para este trabajo.</p>}

      <DejarResenaModal
        open={showModal}
        jobId={jobId}
        onClose={() => setShowModal(false)}
        onSubmitted={cargar}
        onDone={onDone}
      />
    </>
  );
}
