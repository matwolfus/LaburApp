import { useState, useEffect } from 'react';
import PostulantCard from '../PostulantCard'
import styles from './PostulantsArray.module.css'
import { getPostulantesByTrabajo } from '../../services/api';

// Mapea la respuesta del backend al formato que espera PostulantCard
const mapPostulante = (p) => ({
  id: p.id,
  name: p.nombre_completo,
  location: [p.localidad, p.provincia].filter(Boolean).join(', '),
  rating: parseFloat(p.prom_calif_trabajador) || 0,
  reviews: parseInt(p.count_resenas) || 0,
  price: p.precio_propuesto,
  avatar: p.url_avatar,
  badges: ['verificado'],
});

const PostulantsArray = ({ jobId }) => {
  const [postulantes, setPostulantes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPostulantesByTrabajo(jobId)
      .then(data => setPostulantes(data.map(mapPostulante)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [jobId]);

  if (!loading && postulantes.length === 0) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.msg}>No hay postulantes aún.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.left}>
          <span className={styles.label}>Postulados</span>
          <span className={styles.count}>{postulantes.length}</span>
        </div>
        <button className={styles.filterBtn}>⇅ Filtrar</button>
      </div>
      {loading && <p className={styles.msg}>Cargando...</p>}
      {postulantes.map(p => (
        <PostulantCard key={p.id} postulant={p} />
      ))}
    </div>
  );
};

export default PostulantsArray;
