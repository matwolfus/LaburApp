import styles from './CategoryCard.module.css';

const CategoryCard = ({ category, onClick }) => {
  const { name, icon } = category;

  return (
    <button className={styles.card} onClick={() => onClick?.(category)}>
      <img src={icon} alt={name} className={styles.icon} />
      <span className={styles.label}>{name}</span>
    </button>
  );
};

export default CategoryCard;