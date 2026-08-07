const WorkerSearchCard = ({
  id,
  name,
  photo_url,
  description,
  rating = 0,
}) => {
  return (
    <article className="worker-search-card">

      {/* PARTE SUPERIOR */}
      <div className="worker-search-card-top">

        <div className="worker-search-avatar-wrapper">
          {photo_url ? (
            <img
              src={photo_url}
              alt={`Foto de ${name}`}
              className="worker-search-avatar"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="worker-search-avatar-fallback">
              {name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        <div className="worker-search-info">

          <div className="worker-search-name-row">
            <h2 className="worker-search-name">
              {name}
            </h2>

            <span
              className="worker-search-verified"
              aria-label="Perfil verificado"
            >
              ✓
            </span>
          </div>

          <div className="worker-search-rating-row">
            <span className="worker-search-star">
              ★
            </span>

            <span className="worker-search-rating">
              {Number(rating).toFixed(1)}
            </span>
          </div>

        </div>
      </div>

      {/* DESCRIPCIÓN */}
      {description && (
        <div className="worker-search-description-box">
          <span className="worker-search-quote">
            “
          </span>

          <p className="worker-search-description">
            {description}
          </p>

          <span className="worker-search-quote">
            ”
          </span>
        </div>
      )}

      {/* CONTACTAR */}
      <div className="worker-search-card-footer">

        <span className="worker-search-available-text">
          Disponible próximamente
        </span>

        <button
          type="button"
          className="worker-search-contact-button"
          disabled
          title="Disponible próximamente"
        >
          Contactar
        </button>

      </div>

    </article>
  );
};

export default WorkerSearchCard;