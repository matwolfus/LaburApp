import { createElement } from 'react';
import { getCategoryIcon } from '../../utils/categoryIcons';

// Ícono de una categoría (ver utils/categoryIcons.js). Componente propio en
// vez de `const Icon = getCategoryIcon(x); <Icon />` dentro de cada render,
// que React marca como "crear un componente durante el render".
// El resto de las props (size, className...) van al ícono de lucide.
export default function IconoCategoria({ categoria, ...props }) {
  return createElement(getCategoryIcon(categoria), props);
}
