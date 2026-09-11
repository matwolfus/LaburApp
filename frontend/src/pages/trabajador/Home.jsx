import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CategoryCard from "../../components/CategoryCard/CategoryCard.jsx";
import JobSearchCard from "../../components/JobSearchCard/index.jsx";
import { getCategorias, getMiUsuario, buscarTrabajosPorCategoria, getMisPostulaciones } from "../../services/api";
// Reusa el CSS module de InicioContratador: mismas clases genéricas
// (homeScreen/content/sectionTitle/etc.), el layout de este Home es
// estructuralmente igual, solo cambian los datos.
import styles from "../../styles/InicioContratador.module.css";

export default function HomeTrabajador() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userRes, categoriesRes, jobsRes, postulacionesRes] = await Promise.all([
          getMiUsuario(),
          getCategorias(),
          buscarTrabajosPorCategoria(),
          getMisPostulaciones(),
        ]);
        setUser(userRes);
        setCategories(categoriesRes);
        setJobs(jobsRes);
        setPostulaciones(postulacionesRes);
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
            Hola, {user?.nombreCompleto}!<br />
            ¿Qué trabajo querés hacer hoy?
          </h1>
        </section>

        <button className={styles.btnPublish} onClick={() => navigate("/trabajador/buscar")}>
          Buscar un trabajo
        </button>

        <section aria-labelledby="categories-heading">
          <h2 className={styles.sectionTitle} id="categories-heading">Explorar Categorías</h2>
          {categories.length === 0 ? (
            <p className={styles.emptyText}>No hay categorías disponibles.</p>
          ) : (
            <div className={styles.categoriesGrid} role="list">
              {categories.map((cat) => (
                <div key={cat.id} role="listitem">
                  <CategoryCard
                    category={cat}
                    onClick={(category) => navigate(`/trabajador/buscar?categoria=${category.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="jobs-heading">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} id="jobs-heading">Changas disponibles</h2>
            <button className={styles.linkBtn} onClick={() => navigate("/trabajador/buscar")}>Ver todas</button>
          </div>
          {jobs.length === 0 ? (
            <p className={styles.emptyText}>No hay changas abiertas por el momento.</p>
          ) : (
            <div className={styles.jobsList}>
              {jobs.slice(0, 5).map((job) => (
                <JobSearchCard key={job.id} {...job} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="postulaciones-heading">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} id="postulaciones-heading">Tus postulaciones</h2>
            <button className={styles.linkBtn} onClick={() => navigate("/trabajador/estado")}>Ver todas</button>
          </div>
          {postulaciones.length === 0 ? (
            <p className={styles.emptyText}>Todavía no te postulaste a ningún trabajo.</p>
          ) : (
            <div className={styles.jobsList}>
              {postulaciones.slice(0, 2).map((p) => (
                <p key={p.id} className={styles.emptyText}>
                  {p.titulo_trabajo} — {p.estado}
                </p>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
