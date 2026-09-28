import { getCategoryIcon } from '../../utils/categoryIcons';
import styles from './CategoryCard.module.css';

const CategoryCard = ({ category, onClick }) => {
  const cleanName = (category?.name ?? '').trim();
  const Icon = getCategoryIcon(cleanName);

  return (
    <button className={styles.card} onClick={() => onClick?.(category)} aria-label={cleanName}>
      <span className={styles.iconWrap}>
        <Icon className={styles.icon} aria-hidden="true" />
      </span>
      <span className={styles.label}>{cleanName}</span>
    </button>
  );
};

export default CategoryCard;
