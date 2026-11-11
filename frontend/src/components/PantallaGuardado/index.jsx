import { Check } from 'lucide-react';
import styles from './PantallaGuardado.module.css';

// Pantalla de "¡Guardado!" con tilde animado. Única versión, usada al editar
// el perfil y al editar un trabajo (antes cada una tenía su copia y su CSS).
//
//   filas: [{ icono: <Bell />, texto: '...' }]
//   nota:  texto chico debajo de la tarjeta (opcional)
//   secundario: { label, onClick } (opcional)
export default function PantallaGuardado({ titulo, subtitulo, filas = [], nota, primario, secundario }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconoExterior}>
        <div className={styles.iconoInterior}>
          <Check size={32} color="white" strokeWidth={3} />
        </div>
      </div>

      <h1 className={styles.titulo}>{titulo}</h1>
      {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}

      {filas.length > 0 && (
        <div className={styles.tarjeta}>
          {filas.map((fila, i) => (
            <div key={i}>
              {i > 0 && <div className={styles.divisor} />}
              <div className={styles.fila}>
                <span className={styles.filaIcono}>{fila.icono}</span>
                <span>{fila.texto}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {nota && <p className={styles.nota}>{nota}</p>}

      <button type="button" className={styles.botonPrimario} onClick={primario.onClick}>
        {primario.label}
      </button>
      {secundario && (
        <button type="button" className={styles.botonSecundario} onClick={secundario.onClick}>
          {secundario.label}
        </button>
      )}
    </div>
  );
}
