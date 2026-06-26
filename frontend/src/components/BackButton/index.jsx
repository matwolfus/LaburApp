import { useNavigate } from 'react-router-dom';
import styles from './BackButton.module.css';

const BackButton = ({ title = 'Postulantes' }) => {
  const navigate = useNavigate();
  return (
    <div className={styles.header}>
      <button onClick={() => navigate(-1)} className={styles.backBtn}>←</button>
      <span className={styles.title}>{title}</span>
    </div>
  );
};

export default BackButton;
