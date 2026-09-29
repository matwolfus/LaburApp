import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { getMensajes, getConversaciones, enviarMensaje } from '../../services/api';
import styles from './ChatIndividual.module.css';

const POLL_INTERVAL_MS = 3500;

function formatHora(fecha) {
  return new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

// El mensaje enviado puede llegar dos veces (respuesta del POST y polling en
// vuelo): se agrega solo si su id todavía no está en la lista.
const mergeUnicos = (prev, nuevos) => {
  const ids = new Set(prev.map((m) => m.id));
  const extra = nuevos.filter((m) => !ids.has(m.id));
  return extra.length ? [...prev, ...extra] : prev;
};

export default function ChatIndividual() {
  const { idContrato } = useParams();
  const navigate = useNavigate();
  const myUserId = Number(localStorage.getItem('userId'));

  const [mensajes, setMensajes] = useState([]);
  const [otro, setOtro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Ref (no state) para que el intervalo de polling siempre lea el último id
  // conocido sin quedar atado a un closure viejo.
  const ultimoIdRef = useRef(null);
  const listRef = useRef(null);

  // Carga inicial: historial completo (sin `desde`) + datos de la otra
  // persona (salen de /conversaciones, no del endpoint de mensajes).
  useEffect(() => {
    let cancelado = false;

    Promise.all([getMensajes(idContrato), getConversaciones()])
      .then(([mensajesIniciales, conversaciones]) => {
        if (cancelado) return;
        setMensajes(mensajesIniciales);
        if (mensajesIniciales.length > 0) {
          ultimoIdRef.current = mensajesIniciales[mensajesIniciales.length - 1].id;
        }
        const conv = conversaciones.find((c) => String(c.id_contrato) === String(idContrato));
        if (conv) {
          setOtro({ id: conv.otro_id, nombre: conv.otro_nombre, avatar: conv.otro_avatar, tituloTrabajo: conv.titulo_trabajo });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    return () => { cancelado = true; };
  }, [idContrato]);

  // Polling incremental: arranca recién después de la carga inicial, y solo
  // agrega mensajes nuevos (nunca reemplaza el array completo).
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      getMensajes(idContrato, ultimoIdRef.current ?? undefined)
        .then((nuevos) => {
          if (nuevos.length === 0) return;
          ultimoIdRef.current = Math.max(ultimoIdRef.current ?? 0, nuevos[nuevos.length - 1].id);
          setMensajes((prev) => mergeUnicos(prev, nuevos));
        })
        .catch((err) => console.error('Error en polling de mensajes:', err));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [idContrato, loading]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [mensajes]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    const cuerpo = texto.trim();
    if (!cuerpo || enviando) return;

    setEnviando(true);
    setError(null);
    try {
      const nuevo = await enviarMensaje(idContrato, cuerpo);
      const mensaje = { id: nuevo.id, id_remitente: myUserId, cuerpo, enviado_en: nuevo.enviado_en, leido_en: null };
      setMensajes((prev) => mergeUnicos(prev, [mensaje]));
      ultimoIdRef.current = Math.max(ultimoIdRef.current ?? 0, nuevo.id);
      setTexto('');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <button
          type="button"
          className={styles.perfilLink}
          onClick={() => otro?.id && navigate(`/perfil/${otro.id}`)}
          disabled={!otro?.id}
          aria-label={otro?.nombre ? `Ver perfil de ${otro.nombre}` : 'Ver perfil'}
        >
          {otro?.avatar ? (
            <img src={otro.avatar} alt={otro.nombre} className={styles.headerAvatar} />
          ) : (
            <div className={styles.headerAvatarFallback}>{otro?.nombre?.charAt(0)?.toUpperCase() || '?'}</div>
          )}
          <div className={styles.headerInfo}>
            <span className={styles.headerNombre}>{otro?.nombre || 'Chat'}</span>
            {otro?.tituloTrabajo && <span className={styles.headerTrabajo}>{otro.tituloTrabajo}</span>}
          </div>
        </button>
      </div>

      <div className={styles.lista} ref={listRef}>
        {loading ? (
          <p className={styles.msg}>Cargando...</p>
        ) : mensajes.length === 0 ? (
          <p className={styles.msg}>Todavía no hay mensajes. ¡Escribí el primero!</p>
        ) : (
          mensajes.map((m) => (
            <div
              key={m.id}
              className={m.id_remitente === myUserId ? styles.bubbleMia : styles.bubbleAjena}
            >
              <p className={styles.bubbleTexto}>{m.cuerpo}</p>
              <span className={styles.bubbleHora}>{formatHora(m.enviado_en)}</span>
            </div>
          ))
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.inputRow} onSubmit={handleEnviar}>
        <input
          className={styles.input}
          placeholder="Escribí un mensaje..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={2000}
        />
        <button className={styles.sendBtn} type="submit" disabled={enviando || !texto.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
