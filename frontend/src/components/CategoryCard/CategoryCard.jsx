import IconoCategoria from '../IconoCategoria';
import styles from './CategoryCard.module.css';

const CategoryCard = ({ category, onClick }) => {
  const cleanName = (category?.name ?? '').trim();

  return (
    <button className={styles.card} onClick={() => onClick?.(category)} aria-label={cleanName}>
      <span className={styles.iconWrap}>
        <IconoCategoria categoria={cleanName} className={styles.icon} aria-hidden="true" />
      </span>
      <span className={styles.label}>{cleanName}</span>
    </button>
  );
};

export default CategoryCard;
