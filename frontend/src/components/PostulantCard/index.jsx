import styles from './PostulantCard.module.css'

const PostulantCard = () => (
  <div className={styles.card}>
    <div className={styles.top}>
      <div className={styles.avatar}>SS</div>
      <div className={styles.info}>
        <p className={styles.name}>Santi Sainer</p>
        <p className={styles.location}>📍 La Plata, Buenos Aires</p>
        <p className={styles.rating}>
          ⭐ <strong>$3000</strong>
          <span className={styles.reviews}> · 238 reseñas</span>
        </p>
      </div>
    </div>
    <div className={styles.badges}>
      <span className={styles.badge}>✓ Verificado</span>
    </div>
    <div className={styles.actions}>
      <button className={styles.profileBtn}>Ver perfil</button>
      <button className={styles.chatBtn}>💬</button>
    </div>
  </div>
);

export default PostulantCard;
