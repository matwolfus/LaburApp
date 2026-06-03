import BackButton from '../BackButton'
import JobSelected from '../JobSelected'
import PostulantsArray from '../PostulantsArray'
import styles from './SeePostulants.module.css'

const SeePostulants = ({ JobID }) => {
  const mockJob = {
    id: JobID,
    title: "Paseador de perros para fin de semana",
    scheduled_at: "Sábado 12 de abril - 10:00 hs",
    images: [{ id: 1, url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200" }]
  };

  return (
    <div className={styles.wrapper}>
      <BackButton />
      <JobSelected job={mockJob} />
      <PostulantsArray jobId={JobID} />
    </div>
  );
};

export default SeePostulants;
