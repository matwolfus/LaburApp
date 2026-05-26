import { useState, useEffect } from 'react';
import JobCard from '../../components/JobCard';
import SectionHeader from '../../components/SectionHeader';
import '../../styles/ofertas.css';

const EMPLOYER_ID = 2; // TODO: replace with logged-in user id from context

export default function Ofertas() {
  const [upcomingJobs, setUpcomingJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const [resUpcoming, resActive] = await Promise.all([
          fetch(`/api/trabajos/proximas?employer_id=${EMPLOYER_ID}`),
          fetch(`/api/trabajos/activas?employer_id=${EMPLOYER_ID}`),
        ]);

        if (!resUpcoming.ok || !resActive.ok) {
          throw new Error('Failed to load jobs');
        }

        const [dataUpcoming, dataActive] = await Promise.all([
          resUpcoming.json(),
          resActive.json(),
        ]);
        //los pasa a .JSON para poder pasarlos a ARRAYS 
        
        
        
        setUpcomingJobs(dataUpcoming);
        setActiveJobs(dataActive);
        //los guarda en e estado 
      
    
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

  return (
    <div className="ofertas-page">

      <div className="ofertas-page__header">
        <h1 className="ofertas-page__title">Ofertas</h1>
        <p className="ofertas-page__subtitle">Gestioná tus publicaciones</p>
      </div>

      <SectionHeader title="Proximas Ofertas" onFilter={() => {}} />
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
        <button className="cta-card__btn">Publicar tarea</button>
      </div>

      <SectionHeader title="Ofertas activas" onFilter={() => {}} />
      <div className="job-list">
        {activeJobs.length === 0
          ? <p className="ofertas-empty">No tenés ofertas activas.</p>
          : activeJobs.map(job => <JobCard key={job.id} job={job} />)
        }
      </div>

    </div>
  );
}