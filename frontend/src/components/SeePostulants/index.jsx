import { useState, useEffect } from 'react';
import BackButton from '../BackButton'
import JobSelected from '../JobSelected'
import PostulantsArray from '../PostulantsArray'
import styles from './SeePostulants.module.css'
import { getTrabajoById } from '../../services/api';

const SeePostulants = ({ JobID }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrabajoById(JobID)
      .then(setJob)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [JobID]);

  return (
    <div className={styles.wrapper}>
      <BackButton />
      {!loading && <JobSelected job={job} />}
      <PostulantsArray jobId={JobID} />
    </div>
  );
};

export default SeePostulants;
