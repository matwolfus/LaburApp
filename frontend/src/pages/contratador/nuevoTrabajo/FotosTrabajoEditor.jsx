import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { ACCEPT_IMAGENES, TIPOS_IMAGEN } from '../../../constants/dominio';
import styles from '../../../styles/NuevoTrabajo.module.css';

export const MAX_FOTOS = 2;

// Fotos de un trabajo: las que ya tenía (solo al editar, URLs) y las nuevas
// elegidas (Files todavía no subidos, con vista previa). Se suben recién al
// publicar/guardar (NuevoTrabajo).
//   existentes: [{ id, url }]      nuevas: [{ file, previewUrl }]
export default function FotosTrabajoEditor({ existentes, nuevas, onExistentesChange, onNuevasChange }) {
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const total = existentes.length + nuevas.length;

  // Las URLs temporales de las vistas previas se liberan al quitar cada foto
  // y, las que queden, al salir de la pantalla. (Antes se liberaban todas
  // cada vez que cambiaba la lista: al agregar la segunda foto, la miniatura
  // de la primera quedaba rota.)
  const nuevasRef = useRef(nuevas);
  useEffect(() => { nuevasRef.current = nuevas; }, [nuevas]);
  useEffect(() => () => nuevasRef.current.forEach((foto) => URL.revokeObjectURL(foto.previewUrl)), []);

  const agregar = (e) => {
    const elegidas = Array.from(e.target.files);
    e.target.value = '';

    if (total + elegidas.length > MAX_FOTOS) {
      setError(`Podés subir hasta ${MAX_FOTOS} fotos.`);
      return;
    }
    // Mismos tipos que acepta el backend: un HEIC o GIF fallaría recién al publicar.
    if (elegidas.some((file) => !TIPOS_IMAGEN.includes(file.type))) {
      setError('Solo se permiten imágenes JPG, PNG o WebP.');
      return;
    }

    setError(null);
    onNuevasChange([...nuevas, ...elegidas.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
  };

  const quitarNueva = (index) => {
    URL.revokeObjectURL(nuevas[index].previewUrl);
    onNuevasChange(nuevas.filter((_, i) => i !== index));
  };
  const quitarExistente = (index) => onExistentesChange(existentes.filter((_, i) => i !== index));

  const miniatura = (key, src, alt, onQuitar) => (
    <div key={key} className={styles.photoThumb}>
      <img src={src} alt={alt} />
      <button type="button" className={styles.photoRemoveBtn} onClick={onQuitar} aria-label="Quitar foto">
        <X size={14} />
      </button>
    </div>
  );

  return (
    <div className={`${styles.card} ${styles.photosCard}`}>
      <div className={styles.photosHeader}>
        <div className={styles.photosIcon} aria-hidden="true">
          <Camera size={22} />
        </div>
        <div>
          <p className={styles.photosTitle}>
            Agregar fotos <span className={styles.optional}>(Opcional)</span>
          </p>
          <p className={styles.photosSubtitle}>Mostrá lo que necesitás para recibir mejores propuestas</p>
        </div>
      </div>

      {total > 0 && (
        <div className={styles.photosGrid}>
          {existentes.map((foto, i) => miniatura(foto.url, foto.url, `Foto ${i + 1}`, () => quitarExistente(i)))}
          {nuevas.map((foto, i) => miniatura(foto.previewUrl, foto.previewUrl, `Foto ${existentes.length + i + 1}`, () => quitarNueva(i)))}
        </div>
      )}

      {total < MAX_FOTOS && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_IMAGENES}
            multiple
            className={styles.photosInputHidden}
            onChange={agregar}
          />
          <button type="button" className={styles.photosAddBtn} onClick={() => inputRef.current?.click()}>
            Elegir fotos
          </button>
        </>
      )}

      {error && <p className={styles.errorText} role="alert">{error}</p>}
    </div>
  );
}
