import { useState } from 'react';
import { colorDeNombre, getIniciales } from '../../utils/formato';

// Foto de perfil con fallback a iniciales. Único componente para esto en la
// app (antes había una implementación distinta en cada pantalla).
//
// - Si no hay `src` o la imagen no carga (URL rota), muestra las iniciales.
// - El tamaño y la forma los pone quien lo usa: `className` para la foto y
//   `fallbackClassName` para las iniciales (si no viene, usa `className`).
// - `fallback`: qué mostrar si tampoco hay nombre (texto o un ícono).
// - `fallbackTag`: etiqueta de las iniciales ('div' por defecto; 'span' si va
//   dentro de un <button>, donde un div no es HTML válido).
export default function Avatar({ src, nombre, className, fallbackClassName, fallback = '?', fallbackTag: Tag = 'div', alt }) {
  // Se guarda QUÉ url falló: si cambia el src (ej. sube otra foto), se reintenta.
  const [srcRoto, setSrcRoto] = useState(null);
  const mostrarFoto = !!src && srcRoto !== src;

  if (mostrarFoto) {
    return (
      <img
        src={src}
        alt={alt ?? (nombre ? `Foto de ${nombre}` : 'Foto de perfil')}
        className={className}
        onError={() => setSrcRoto(src)}
      />
    );
  }

  const iniciales = getIniciales(nombre, '');
  // Color propio de la persona como variables CSS: el CSS de cada pantalla
  // decide si las usa (background: var(--avatar-bg, ...)).
  const n = colorDeNombre(nombre);
  const colores = { '--avatar-bg': `var(--avatar-${n}-bg)`, '--avatar-fg': `var(--avatar-${n}-fg)` };
  return (
    <Tag className={fallbackClassName ?? className} style={colores} aria-hidden="true">
      {iniciales || fallback}
    </Tag>
  );
}
