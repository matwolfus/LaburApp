import styles from './JobPicture.module.css'

const JobPicture = ({ imageUrl }) => {
  if (!imageUrl) return null;

  return (
    <div className={styles.wrapper}>
      <img src={imageUrl} alt="job" className={styles.image} />
    </div>
  );
};

export default JobPicture;
