import { useEffect, useState } from "react";
import { getCategorias } from "../../services/api";
import styles from "./CategorySelector.module.css";

const CategoryChipsSelector = ({ selectedId, onChange }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCategorias();
        setCategories(data);
      } catch (err) {
        setError(err.message || "Error al cargar categorías");
      } finally {
        setLoading(false);
      }
    };
    fetchCategorias();
  }, []);

  if (loading) return <p className={styles.helperText}>Cargando categorías...</p>;
  if (error) return <p className={styles.errorText}>{error}</p>;

  return (
    <div className={styles.chipsWrapper} role="radiogroup" aria-label="Categoría de la tarea">
      {categories.map((cat) => {
        const isSelected = selectedId === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={isSelected ? styles.chipSelected : styles.chip}
            onClick={() => onChange(cat.id)}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryChipsSelector;