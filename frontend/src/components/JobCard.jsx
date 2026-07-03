import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

//El componente recibe un objeto job con todos los datos de un trabajo.
export default function JobCard({ job }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const { id, title, scheduled_at, image_url, applicants_count, applicant_avatars } = job; //extrae de JOB en lugar de hacer const title = job.title ...

  // Mostramos la foto solo si hay URL y no falló al cargar; si no, va un placeholder.
  const showImage = image_url && !imgError;

  // Avatares de los postulantes (vienen del backend, hasta 3). El resto se cuenta en "+N".
  const avatars = Array.isArray(applicant_avatars) ? applicant_avatars : [];
  const count = Number(applicants_count) || 0;
  // scheduled_at puede venir null (changua publicada sin fecha/hora todavía).
  // Viene como string local sin offset ("YYYY-MM-DDTHH:MM:SS"), así que new Date()
  // la interpreta como hora local tal cual está escrita, sin corrimientos.
  const date = scheduled_at ? new Date(scheduled_at) : null;

  // Cuando no se elige horario, NuevoTrabajo manda medianoche (00:00) como default:
  // no hay forma de distinguir eso de un horario elegido a propósito, así que lo tratamos como "sin horario".
  const tieneHorario = date && (date.getHours() !== 0 || date.getMinutes() !== 0);

  const formattedDate = date
    ? date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'Sin fecha';
  const formattedTime = tieneHorario
    ? date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : null;
 
  return (
    <div className="job-card">
      <div className="job-card__top">
        {showImage ? (
          <img
            className="job-card__image"
            src={image_url}
            alt={title}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="job-card__image job-card__image--placeholder" aria-hidden="true">
            <Briefcase size={28} strokeWidth={2} />
          </div>
        )}
        <div className="job-card__info">
          <h3 className="job-card__title">{title}</h3>
          <p className="job-card__date">
            <span className="job-card__date-icon">🕐</span>
            {formattedDate}{formattedTime ? ` - ${formattedTime} hs` : ''}
          </p>
        </div>
      </div>
 
      <div className="job-card__bottom">
        <div className="job-card__applicants">
          <div className="avatar-stack">
            {[...Array(Math.min(count, 3))].map((_, i) => {
              const url = avatars[i];
              return (
                <div
                  key={i}
                  className="avatar-stack__item"
                  style={{
                    zIndex: 3 - i,
                    ...(url
                      ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : {}),
                  }}
                />
              );
            })}
            {count > 3 && (
              <div className="avatar-stack__extra">+{count - 3}</div>
            )}
          </div>
          <span className="job-card__count">{count} postulantes</span>
        </div>
        <button className="job-card__btn" onClick={() => navigate(`/ofertas/${id}/postulantes`)}>Ver postulantes</button>
      </div>
    </div>
  );
}
