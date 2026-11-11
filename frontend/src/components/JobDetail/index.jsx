import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../BackButton';
import { getTrabajoById } from '../../services/api';
import InfoTrabajo from './InfoTrabajo';
import AccionesDueno from './AccionesDueno';
import AccionesTrabajador from './AccionesTrabajador';
import ResenaTrabajo from './ResenaTrabajo';
import styles from './JobDetail.module.css';

// Detalle de un trabajo. Carga el trabajo y arma la pantalla con la
// información común (InfoTrabajo) más las acciones de cada lado:
//   isOwner = true  -> AccionesDueno (ruta del contratador)
//   isOwner = false -> AccionesTrabajador (ruta del trabajador)
const JobDetail = ({ jobId, isOwner = true }) => {
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarJob = useCallback(() => {
    return getTrabajoById(jobId)
      .then(setJob)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    cargarJob();
  }, [cargarJob]);

  if (loading || error || !job) {
    return (
      <div className={styles.wrapper}>
        <BackButton title="Detalle del trabajo" />
        <p className={styles.msg}>{loading ? 'Cargando...' : error ?? 'No se pudo cargar el trabajo.'}</p>
      </div>
    );
  }

  const Acciones = isOwner ? AccionesDueno : AccionesTrabajador;

  return (
    <div className={styles.wrapper}>
      <BackButton title="Detalle del trabajo" />

      <div className={styles.content}>
        <InfoTrabajo job={job} mostrarContratador={!isOwner} />

        <Acciones job={job} jobId={jobId} onCambio={cargarJob} />

        {job.estado === 'finalizado' && (
          <ResenaTrabajo jobId={jobId} onDone={() => navigate(isOwner ? '/inicio' : '/trabajador/inicio')} />
        )}
      </div>
    </div>
  );
};

export default JobDetail;
