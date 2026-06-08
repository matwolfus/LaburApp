import styles from './JobInfo.module.css'

const JobInfo = ({ title, date }) => {
  const formattedDate = new Date(date).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.date}>
        <span className={styles.icon}>📅</span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
};

export default JobInfo;
