import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CategoryCard from "../../components/CategoryCard/CategoryCard.jsx";
import HomeJobCard from "../../components/HomeJobCard/HomeJobCard.jsx";
import RecommendedCard from "../../components/RecommendedWorkersCard/RecommendedWorkersCard.jsx";
import { getCategorias, getTrabajos, getRecomendados, getUsuarioById } from "../../services/api";
import styles from "../../styles/InicioContratador.module.css";

export default function InicioContratador() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [recommended, setRecommended] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userRes, categoriesRes, jobsRes, recommendedRes] = await Promise.all([
          getUsuarioById(userId),
          getCategorias(),
          getTrabajos(Number(userId)),
          getRecomendados(),
        ]);
        setUser(userRes);
        setCategories(categoriesRes);
        setJobs(jobsRes);
        setRecommended(recommendedRes);
      } catch (err) {
        setError(err.message || "Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) return <p className={styles.emptyText}>Cargando...</p>;

  if (error) {
    return (
      <div role="alert">
        <p className={styles.emptyText}>Algo salió mal: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.homeScreen}>
      <main className={styles.content}>
        <section aria-label="Saludo">
          <h1 className={styles.greetingTitle}>
            Hola, {user?.nombre_completo}!<br />
            ¿Qué necesitas hoy?
          </h1>
        </section>

        <button className={styles.btnPublish} onClick={() => navigate("/nuevo-trabajo")}>
          Publicar una necesidad
          <span className={styles.btnPublishIcon} aria-hidden="true">＋</span>
        </button>

        <section aria-labelledby="categories-heading">
          <h2 className={styles.sectionTitle} id="categories-heading">Explorar Categorías</h2>
          {categories.length === 0 ? (
            <p className={styles.emptyText}>No hay categorías disponibles.</p>
          ) : (
            <div className={styles.categoriesGrid} role="list">
              {categories.map((cat) => (
                <div key={cat.id} role="listitem">
                  <CategoryCard category={cat} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="jobs-heading">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} id="jobs-heading">Tus Trabajos</h2>
            <button className={styles.linkBtn} onClick={() => navigate("/ofertas")}>Ver todas</button>
          </div>
          {jobs.length === 0 ? (
            <p className={styles.emptyText}>Todavía no publicaste ningún trabajo.</p>
          ) : (
            <div className={styles.jobsList}>
              {jobs.map((job) => (
                <HomeJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="recommended-heading">
          <h2 className={styles.sectionTitle} id="recommended-heading">Recomendados</h2>
          {recommended.length === 0 ? (
            <p className={styles.emptyText}>No hay recomendados por el momento.</p>
          ) : (
            <div className={styles.recommendedGrid}>
              {recommended.map((person) => (
                <RecommendedCard key={person.id} person={person} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}