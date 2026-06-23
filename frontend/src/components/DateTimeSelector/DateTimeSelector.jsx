import styles from "./DateTimeSelector.module.css";

const DateTimePicker = ({
  fecha,
  hora,
  onFechaChange,
  onHoraChange,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <label className={styles.label}>
          FECHA
        </label>

        <input
          type="date"
          value={fecha}
          onChange={(e) => onFechaChange(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.card}>
        <label className={styles.label}>
          HORARIO
        </label>

        <input
          type="time"
          value={hora}
          onChange={(e) => onHoraChange(e.target.value)}
          className={styles.input}
        />
      </div>
    </div>
  );
};

export default DateTimePicker;