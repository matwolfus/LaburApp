import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, Clock, Tag, Star } from 'lucide-react';
import MapPreview from '../MapPreview';
import Avatar from '../Avatar';
import IconoCategoria from '../IconoCategoria';
import { formatFechaCorta, formatFechaTrabajo, formatPesos } from '../../utils/formato';
import styles from './JobDetail.module.css';

const ESTADO_LABELS = {
  abierto: 'Buscando trabajador',
  activa: 'En curso',
  en_espera: 'En espera',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  vencido: 'Vencido',
};

function formatDuracion(minutos) {
  if (!minutos) return null;
  const n = Number(minutos);
  if (n < 60) return `${n} minutos`;
  const horas = n / 60;
  return `${horas % 1 === 0 ? horas : horas.toFixed(1)} ${horas === 1 ? 'hora' : 'horas'}`;
}

// Información de un trabajo, igual para el dueño y para un trabajador.
// mostrarContratador: tarjeta de quién publicó (solo tiene sentido para el trabajador).
export default function InfoTrabajo({ job, mostrarContratador }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const mainImage = job.images?.[0]?.url;
  const showImage = mainImage && !imgError;
  const fecha = formatFechaTrabajo(job.scheduled_at);
  const duracion = formatDuracion(job.duration);
  // Precedencia: precio ya acordado (contrato activo) > precio que el propio
  // trabajador propuso (postulación pendiente) > presupuesto publicado.
  const precioEfectivo = job.contract_price ?? job.my_proposed_price ?? job.budget;
  const precioDistintoAlPublicado = precioEfectivo != null && job.budget != null && Number(precioEfectivo) !== Number(job.budget);
  const presupuesto = precioEfectivo != null ? formatPesos(precioEfectivo) : null;
  const presupuestoPublicadoOriginal = precioDistintoAlPublicado ? formatPesos(job.budget) : null;
  const employerJobsCount = Number(job.employer_jobs_count) || 0;

  return (
    <>
      {/* ── Hero con overlay ── */}
      <div className={styles.hero}>
        {showImage ? (
          <img className={styles.heroImg} src={mainImage} alt={job.title} onError={() => setImgError(true)} />
        ) : (
          <div className={styles.heroPlaceholder} aria-hidden="true">
            <IconoCategoria categoria={job.category} size={40} strokeWidth={2} />
          </div>
        )}
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>{job.title}</h1>
          {mostrarContratador && job.employer_name && (
            <p className={styles.heroSubtitle}>
              {job.employer_name}
              {job.employer_verificado && <span className={styles.heroVerificado}>✓</span>}
              {employerJobsCount > 0 && ` · ${employerJobsCount} trabajos publicados`}
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
          <span className={styles.summaryValue}>{formatFechaCorta(job.scheduled_at) ?? 'A coordinar'}</span>
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
          {ESTADO_LABELS[job.estado] ?? job.estado}
        </span>
        {job.priority === 'urgente' && <span className={styles.urgente}>⚡ Urgente</span>}
      </div>

      {/* Quién publicó: arriba, para poder ver su perfil sin scrollear hasta el final. */}
      {mostrarContratador && job.employer_name && (
        <button
          className={styles.employerCard}
          onClick={() => navigate(`/perfil/${job.id_contratante}`)}
          aria-label={`Ver perfil de ${job.employer_name}`}
        >
          <Avatar
            src={job.employer_avatar}
            nombre={job.employer_name}
            alt={job.employer_name}
            className={styles.employerAvatar}
            fallbackClassName={styles.employerAvatarFallback}
          />
          <div className={styles.employerInfo}>
            <p className={styles.employerName}>{job.employer_name}</p>
            {job.employer_rating != null && (
              <p className={styles.employerRating}>
                <Star size={13} className={styles.starIcon} /> {Number(job.employer_rating).toFixed(1)}
              </p>
            )}
            <p className={styles.employerLink}>Ver perfil ›</p>
          </div>
          {job.employer_verificado && <span className={styles.verificadoBadge}>Verificado ✓</span>}
        </button>
      )}

      {job.description && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Qué hay que hacer</h2>
          <p className={styles.sectionText}>{job.description}</p>
        </div>
      )}

      <div className={styles.infoGrid}>
        {job.category && (
          <div className={styles.infoItem}><Tag size={16} className={styles.infoIcon} /><span>{job.category}</span></div>
        )}
        {job.address && (
          <div className={styles.infoItem}><MapPin size={16} className={styles.infoIcon} /><span>{job.address}</span></div>
        )}
        {fecha && (
          <div className={styles.infoItem}><Calendar size={16} className={styles.infoIcon} /><span>{fecha}</span></div>
        )}
        {duracion && (
          <div className={styles.infoItem}><Clock size={16} className={styles.infoIcon} /><span>{duracion}</span></div>
        )}
        {presupuesto && (
          <div className={styles.infoItem}>
            <DollarSign size={16} className={styles.infoIcon} />
            <span>
              {presupuesto}
              {presupuestoPublicadoOriginal && (
                <span className={styles.precioOriginal} title="Precio publicado originalmente">
                  {presupuestoPublicadoOriginal}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {job.images?.length > 1 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Fotos</h2>
          <div className={styles.gallery}>
            {job.images.map((img) => <img key={img.id} src={img.url} alt="" className={styles.galleryImg} />)}
          </div>
        </div>
      )}

      {job.lat != null && job.lng != null && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Ubicación</h2>
          <MapPreview lat={job.lat} lng={job.lng} />
        </div>
      )}
    </>
  );
}
