import styles from './PostulantCard.module.css'

const BADGE_CONFIG = {
  verificado:     { label: '✓ Verificado',         className: styles.badgeVerificado },
  top:            { label: '⭐ Top recomendado',    className: styles.badgeTop },
  trabajoConmigo: { label: '✓ Ya trabajó conmigo', className: styles.badgeTrabajo },
};

const PostulantCard = ({ postulant }) => {
  const { name, location, rating, reviews, price, badges = [], avatar } = postulant;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2);

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        {avatar
          ? <img src={avatar} alt={name} className={styles.avatarImg} />
          : <div className={styles.avatar}>{initials}</div>
        }
        <div className={styles.info}>
          <p className={styles.name}>{name}</p>
          <p className={styles.location}>📍 {location}</p>
          <div className={styles.rating}>
            <span className={styles.ratingValue}>⭐ {rating.toFixed(1)}</span>
            <span className={styles.ratingCount}>({reviews} reseñas)</span>
          </div>
        </div>
      </div>
      {badges.length > 0 && (
        <div className={styles.badges}>
          {badges.map(b => {
            const cfg = BADGE_CONFIG[b];
            return cfg ? <span key={b} className={cfg.className}>{cfg.label}</span> : null;
          })}
        </div>
      )}
      <div className={styles.actions}>
        <button className={styles.profileBtn}>Ver perfil</button>
        <button className={styles.chatBtn}>💬</button>
      </div>
    </div>
  );
};

export default PostulantCard;
