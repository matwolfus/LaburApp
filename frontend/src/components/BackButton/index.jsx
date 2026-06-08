import { useNavigate } from 'react-router-dom';
import styles from './BackButton.module.css';

const BackButton = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.header}>
      <button onClick={() => navigate(-1)} className={styles.backBtn}>←</button>
      <span className={styles.title}>Postulantes</span>
    </div>
  );
};

export default BackButton;
