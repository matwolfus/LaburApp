import JobPicture from '../JobPicture'
import JobInfo from '../JobInfo'
import styles from './JobSelected.module.css'

const JobSelected = ({ job }) => (
  <div className={styles.wrapper}>
    <JobPicture imageUrl={job?.images?.[0]?.url} />
    <JobInfo title={job?.title} date={job?.scheduled_at} />
  </div>
);

export default JobSelected;
