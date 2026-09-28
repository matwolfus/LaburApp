import { useNavigate } from 'react-router-dom';
import { X, Settings, UserCog, UserPen, LogOut } from 'lucide-react';
import { logout } from '../../services/api';
import styles from './Sidebar.module.css';

// Drawer lateral global. El cambio de rol no se reimplementa acá: ya vive
// completo (con modal de confirmación + loading overlay) en Perfil.jsx, así
// que ese ítem navega ahí en vez de duplicar esa lógica.
export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();

  const goTo = (path) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  return (
    <>
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

          <button className={styles.item} onClick={() => goTo('/perfil')}>
            <UserCog size={19} strokeWidth={2} />
            Cambio de rol
          </button>

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
