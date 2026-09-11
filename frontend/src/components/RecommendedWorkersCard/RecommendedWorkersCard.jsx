import { useNavigate } from 'react-router-dom';
import styles from "./RecommendedWorkersCard.module.css";

const RecommendedCard = ({ person }) => {
  const navigate = useNavigate();
  const { id, photo_url, rating, name, description } = person;

  return (
    <div className={styles.card}>
      <div className={styles.avatarWrapper}>
        <span className={styles.rating}>⭐ {rating.toFixed(1)}</span>
        <img src={photo_url} alt={name} className={styles.avatarImg} />
      </div>
      <p className={styles.name}>{name}</p>
      <p className={styles.description}>{description}</p>
      <button
        className={styles.profileBtn}
        onClick={() => navigate(`/perfil/${id}`)}
      >
        Ver perfil
      </button>
    </div>
  );
};

export default RecommendedCard;