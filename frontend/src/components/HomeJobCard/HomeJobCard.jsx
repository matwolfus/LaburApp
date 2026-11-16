import { useState } from "react";
import { useNavigate } from "react-router-dom";
import IconoCategoria from "../IconoCategoria";
import { ESTADO_TRABAJO_POR_STATUS, tonoEstadoTrabajo } from "../../constants/dominio";
import styles from "./HomeJobCard.module.css";

const TRUNCATE_AT = 60;

// status viene ya mapeado del backend (ver mapEstadoToStatus en trabajos-service.js).
// El color sale de la tabla compartida (TONO_ESTADO_TRABAJO en constants/dominio.js).
const STATUS_LABEL = {
  PENDIENTE:  "Pendiente",
  EN_CURSO:   "En curso",
  EN_ESPERA:  "En espera",
  FINALIZADO: "Finalizado",
  CANCELADO:  "Cancelado",
  VENCIDO:    "Vencido",
};

const HomeJobCard = ({ job }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { id, title, description, status, category } = job;

  const desc = description ?? "";
  const isLong = desc.length > TRUNCATE_AT;
  // Un status desconocido se muestra como "Pendiente", igual que antes.
  const statusConocido = Object.hasOwn(STATUS_LABEL, status) ? status : "PENDIENTE";
  const tono = tonoEstadoTrabajo(ESTADO_TRABAJO_POR_STATUS[statusConocido]);

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
        <IconoCategoria categoria={category} className={styles.icon} aria-hidden="true" />
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

      <span className={`${styles.status} job-chip--${tono}`}>
        {STATUS_LABEL[statusConocido]}
      </span>
    </div>
  );
};

export default HomeJobCard;
