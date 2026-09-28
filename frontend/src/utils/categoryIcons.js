import { HandHeart, GraduationCap, Brush, PawPrint, Tag } from 'lucide-react';

// Mapeo nombre de categoría -> ícono de lucide-react, compartido por todo
// lo que necesite representar una categoría visualmente (grilla de
// categorías, y como imagen default de un trabajo sin foto propia).
// La clave se normaliza (trim + minúsculas) porque algunos nombres en la BD
// vienen con espacios/saltos de línea (ej: "Clases\n", "Limpieza\n").
const CATEGORY_ICONS = {
  mascotas: PawPrint,
  cuidado: HandHeart,
  clases: GraduationCap,
  limpieza: Brush,
};

// Fallback explícito para categorías sin ícono mapeado (nuevas categorías
// agregadas en la base que todavía no tienen un ícono asignado acá).
export const DEFAULT_CATEGORY_ICON = Tag;

export function getCategoryIcon(categoryName) {
  const cleanName = (categoryName ?? '').trim().toLowerCase();
  return CATEGORY_ICONS[cleanName] ?? DEFAULT_CATEGORY_ICON;
}
