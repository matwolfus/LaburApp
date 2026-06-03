import PostulantCard from '../PostulantCard'
import styles from './PostulantsArray.module.css'

const PostulantsArray = ({ jobId }) => (
  <div className={styles.wrapper}>
    <div className={styles.header}>
      <span className={styles.label}>Postulados</span>
      <span className={styles.count}>1</span>
    </div>
    <PostulantCard />
  </div>
);

export default PostulantsArray;
