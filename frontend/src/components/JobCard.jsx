
//El componente recibe un objeto job con todos los datos de un trabajo.
export default function JobCard({ job }) {

  const { title, scheduled_at, image_url, applicants_count } = job; //extrae de JOB en lugar de hacer const title = job.title ...
  const date = new Date(scheduled_at);
  const formattedDate = date.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }); //cambia el date en texto para la CARD
  const formattedTime = date.toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit',
  });
 
  return (
    <div className="job-card">
      <div className="job-card__top">
        <img className="job-card__image" src={image_url} alt={title} />
        <div className="job-card__info">
          <h3 className="job-card__title">{title}</h3>
          <p className="job-card__date">
            <span className="job-card__date-icon">🕐</span>
            {formattedDate} - {formattedTime} hs
          </p>
        </div>
      </div>
 
      <div className="job-card__bottom">
        <div className="job-card__applicants">
          <div className="avatar-stack">
            {[...Array(Math.min(applicants_count, 3))].map((_, i) => (
              <div key={i} className="avatar-stack__item" style={{ zIndex: 3 - i }} />
            ))}
            {applicants_count > 3 && (
              <div className="avatar-stack__extra">+{applicants_count - 3}</div>
            )}
          </div>
          <span className="job-card__count">{applicants_count} postulantes</span>
        </div>
        <button className="job-card__btn">Ver postulantes</button>
      </div>
    </div>
  );
}
