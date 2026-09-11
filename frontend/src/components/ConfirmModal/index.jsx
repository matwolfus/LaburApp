import Modal from '../Modal';
import styles from './ConfirmModal.module.css';

// Confirmación genérica sí/no sobre el wrapper Modal compartido.
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  confirming = false,
}) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        {message && <p className={styles.message}>{message}</p>}

        <button className={styles.confirmBtn} onClick={onConfirm} disabled={confirming}>
          {confirming ? 'Un momento...' : confirmLabel}
        </button>
        <button className={styles.cancelBtn} onClick={onCancel} disabled={confirming}>
          {cancelLabel}
        </button>
      </div>
    </Modal>
  );
}
