import { HandHeart, GraduationCap, Brush, PawPrint, Tag } from 'lucide-react';
import styles from './CategoryCard.module.css';

// Mapeo nombre de categoría -> ícono de lucide-react.
// La clave se normaliza (trim + minúsculas) porque algunos nombres en la BD
// vienen con espacios/saltos de línea (ej: "Clases\n", "Limpieza\n").
const CATEGORY_ICONS = {
  mascotas: PawPrint,
  cuidado: HandHeart,
  clases: GraduationCap,
  limpieza: Brush,
};

const CategoryCard = ({ category, onClick }) => {
  const cleanName = (category?.name ?? '').trim();
  const Icon = CATEGORY_ICONS[cleanName.toLowerCase()] ?? Tag; // fallback genérico

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
