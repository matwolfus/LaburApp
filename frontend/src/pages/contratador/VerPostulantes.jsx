import { useParams } from 'react-router-dom';
import SeePostulants from '../../components/SeePostulants';

export default function VerPostulantes() {
  const { jobId } = useParams();
  return <SeePostulants JobID={jobId} />;
}
