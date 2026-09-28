import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { getConversaciones } from '../../services/api';
import styles from './ChatHistorial.module.css';

function formatHora(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export default function ChatHistorial() {
  const navigate = useNavigate();
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getConversaciones()
      .then(setConversaciones)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className={styles.msg}>Cargando conversaciones...</p>;
  }

  if (error) {
    return <p className={styles.msg}>{error}</p>;
  }

  if (conversaciones.length === 0) {
    return (
      <div className={styles.empty}>
        <MessageSquare size={40} strokeWidth={1.5} />
        <h2 className={styles.emptyTitle}>Chat</h2>
        <p className={styles.emptyText}>
          Todavía no tenés conversaciones. Se abren automáticamente cuando aceptás (o te aceptan) en un trabajo.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Chat</h1>
      <div className={styles.lista}>
        {conversaciones.map((c) => (
          <button
            key={c.id_contrato}
            className={styles.item}
            onClick={() => navigate(`/chats/${c.id_contrato}`)}
          >
            {c.otro_avatar ? (
              <img src={c.otro_avatar} alt={c.otro_nombre} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>{c.otro_nombre?.charAt(0)?.toUpperCase() || 'U'}</div>
            )}

            <div className={styles.info}>
              <div className={styles.row}>
                <span className={styles.nombre}>{c.otro_nombre}</span>
                {c.ultimo_mensaje_en && <span className={styles.hora}>{formatHora(c.ultimo_mensaje_en)}</span>}
              </div>
              <p className={styles.trabajo}>{c.titulo_trabajo}</p>
              <p className={styles.preview}>{c.ultimo_mensaje || 'Todavía no hay mensajes'}</p>
            </div>

            {c.no_leidos > 0 && <span className={styles.badge}>{c.no_leidos}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
