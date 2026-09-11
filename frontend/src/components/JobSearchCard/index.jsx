import { useNavigate } from 'react-router-dom';
import styles from './JobSearchCard.module.css';

// Tarjeta de un trabajo abierto en las pantallas de trabajador (Home /
// Buscar Trabajos). Inspirada visualmente en WorkerSearchCard, pero con
// campos de dominio distintos (un trabajo, no una persona), por eso es un
// componente separado en vez de una variante con props opcionales.
const JobSearchCard = ({ id, title, description, budget, address, category, localidad, provincia, image_url }) => {
  const navigate = useNavigate();
  const ubicacion = [localidad, provincia].filter(Boolean).join(', ') || address;

  return (
    <article className={styles.card}>

      <div className={styles.top}>
        {image_url ? (
          <img src={image_url} alt="" className={styles.image} />
        ) : (
          <div className={styles.imageFallback}>🧰</div>
        )}

        <div className={styles.info}>
          <h2 className={styles.title}>{title}</h2>
          {category && <span className={styles.category}>{category}</span>}
          {ubicacion && <p className={styles.location}>📍 {ubicacion}</p>}
        </div>
      </div>

      {description && (
        <p className={styles.description}>{description}</p>
      )}

      <div className={styles.footer}>
        {budget != null && (
          <span className={styles.price}>${Number(budget).toLocaleString('es-AR')}</span>
        )}
        <button
          type="button"
          className={styles.applyBtn}
          onClick={() => navigate(`/trabajador/postularme/${id}`)}
        >
          Postularme
        </button>
      </div>

    </article>
  );
};

export default JobSearchCard;
