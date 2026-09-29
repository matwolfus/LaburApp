import { useNavigate } from 'react-router-dom';
import { X, Settings, UserCog, UserPen, LogOut } from 'lucide-react';
import { logout } from '../../services/api';
import { useRoleSwitch } from '../../hooks/useRoleSwitch';
import LoadingOverlay from '../LoadingOverlay';
import styles from './Sidebar.module.css';

// Drawer lateral global. El cambio de rol usa el mismo flujo que Perfil
// (useRoleSwitch): pantalla de carga y aterrizaje en el home del otro rol.
export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { modo, otroModo, switching, changeModo } = useRoleSwitch();

  const goTo = (path) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  const handleSwitch = () => {
    onClose();
    changeModo(otroModo);
  };

  return (
    <>
      {switching && <LoadingOverlay message="Cargando información..." />}

      <div
        className={open ? `${styles.backdrop} ${styles.backdropOpen}` : styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={open ? `${styles.panel} ${styles.panelOpen}` : styles.panel} aria-hidden={!open}>
        <div className={styles.header}>
          <span className={styles.title}>Menú</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar menú">
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        <nav className={styles.nav}>
          <button className={styles.item} onClick={() => goTo('/perfil/editar')}>
            <UserPen size={19} strokeWidth={2} />
            Editar perfil
          </button>

          {modo && (
            <button className={styles.item} onClick={handleSwitch}>
              <UserCog size={19} strokeWidth={2} />
              Cambiar a modo {otroModo === 'trabajador' ? 'Trabajador' : 'Contratador'}
            </button>
          )}

          <button className={styles.item} onClick={() => goTo('/ajustes')}>
            <Settings size={19} strokeWidth={2} />
            Ajustes
          </button>

          <button className={`${styles.item} ${styles.itemDanger}`} onClick={handleLogout}>
            <LogOut size={19} strokeWidth={2} />
            Cerrar sesión
          </button>
        </nav>
      </aside>
    </>
  );
}
