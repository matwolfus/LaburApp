import { useState } from "react";
import { Zap } from "lucide-react";
import styles from "./HomeJobCard.module.css";

const TRUNCATE_AT = 60;

const HomeJobCard = ({ job }) => {
  const [expanded, setExpanded] = useState(false);
  const { title, description, status } = job;

  const desc = description ?? "";
  const isLong = desc.length > TRUNCATE_AT;
  const isPending = status === "PENDIENTE";

  return (
    <div className={styles.card}>
      <div className={styles.iconWrap}>
        <Zap className={styles.icon} aria-hidden="true" />
      </div>

      <div className={styles.info}>
        <p className={styles.title}>{title}</p>

        {desc && (
          <p className={styles.description}>
            {expanded || !isLong ? desc : `${desc.slice(0, TRUNCATE_AT)}…`}
          </p>
        )}

        {isLong && (
          <button
            className={styles.expandBtn}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Ver menos" : "Ver más"}
          </button>
        )}
      </div>

      <span className={isPending ? styles.statusPending : styles.statusDone}>
        {isPending ? "Pendiente" : "Finalizado"}
      </span>
    </div>
  );
};

export default HomeJobCard;
