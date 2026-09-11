import { useEffect } from 'react';
import styles from './Modal.module.css';

// Wrapper genérico de modal: backdrop + tarjeta centrada, con animación de
// entrada. Sin portal (la app no usa portales en ningún otro lado) — basta
// con position:fixed + z-index alto.
export default function Modal({ open, onClose, children, closeOnBackdrop = true }) {

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
