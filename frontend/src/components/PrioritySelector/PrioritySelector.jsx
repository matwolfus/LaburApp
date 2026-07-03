import styles from "./PrioritySelector.module.css";

const PrioritySelector = ({ value, onChange }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>PRIORIDAD</span>

        <span className={styles.badge}>
          NUEVO
        </span>
      </div>

      <div className={styles.toggle}>
        <button
          type="button"
          className={
            value === "normal"
              ? styles.activeNormal
              : styles.option
          }
          onClick={() => onChange("normal")}
        >
          Normal
        </button>

        <button
          type="button"
          className={
            value === "urgente"
              ? styles.activeUrgente
              : styles.option
          }
          onClick={() => onChange("urgente")}
        >
          Urgente
        </button>
      </div>

      <p className={styles.helperText}>
        ⓘ Las tareas urgentes tienen mayor visibilidad
      </p>
    </div>
  );
};

export default PrioritySelector;