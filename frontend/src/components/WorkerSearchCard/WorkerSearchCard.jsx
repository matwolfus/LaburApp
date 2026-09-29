import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './WorkerSearchCard.module.css';

const WorkerSearchCard = ({
  id,
  name,
  photo_url,
  description,
  rating = 0,
  idContrato = null,
}) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);

  return (
    <article className={styles.card}>

      {/* PARTE SUPERIOR */}
      <div className={styles.top}>

        <div className={styles.avatarWrapper}>
          {photo_url ? (
            <img
              src={photo_url}
              alt={`Foto de ${name}`}
              className={styles.avatar}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h2 className={styles.name}>{name}</h2>
            <span className={styles.verified} aria-label="Perfil verificado">✓</span>
          </div>

          <div className={styles.ratingRow}>
            <span className={styles.star}>★</span>
            <span className={styles.ratingValue}>{Number(rating).toFixed(1)}</span>
          </div>
        </div>

        {/* CORAZÓN */}
        <button
          type="button"
          className={`${styles.favorite} ${liked ? styles.favoriteActive : ''}`}
          onClick={() => setLiked(!liked)}
          aria-label={liked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={liked}
        >
          {liked ? '♥' : '♡'}
        </button>

      </div>

      {/* DESCRIPCIÓN */}
      {description && (
        <div className={styles.descriptionBox}>
          <span className={styles.quote}>"</span>
          <p className={styles.description}>{description}</p>
          <span className={styles.quote}>"</span>
        </div>
      )}

      {/* CONTACTAR: el chat vive atado a un contrato, sin contrato no hay chat */}
      {idContrato && (
        <div className={styles.details}>
          <button
            type="button"
            className={styles.contactBtn}
            onClick={() => navigate(`/chats/${idContrato}`)}
          >
            Contactar
          </button>
        </div>
      )}

    </article>
  );
};

export default WorkerSearchCard;