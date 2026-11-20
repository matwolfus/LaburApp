import { Settings } from 'lucide-react';
import styles from './Ajustes.module.css';

// Placeholder: todavía no está definido qué va a tener la pantalla de
// Ajustes. Esto evita que el ítem "Ajustes" de la barra lateral apunte a
// una ruta sin manejar (mismo patrón que ChatHistorial.jsx).
export default function Ajustes() {
  return (
    <div className={styles.wrapper}>
      <span className={styles.icono}>
        <Settings size={32} strokeWidth={1.75} />
      </span>
      <h2 className={styles.titulo}>Ajustes</h2>
      <p className={styles.aviso}>Disponible próximamente</p>
    </div>
  );
}
