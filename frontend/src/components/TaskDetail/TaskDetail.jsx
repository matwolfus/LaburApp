import styles from "./TaskDetailsInput.module.css";

const TaskDetailsInput = ({ value, onChange }) => {
  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor="task-details">
        Detalles de la tarea
      </label>
      <textarea
        id="task-details"
        className={styles.textarea}
        placeholder="Necesito alguien que..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
      />
    </div>
  );
};

export default TaskDetailsInput;