import { useState, useEffect, useCallback } from 'react';
import PostulantCard from '../PostulantCard'
import ConfirmModal from '../ConfirmModal'
import { recibePostulaciones } from '../../constants/dominio'
import styles from './PostulantsArray.module.css'
import { getPostulantesByTrabajo, aceptarPostulacion } from '../../services/api';

// Mapea la respuesta del backend al formato que espera PostulantCard
const mapPostulante = (p) => ({
  id: p.id,
  idTrabajador: p.id_trabajador,
  name: p.nombre_completo,
  location: [p.localidad, p.provincia].filter(Boolean).join(', '),
  // Calificación como trabajador, calculada en vivo en el backend (null = sin reseñas).
  rating: p.calificacion == null ? null : Number(p.calificacion),
  reviews: Number(p.count_resenas) || 0,
  price: p.precio_propuesto,
  avatar: p.url_avatar,
  estado: p.estado,
  // Sin insignias por ahora: antes se mostraba "Verificado" a todos, sin
  // ninguna verificación real detrás.
  badges: [],
});

const PostulantsArray = ({ jobId, jobBudget, jobEstado }) => {
  // Si el trabajo ya venció, se canceló, se activó o se completó, no se
  // puede aceptar ningún postulante nuevo (el backend igual lo valida, esto
  // solo evita el intento fallido desde la UI).
  const puedeAceptar = recibePostulaciones(jobEstado);
  const [postulantes, setPostulantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Postulante con precio distinto al publicado, esperando confirmación.
  const [porConfirmar, setPorConfirmar] = useState(null);
  const [aceptando, setAceptando] = useState(false);

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

  const aceptar = async (id) => {
    setError(null);
    setAceptando(true);
    try {
      await aceptarPostulacion(id);
      // Refetch: el aceptado pasa a 'aceptado' y el resto de pendientes de
      // esta changa pasan a 'rechazado' automáticamente en el backend.
      await fetchPostulantes();
    } catch (err) {
      setError(err.message);
    } finally {
      setAceptando(false);
      setPorConfirmar(null);
    }
  };

  const handleAceptar = (id) => {
    // Si propuso un precio distinto al publicado, se confirma explícitamente
    // antes de aceptar (el precio propuesto es el que queda acordado en el
    // contrato, no el publicado originalmente).
    const postulante = postulantes.find((p) => p.id === id);
    const precioDistinto =
      postulante?.price != null &&
      jobBudget != null &&
      Number(postulante.price) !== Number(jobBudget);

    if (precioDistinto) {
      setPorConfirmar(postulante);
      return;
    }
    aceptar(id);
  };

  const formatPesos = (n) => `$${Number(n).toLocaleString('es-AR')}`;

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
      </div>
      {loading && <p className={styles.msg}>Cargando...</p>}
      {error && <p className={styles.msg}>{error}</p>}
      {postulantes.map(p => (
        <PostulantCard key={p.id} postulant={p} onAceptar={handleAceptar} puedeAceptar={puedeAceptar} />
      ))}

      <ConfirmModal
        open={porConfirmar != null}
        title="El precio es distinto al publicado"
        message={porConfirmar
          ? `${porConfirmar.name} propuso ${formatPesos(porConfirmar.price)} y vos publicaste ${formatPesos(jobBudget)}. Si lo aceptás, el precio acordado es el que propuso.`
          : ''}
        confirmLabel={porConfirmar ? `Aceptar por ${formatPesos(porConfirmar.price)}` : 'Aceptar'}
        cancelLabel="Volver"
        confirming={aceptando}
        onConfirm={() => aceptar(porConfirmar.id)}
        onCancel={() => setPorConfirmar(null)}
      />
    </div>
  );
};

export default PostulantsArray;
