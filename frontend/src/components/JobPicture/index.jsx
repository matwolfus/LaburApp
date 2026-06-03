import styles from './JobPicture.module.css'

const JobPicture = ({ imageUrl }) => (
  <div className={styles.wrapper}>
    <img src={imageUrl} alt="job" className={styles.image} />
  </div>
);

export default JobPicture;
