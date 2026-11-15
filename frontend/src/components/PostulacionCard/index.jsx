import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IconoCategoria from '../IconoCategoria';
import { ESTADOS_CHAT_ABIERTO, labelEstadoPostulacion, puedeCancelarPostulacion } from '../../constants/dominio';
import { formatFechaHoraCorta, formatPesosOVacio } from '../../utils/formato';
import '../../styles/ofertas.css';

// Tarjeta de una postulación propia (vista del trabajador). Única versión,
// usada en el Inicio (resumen, sin acciones extra) y en "Mis postulaciones"
// (con chat, cancelar y reconfirmar).
//
// Las acciones son opcionales: si no se pasa el handler, el botón no aparece.
//   onCancelar(p)           -> botón "Cancelar" (solo si el estado lo permite)
//   onReconfirmar(p, sigue) -> bloque "¿Seguís interesado?" (por_reconfirmar)
//   conChat                 -> botón "Chat" (solo si el chat sigue abierto)
export default function PostulacionCard({ postulacion: p, conChat = false, onCancelar, onReconfirmar, respondiendo = false }) {
  const navigate = useNavigate();
  // Si la foto no carga (URL rota) se muestra el ícono de la categoría, igual que JobCard.
  const [imgError, setImgError] = useState(false);

  // precio_propuesto null solo en postulaciones viejas (antes del P3): ahí se muestra el presupuesto.
  const precio = p.precio_propuesto ?? p.presupuesto_trabajo;

  return (
    <div className="job-card">
      <div className="job-card__top">
        {p.image_url && !imgError ? (
          <img
            className="job-card__image"
            src={p.image_url}
            alt={p.titulo_trabajo}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="job-card__image job-card__image--placeholder" aria-hidden="true">
            <IconoCategoria categoria={p.categoria} size={28} strokeWidth={2} />
          </div>
        )}
        <div className="job-card__info">
          <h3 className="job-card__title">{p.titulo_trabajo}</h3>
          <p className="job-card__date">
            {p.categoria ? `${p.categoria} · ` : ''}{formatPesosOVacio(precio)}
          </p>
        </div>
      </div>

      <div className="job-card__bottom">
        <span className="job-card__count">{labelEstadoPostulacion(p)}</span>
        <div className="job-card__actions">
          <button className="job-card__btn job-card__btn--outline" onClick={() => navigate(`/trabajador/trabajos/${p.id_trabajo}`)}>
            Ver detalle
          </button>
          {conChat && ESTADOS_CHAT_ABIERTO.includes(p.estado) && (
            <button className="job-card__btn job-card__btn--outline" onClick={() => navigate(`/chats/${p.id}`)}>
              Chat
            </button>
          )}
          {onCancelar && puedeCancelarPostulacion(p) && (
            <button className="job-card__btn" onClick={() => onCancelar(p)}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {onReconfirmar && p.estado === 'por_reconfirmar' && (
        <div className="job-card__reconfirmar">
          <p>
            El trabajo está disponible de nuevo. ¿Seguís interesado?
            {p.reconfirmar_hasta && <> Respondé antes del {formatFechaHoraCorta(p.reconfirmar_hasta)}.</>}
          </p>
          <div className="job-card__actions">
            <button className="job-card__btn" disabled={respondiendo} onClick={() => onReconfirmar(p, true)}>
              Sigo interesado
            </button>
            <button className="job-card__btn job-card__btn--outline" disabled={respondiendo} onClick={() => onReconfirmar(p, false)}>
              Ya no me interesa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
