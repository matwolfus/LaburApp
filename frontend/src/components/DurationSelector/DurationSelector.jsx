import styles from "./DurationSelector.module.css";

const DurationSelector = ({ value, onChange }) => {
  return (
    <div className={styles.card}>
      <label className={styles.label}>
        DURACIÓN
      </label>

      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.select}
      >
        <option value={30}>30 minutos</option>
        <option value={45}>45 minutos</option>
        <option value={60}>1 hora</option>
        <option value={120}>2 horas</option>
        <option value={180}>3 horas</option>
        <option value={240}>4 horas</option>
        <option value={300}>5 horas</option>
        <option value={360}>6 horas</option>
        <option value={480}>8 horas</option>
      </select>
    </div>
  );
};

export default DurationSelector;