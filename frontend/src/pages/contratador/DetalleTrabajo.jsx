import { useParams } from 'react-router-dom';
import JobDetail from '../../components/JobDetail';

export default function DetalleTrabajo() {
  const { jobId } = useParams();
  return <JobDetail jobId={jobId} />;
}
