import { useNavigate } from 'react-router-dom';

export function RecommendedCard({ person }) {
  const navigate = useNavigate();
  const { id, photo_url, rating, name, description } = person;

  return (
    <div className="recommended-card">
      <div className="recommended-card__avatar-wrapper">
        <span className="recommended-card__rating">★ {rating.toFixed(1)}</span>
        <img
          src={photo_url}
          alt={`Foto de perfil de ${name}`}
          className="recommended-card__avatar"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>
      <p className="recommended-card__name">{name}</p>
      <p className="recommended-card__description">{description}</p>
      <button
        className="recommended-card__btn"
        onClick={() => navigate(`/trabajadores/${id}`)}
      >
        Ver perfil
      </button>
    </div>
  );
} 