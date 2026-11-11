import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JobCard from '../../components/JobCard';
import SectionHeader from '../../components/SectionHeader';
import { getOfertas } from '../../services/api';
import '../../styles/ofertas.css';

const ESTADO_CERRADO_LABEL = {
  finalizado: 'Completado',
  cancelado: 'Cancelado',
  vencido: 'Vencido',
};

export default function Ofertas() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setJobs(await getOfertas());
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
  // El trabajador aceptado canceló: esperan que el contratante los reabra.
  const enEsperaJobs = jobs.filter((job) => job.estado === 'en_espera');
  // Trabajos cerrados. Antes no aparecían en ninguna sección: un trabajo
  // vencido, finalizado o cancelado desaparecía de "Ofertas". Más recientes primero.
  const historialJobs = jobs
    .filter((job) => Object.hasOwn(ESTADO_CERRADO_LABEL, job.estado))
    .sort((a, b) => String(b.scheduled_at ?? '').localeCompare(String(a.scheduled_at ?? '')));

  return (
    <div className="ofertas-page">

      <div className="ofertas-page__header">
        <h1 className="ofertas-page__title">Ofertas</h1>
        <p className="ofertas-page__subtitle">Gestioná tus publicaciones</p>
      </div>

      {enEsperaJobs.length > 0 && (
        <>
          <SectionHeader title="En espera" />
          <p className="ofertas-empty">
            El trabajador aceptado canceló. Entrá al detalle para reabrir el trabajo.
          </p>
          <div className="job-list">
            {enEsperaJobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        </>
      )}

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

      {historialJobs.length > 0 && (
        <>
          <SectionHeader title="Historial" />
          <div className="job-list">
            {historialJobs.map(job => (
              <JobCard key={job.id} job={job} estadoLabel={ESTADO_CERRADO_LABEL[job.estado]} />
            ))}
          </div>
        </>
      )}

    </div>
  );
}