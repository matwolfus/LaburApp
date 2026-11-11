import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategoryIcon } from "../../utils/categoryIcons";
import styles from "./HomeJobCard.module.css";

const TRUNCATE_AT = 60;

// status viene ya mapeado del backend (ver mapEstadoToStatus en trabajos-service.js).
// abierto = true: el trabajo sigue en curso (estilo "pendiente"); false: ya cerró.
const STATUS_CONFIG = {
  PENDIENTE:  { label: "Pendiente",  abierto: true },
  EN_CURSO:   { label: "En curso",   abierto: true },
  EN_ESPERA:  { label: "En espera",  abierto: true },
  FINALIZADO: { label: "Finalizado", abierto: false },
  CANCELADO:  { label: "Cancelado",  abierto: false },
  VENCIDO:    { label: "Vencido",    abierto: false },
};

const HomeJobCard = ({ job }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { id, title, description, status, category } = job;
  const CategoryIcon = getCategoryIcon(category);

  const desc = description ?? "";
  const isLong = desc.length > TRUNCATE_AT;
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDIENTE;

  const goToDetalle = () => navigate(`/ofertas/${id}/detalle`);

  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={goToDetalle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDetalle();
        }
      }}
    >
      <div className={styles.iconWrap}>
        <CategoryIcon className={styles.icon} aria-hidden="true" />
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
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? "Ver menos" : "Ver más"}
          </button>
        )}
      </div>

      <span className={statusCfg.abierto ? styles.statusPending : styles.statusDone}>
        {statusCfg.label}
      </span>
    </div>
  );
};

export default HomeJobCard;
