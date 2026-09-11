import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bell, MessageSquare } from 'lucide-react';
import BackButton from '../../components/BackButton';
import ResultModal from '../../components/ResultModal';
import { getTrabajoById, postularme } from '../../services/api';
import styles from '../../styles/Postularme.module.css';

export default function Postularme() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [modoPrecio, setModoPrecio] = useState('publicado'); // 'publicado' | 'propio'
  const [precioPropio, setPrecioPropio] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTrabajoById(jobId)
      .then(setJob)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (modoPrecio === 'propio' && (!precioPropio || Number(precioPropio) <= 0)) {
      setError('Ingresá un precio válido.');
      return;
    }

    const precioFinal = modoPrecio === 'publicado' ? job?.budget : Number(precioPropio);

    setEnviando(true);
    try {
      await postularme(jobId, precioFinal);
      setEnviado(true);
    } catch (err) {
      setError(err.status === 409 ? 'Ya te postulaste a este trabajo.' : (err.message || 'No se pudo enviar la propuesta.'));
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <p className={styles.msg}>Cargando...</p>;
  if (loadError || !job) return <p className={styles.msg}>{loadError ?? 'No se pudo cargar el trabajo.'}</p>;

  return (
    <div className={styles.wrapper}>
      <BackButton title="Propuesta" />

      <ResultModal
        open={enviado}
        tone="success"
        title="Propuesta enviada"
        subtitle={`Enviaste tu propuesta para "${job.title}"`}
        rows={[
          { icon: <Bell size={14} />, text: 'La otra persona será notificada' },
          { icon: <MessageSquare size={14} />, text: 'Podés seguir el estado desde tus postulaciones' },
        ]}
        primaryLabel="Volver al inicio"
        onPrimary={() => navigate('/trabajador/inicio')}
        secondaryLabel="Ver mis postulaciones"
        onSecondary={() => navigate('/trabajador/estado')}
      />

      <div className={styles.jobSummary}>
        <h2 className={styles.jobTitle}>{job.title}</h2>
        {job.address && <p className={styles.jobDetail}>📍 {job.address}</p>}
        {job.budget != null && (
          <p className={styles.jobDetail}>
            Oferta: <strong>${Number(job.budget).toLocaleString('es-AR')}</strong>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <span className={styles.formLabel}>Propuesta</span>

        <button
          type="button"
          className={`${styles.option} ${modoPrecio === 'publicado' ? styles.optionActive : ''}`}
          onClick={() => setModoPrecio('publicado')}
        >
          Postularme al precio publicado
        </button>

        <button
          type="button"
          className={`${styles.option} ${modoPrecio === 'propio' ? styles.optionActive : ''}`}
          onClick={() => setModoPrecio('propio')}
        >
          Proponer otro precio
        </button>

        {modoPrecio === 'propio' && (
          <input
            type="number"
            min="1"
            step="1"
            className={styles.priceInput}
            placeholder="Tu precio"
            value={precioPropio}
            onChange={(e) => setPrecioPropio(e.target.value)}
          />
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar'}
        </button>

        <button type="button" className={styles.cancelBtn} onClick={() => navigate(-1)}>
          Cancelar
        </button>
      </form>
    </div>
  );
}
