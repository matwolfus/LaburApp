import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JobCard from '../../components/JobCard';
import SectionHeader from '../../components/SectionHeader';
import { getOfertas } from '../../services/api';
import '../../styles/ofertas.css';

export default function Ofertas() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setJobs(await getOfertas(Number(userId)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) return <div className="ofertas-loading">Cargando ofertas...</div>;
  if (error)   return <div className="ofertas-error">Error: {error}</div>;

  // 'abierto' es el estado default de una changua recién publicada (todavía buscando
  // candidatos), por eso se agrupa junto con 'proxima' en "Próximas Ofertas".
  const upcomingJobs = jobs.filter((job) => ['abierto', 'proxima'].includes(job.estado));
  const activeJobs = jobs.filter((job) => job.estado === 'activa');

  return (
    <div className="ofertas-page">

      <div className="ofertas-page__header">
        <h1 className="ofertas-page__title">Ofertas</h1>
        <p className="ofertas-page__subtitle">Gestioná tus publicaciones</p>
      </div>

      <SectionHeader title="Proximas Ofertas" />
      <div className="job-list">
        {upcomingJobs.length === 0
          ? <p className="ofertas-empty">No tenés ofertas próximas.</p>
          : upcomingJobs.map(job => <JobCard key={job.id} job={job} />)
        }
      </div>

      <div className="cta-card">
        <div className="cta-card__icon">✅</div>
        <h3 className="cta-card__title">¿Necesitás algo más?</h3>
        <p className="cta-card__text">Publicá una nueva tarea para recibir propuestas hoy.</p>
        <button className="cta-card__btn" onClick={() => navigate('/nuevo-trabajo')}>Publicar tarea</button>
      </div>

      <SectionHeader title="Ofertas activas" />
      <div className="job-list">
        {activeJobs.length === 0
          ? <p className="ofertas-empty">No tenés ofertas activas.</p>
          : activeJobs.map(job => <JobCard key={job.id} job={job} />)
        }
      </div>

    </div>
  );
}