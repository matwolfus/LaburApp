import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Calendar, DollarSign, Clock, Tag, Users, Star, CheckCircle2 } from 'lucide-react';
import BackButton from '../BackButton';
import MapPreview from '../MapPreview';
import CancelarPostulacionModal from '../CancelarPostulacionModal';
import { getTrabajoById, getMisPostulaciones, completarTrabajo } from '../../services/api';
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

// Versión corta para la tarjeta flotante (ej. "vie. 13 mar.").
function formatFechaCorta(scheduledAt) {
  if (!scheduledAt) return 'A coordinar';
  const date = new Date(scheduledAt);
  return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
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

const JobDetail = ({ jobId, isOwner = true }) => {
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  // Solo para el trabajador: saber si ya se postuló a este trabajo (y con
  // qué estado), para no ofrecerle "Postularme" de nuevo sin sentido.
  const [miPostulacion, setMiPostulacion] = useState(null);
  const [postulacionesLoaded, setPostulacionesLoaded] = useState(isOwner);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [completando, setCompletando] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [employerAvatarError, setEmployerAvatarError] = useState(false);

  const cargarJob = useCallback(() => {
    return getTrabajoById(jobId)
      .then(setJob)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    cargarJob();
  }, [cargarJob]);

  useEffect(() => {
    if (isOwner) return;

    getMisPostulaciones()
      .then((postulaciones) => {
        const propia = postulaciones.find((p) => String(p.id_trabajo) === String(jobId));
        setMiPostulacion(propia ?? null);
      })
      .catch((err) => console.error('Error al traer tus postulaciones:', err))
      .finally(() => setPostulacionesLoaded(true));
  }, [jobId, isOwner]);

  const handleCompletar = async () => {
    if (!window.confirm('¿Marcar este trabajo como completado?')) return;
    setCompletando(true);
    setActionError(null);
    try {
      await completarTrabajo(jobId);
      await cargarJob();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCompletando(false);
    }
  };

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
  const fecha = formatFecha(job.scheduled_at);
  const duracion = formatDuracion(job.duration);
  const presupuesto = formatPresupuesto(job.budget);
  const applicantsCount = Number(job.applicants_count) || 0;
  const employerJobsCount = Number(job.employer_jobs_count) || 0;

  return (
    <div className={styles.wrapper}>
      <BackButton title="Detalle del trabajo" />

      <div className={styles.content}>

        {/* ── Hero con overlay ── */}
        <div className={styles.hero}>
          {showImage ? (
            <img
              className={styles.heroImg}
              src={mainImage}
              alt={job.title}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={styles.heroPlaceholder} aria-hidden="true">
              <Briefcase size={40} strokeWidth={2} />
            </div>
          )}
          <div className={styles.heroOverlay}>
            <h1 className={styles.heroTitle}>{job.title}</h1>
            {!isOwner && job.employer_name && (
              <p className={styles.heroSubtitle}>
                {job.employer_name}
                {job.employer_verificado && <span className={styles.heroVerificado}>✓</span>}
                {employerJobsCount > 0 && ` · ${employerJobsCount} changas publicadas`}
              </p>
            )}
          </div>
        </div>

        {/* ── Tarjeta flotante de resumen ── */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{presupuesto ?? 'A coordinar'}</span>
            <span className={styles.summaryLabel}>Pago est.</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{formatFechaCorta(job.scheduled_at)}</span>
            <span className={styles.summaryLabel}>Cuándo</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{job.localidad ?? 'Sin zona'}</span>
            <span className={styles.summaryLabel}>Zona</span>
          </div>
        </div>

        <div className={styles.headerRow}>
          <span className={`${styles.badge} ${job.estado === 'activa' ? styles.badgeActiva : styles.badgeAbierto}`}>
            {estadoLabel(job.estado)}
          </span>
          {job.priority === 'urgente' && (
            <span className={styles.urgente}>⚡ Urgente</span>
          )}
        </div>

        {job.description && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Qué hay que hacer</h2>
            <p className={styles.sectionText}>{job.description}</p>
          </div>
        )}

        <div className={styles.infoGrid}>
          {job.category && (
            <div className={styles.infoItem}>
              <Tag size={16} className={styles.infoIcon} />
              <span>{job.category}</span>
            </div>
          )}
          {job.address && (
            <div className={styles.infoItem}>
              <MapPin size={16} className={styles.infoIcon} />
              <span>{job.address}</span>
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

        {job.lat != null && job.lng != null && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Ubicación</h2>
            <MapPreview lat={job.lat} lng={job.lng} />
          </div>
        )}

        {!isOwner ? (
          job.employer_name && (
            <button
              className={styles.employerCard}
              onClick={() => navigate(`/perfil/${job.id_contratante}`)}
            >
              {job.employer_avatar && !employerAvatarError ? (
                <img
                  className={styles.employerAvatar}
                  src={job.employer_avatar}
                  alt={job.employer_name}
                  onError={() => setEmployerAvatarError(true)}
                />
              ) : (
                <div className={styles.employerAvatarFallback}>{job.employer_name.charAt(0).toUpperCase()}</div>
              )}
              <div className={styles.employerInfo}>
                <p className={styles.employerName}>{job.employer_name}</p>
                {job.employer_rating != null && (
                  <p className={styles.employerRating}>
                    <Star size={13} className={styles.starIcon} /> {Number(job.employer_rating).toFixed(1)}
                  </p>
                )}
              </div>
              {job.employer_verificado && (
                <span className={styles.verificadoBadge}>Verificado ✓</span>
              )}
            </button>
          )
        ) : (
          <button className={styles.applicantsRow} onClick={() => navigate(`/ofertas/${jobId}/postulantes`)}>
            <Users size={16} className={styles.infoIcon} />
            <span>{applicantsCount} {applicantsCount === 1 ? 'postulante' : 'postulantes'}</span>
          </button>
        )}

        {actionError && <p className={styles.actionError}>{actionError}</p>}

        <div className={styles.actions}>
          {isOwner ? (
            <>
              <button className={styles.editBtn} onClick={() => navigate(`/ofertas/${jobId}/editar`)}>
                Editar
              </button>
              <button className={styles.postulantesBtn} onClick={() => navigate(`/ofertas/${jobId}/postulantes`)}>
                Ver postulantes
              </button>
              {job.estado === 'activa' && (
                <button className={styles.completarBtn} onClick={handleCompletar} disabled={completando}>
                  <CheckCircle2 size={16} />
                  {completando ? 'Marcando...' : 'Marcar como completado'}
                </button>
              )}
            </>
          ) : !postulacionesLoaded ? (
            <p className={styles.msg}>Cargando...</p>
          ) : !miPostulacion ? (
            <button className={styles.postulantesBtn} onClick={() => navigate(`/trabajador/postularme/${jobId}`)}>
              Postularme
            </button>
          ) : miPostulacion.estado === 'pendiente' ? (
            <div className={styles.postuladoBlock}>
              <span className={styles.postuladoLabel}>Ya te postulaste — Pendiente</span>
              <button className={styles.cancelarBtn} onClick={() => setShowCancelModal(true)}>
                Cancelar postulación
              </button>
            </div>
          ) : miPostulacion.estado === 'aceptado' ? (
            <span className={styles.aceptadoBadge}>🎉 ¡Te aceptaron para este trabajo!</span>
          ) : (
            <span className={styles.postuladoLabel}>
              {miPostulacion.estado === 'rechazado' ? 'Tu postulación no fue seleccionada' : 'Cancelaste tu postulación'}
            </span>
          )}
        </div>
      </div>

      <CancelarPostulacionModal
        open={showCancelModal}
        postulacionId={miPostulacion?.id}
        onClose={() => setShowCancelModal(false)}
        onCancelled={() => setMiPostulacion(null)}
      />
    </div>
  );
};

export default JobDetail;
