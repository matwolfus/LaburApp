import styles from './PostulantCard.module.css'

const BADGE_CONFIG = {
  verificado:     { label: '✓ Verificado',         className: styles.badgeVerificado },
  top:            { label: '⭐ Top recomendado',    className: styles.badgeTop },
  trabajoConmigo: { label: '✓ Ya trabajó conmigo', className: styles.badgeTrabajo },
};

// Valores de `estado` restringidos por CHECK constraint en la tabla postulaciones:
// 'pendiente' | 'aceptado' | 'rechazado' | 'retirado'.
const ESTADO_CONFIG = {
  aceptado:  { label: 'Aceptado',  className: styles.badgeAceptada },
  rechazado: { label: 'Rechazado', className: styles.badgeRechazada },
};

const PostulantCard = ({ postulant, onAceptar, puedeAceptar = true }) => {
  const { id, name, location, rating, reviews, price, badges = [], avatar, estado } = postulant;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2);
  const estadoBadge = ESTADO_CONFIG[estado];

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
      {price != null && (
        <p className={styles.price}>
          Propuesta: <span className={styles.priceValue}>${Number(price).toLocaleString('es-AR')}</span>
        </p>
      )}
      <div className={styles.actions}>
        <button className={styles.profileBtn}>Ver perfil</button>
        <button className={styles.chatBtn} disabled title="Disponible próximamente">💬</button>
        {estado === 'pendiente' && puedeAceptar && (
          <button className={styles.acceptBtn} onClick={() => onAceptar?.(id)} title="Aceptar postulante">
            ✓ Aceptar
          </button>
        )}
        {estado === 'pendiente' && !puedeAceptar && (
          <span className={styles.location} title="El trabajo ya no está disponible para aceptar postulantes">
            Trabajo no disponible
          </span>
        )}
        {estadoBadge && <span className={estadoBadge.className}>{estadoBadge.label}</span>}
      </div>
    </div>
  );
};

export default PostulantCard;
