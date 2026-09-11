import styles from './LoadingOverlay.module.css';

// Pantalla completa de carga, usada al cambiar de rol para dar la sensación
// de "está trayendo la info del otro lado" antes de mostrar la vista nueva.
export default function LoadingOverlay({ message = 'Cargando información...' }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.spinner} />
      <p className={styles.text}>{message}</p>
    </div>
  );
}
