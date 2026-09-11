import { useState, useEffect, useCallback } from 'react';
import PostulantCard from '../PostulantCard'
import styles from './PostulantsArray.module.css'
import { getPostulantesByTrabajo, aceptarPostulacion } from '../../services/api';

// Mapea la respuesta del backend al formato que espera PostulantCard
const mapPostulante = (p) => ({
  id: p.id,
  name: p.nombre_completo,
  location: [p.localidad, p.provincia].filter(Boolean).join(', '),
  rating: parseFloat(p.prom_calif_trabajador) || 0,
  reviews: parseInt(p.count_resenas) || 0,
  price: p.precio_propuesto,
  avatar: p.url_avatar,
  estado: p.estado,
  badges: ['verificado'],
});

const PostulantsArray = ({ jobId }) => {
  const [postulantes, setPostulantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPostulantes = useCallback(() => {
    setLoading(true);
    return getPostulantesByTrabajo(jobId)
      .then(data => setPostulantes(data.map(mapPostulante)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    fetchPostulantes();
  }, [fetchPostulantes]);

  const handleAceptar = async (id) => {
    setError(null);
    try {
      await aceptarPostulacion(id);
      // Refetch: el aceptado pasa a 'aceptado' y el resto de pendientes de
      // esta changa pasan a 'rechazado' automáticamente en el backend.
      await fetchPostulantes();
    } catch (err) {
      setError(err.message);
    }
  };

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
      {error && <p className={styles.msg}>{error}</p>}
      {postulantes.map(p => (
        <PostulantCard key={p.id} postulant={p} onAceptar={handleAceptar} />
      ))}
    </div>
  );
};

export default PostulantsArray;
