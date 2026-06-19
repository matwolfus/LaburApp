import { useState } from "react";
import styles from "./HomeJobCard.module.css";

const HomeJobCard = ({ job }) => {
  const [expanded, setExpanded] = useState(false);
  const { image_url, title, description, status } = job;
  const safeDescription = description ?? "";

  return (
    <div className={styles.card}>
      <div className={styles.main}>
        <img src={image_url} alt={title} className={styles.icon} />
        <div className={styles.info}>
          <p className={styles.title}>{title}</p>
          <p className={styles.description}>
            {expanded ? safeDescription : `${safeDescription.slice(0, 40)}...`}
          </p>
          <button
            className={styles.expandBtn}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Ver menos' : 'Ver más'}
          </button>
        </div>
        <span className={status === 'PENDIENTE' ? styles.statusPending : styles.statusDone}>
          {status === 'PENDIENTE' ? 'Pendiente' : 'Finalizado'}
        </span>
      </div>
    </div>
  );
};

export default HomeJobCard;