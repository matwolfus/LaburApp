import styles from './JobInfo.module.css'

const JobInfo = ({ title, date }) => (
  <div className={styles.wrapper}>
    <h2 className={styles.title}>{title}</h2>
    <div className={styles.date}>
      <span className={styles.icon}>📅</span>
      <span>{date}</span>
    </div>
  </div>
);

export default JobInfo;
