import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Calendar, DollarSign, Clock, Tag } from 'lucide-react';
import BackButton from '../BackButton';
import { getTrabajoById } from '../../services/api';
import styles from './JobDetail.module.css';

const ESTADO_LABELS = {
  abierto: 'Buscando trabajador',
  proxima: 'Buscando trabajador',
  activa: 'En curso',
};

function estadoLabel(estado) {
  return ESTADO_LABELS[estado] ?? 'Finalizado';
}

function formatFecha(scheduledAt) {
  if (!scheduledAt) return null;
  const date = new Date(scheduledAt);
  const tieneHorario = date.getHours() !== 0 || date.getMinutes() !== 0;
  const fecha = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hora = tieneHorario ? date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : null;
  return hora ? `${fecha} - ${hora} hs` : fecha;
}

function formatDuracion(minutos) {
  if (!minutos) return null;
  const n = Number(minutos);
  if (n < 60) return `${n} minutos`;
  const horas = n / 60;
  return `${horas % 1 === 0 ? horas : horas.toFixed(1)} ${horas === 1 ? 'hora' : 'horas'}`;
}

function formatPresupuesto(budget) {
  if (budget == null) return null;
  return Number(budget).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

const JobDetail = ({ jobId }) => {
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    getTrabajoById(jobId)
      .then(setJob)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <BackButton title="Detalle del trabajo" />
        <p className={styles.msg}>Cargando...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className={styles.wrapper}>
        <BackButton title="Detalle del trabajo" />
        <p className={styles.msg}>{error ?? 'No se pudo cargar el trabajo.'}</p>
      </div>
    );
  }

  const mainImage = job.images?.[0]?.url;
  const showImage = mainImage && !imgError;
  const ubicacion = [job.localidad, job.provincia].filter(Boolean).join(', ');
  const fecha = formatFecha(job.scheduled_at);
  const duracion = formatDuracion(job.duration);
  const presupuesto = formatPresupuesto(job.budget);

  return (
    <div className={styles.wrapper}>
      <BackButton title="Detalle del trabajo" />

      <div className={styles.content}>
        {showImage ? (
          <img
            className={styles.hero}
            src={mainImage}
            alt={job.title}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.heroPlaceholder} aria-hidden="true">
            <Briefcase size={40} strokeWidth={2} />
          </div>
        )}

        <div className={styles.headerRow}>
          <h1 className={styles.title}>{job.title}</h1>
          <span className={`${styles.badge} ${job.estado === 'activa' ? styles.badgeActiva : styles.badgeAbierto}`}>
            {estadoLabel(job.estado)}
          </span>
        </div>

        {job.priority === 'urgente' && (
          <span className={styles.urgente}>⚡ Urgente</span>
        )}

        <div className={styles.infoGrid}>
          {job.category && (
            <div className={styles.infoItem}>
              <Tag size={16} className={styles.infoIcon} />
              <span>{job.category}</span>
            </div>
          )}
          {ubicacion && (
            <div className={styles.infoItem}>
              <MapPin size={16} className={styles.infoIcon} />
              <span>{ubicacion}</span>
            </div>
          )}
          {fecha && (
            <div className={styles.infoItem}>
              <Calendar size={16} className={styles.infoIcon} />
              <span>{fecha}</span>
            </div>
          )}
          {duracion && (
            <div className={styles.infoItem}>
              <Clock size={16} className={styles.infoIcon} />
              <span>{duracion}</span>
            </div>
          )}
          {presupuesto && (
            <div className={styles.infoItem}>
              <DollarSign size={16} className={styles.infoIcon} />
              <span>{presupuesto}</span>
            </div>
          )}
        </div>

        {job.address && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Dirección</h2>
            <p className={styles.sectionText}>{job.address}</p>
          </div>
        )}

        {job.description && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Descripción</h2>
            <p className={styles.sectionText}>{job.description}</p>
          </div>
        )}

        {job.images?.length > 1 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Fotos</h2>
            <div className={styles.gallery}>
              {job.images.map((img) => (
                <img key={img.id} src={img.url} alt="" className={styles.galleryImg} />
              ))}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.editBtn} onClick={() => navigate(`/ofertas/${jobId}/editar`)}>
            Editar
          </button>
          <button className={styles.postulantesBtn} onClick={() => navigate(`/ofertas/${jobId}/postulantes`)}>
            Ver postulantes
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
