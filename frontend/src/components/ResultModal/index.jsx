import { CheckCircle2, XCircle } from 'lucide-react';
import Modal from '../Modal';
import styles from './ResultModal.module.css';

// Modal de resultado genérico (éxito/error) con ícono animado, usado tanto
// para "Propuesta enviada" (Postularme) como "Postulación cancelada"
// (CancelarPostulacionModal) — son la misma plantilla en el Figma, solo
// cambia texto/ícono/color.
export default function ResultModal({
  open,
  tone = 'success',
  title,
  subtitle,
  rows = [],
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  const Icon = tone === 'success' ? CheckCircle2 : XCircle;

  return (
    <Modal open={open} onClose={onPrimary} closeOnBackdrop={false}>
      <div className={styles.content}>

        <div className={`${styles.iconWrap} ${tone === 'success' ? styles.success : styles.error}`}>
          <Icon size={40} strokeWidth={2} className={styles.icon} />
        </div>

        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

        {rows.length > 0 && (
          <div className={styles.rows}>
            {rows.map((row, i) => (
              <div key={i} className={styles.row}>
                <span className={styles.rowIcon}>{row.icon}</span>
                <span>{row.text}</span>
              </div>
            ))}
          </div>
        )}

        <button className={styles.primaryBtn} onClick={onPrimary}>{primaryLabel}</button>
        {secondaryLabel && (
          <button className={styles.secondaryBtn} onClick={onSecondary}>{secondaryLabel}</button>
        )}

      </div>
    </Modal>
  );
}
