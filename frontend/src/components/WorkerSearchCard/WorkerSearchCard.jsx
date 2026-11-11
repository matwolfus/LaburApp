import { useNavigate } from 'react-router-dom';
import Avatar from '../Avatar';
import styles from './WorkerSearchCard.module.css';

const WorkerSearchCard = ({
  id,
  name,
  photo_url,
  description,
  rating = null, // null = todavía no tiene reseñas
  localidad = null,
  provincia = null,
  idPostulacionChat = null,
}) => {
  const navigate = useNavigate();

  return (
    <article className={styles.card}>

      {/* PARTE SUPERIOR */}
      <div className={styles.top}>

        <div className={styles.avatarWrapper}>
          <Avatar src={photo_url} nombre={name} className={styles.avatar} fallbackClassName={styles.avatarFallback} />
        </div>

        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h2 className={styles.name}>{name}</h2>
          </div>

          <div className={styles.ratingRow}>
            {rating != null ? (
              <>
                <span className={styles.star}>★</span>
                <span className={styles.ratingValue}>{Number(rating).toFixed(1)}</span>
              </>
            ) : (
              <span className={styles.ratingValue}>Sin reseñas</span>
            )}
          </div>

          {(localidad || provincia) && (
            <p className={styles.location}>📍 {[localidad, provincia].filter(Boolean).join(', ')}</p>
          )}
        </div>

      </div>

      {/* DESCRIPCIÓN */}
      {description && (
        <div className={styles.descriptionBox}>
          <span className={styles.quote}>"</span>
          <p className={styles.description}>{description}</p>
          <span className={styles.quote}>"</span>
        </div>
      )}

      <div className={styles.details}>
        <button
          type="button"
          className={styles.contactBtn}
          onClick={() => navigate(`/perfil/${id}`)}
        >
          Ver perfil
        </button>
        {/* CONTACTAR: el chat vive atado a una postulación, sin una no hay chat */}
        {idPostulacionChat && (
          <button
            type="button"
            className={styles.contactBtn}
            onClick={() => navigate(`/chats/${idPostulacionChat}`)}
          >
            Contactar
          </button>
        )}
      </div>

    </article>
  );
};

export default WorkerSearchCard;