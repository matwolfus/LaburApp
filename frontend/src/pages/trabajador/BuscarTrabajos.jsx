import { useEffect, useState } from 'react';
import { buscarTrabajos, getMisPostulaciones } from '../../services/api';
import PantallaBusqueda from '../../components/PantallaBusqueda';
import JobSearchCard from '../../components/JobSearchCard/index.jsx';

const TEXTOS = {
  buscando: 'Buscando trabajos...',
  buscandoDetalle: 'Estamos buscando trabajos disponibles.',
  vacioTitulo: 'Todavía no hay trabajos',
  vacioDetalle: 'No hay trabajos abiertos con estos filtros todavía.',
};

const coincideTexto = (job, query) =>
  (job.title?.toLowerCase() || '').includes(query) ||
  (job.description?.toLowerCase() || '').includes(query);

const contador = (n) => `${n} ${n === 1 ? 'trabajo disponible' : 'trabajos disponibles'}`;

// "Buscar trabajos" (modo trabajador). Sin filtros muestra todos los abiertos.
export default function BuscarTrabajos() {
  // Trabajos a los que ya me postulé (sin contar las retiradas: a esos se
  // puede volver a postular).
  const [idsPostulados, setIdsPostulados] = useState(new Set());

  useEffect(() => {
    getMisPostulaciones()
      .then((postulaciones) => setIdsPostulados(new Set(
        postulaciones.filter((p) => p.estado !== 'retirado').map((p) => String(p.id_trabajo))
      )))
      .catch((err) => console.error('Error cargando tus postulaciones:', err));
  }, []);

  return (
    <PantallaBusqueda
      titulo="Buscar trabajos"
      subtitulo="Encontrá el trabajo ideal para vos."
      placeholder="Buscar trabajos..."
      idPrefix="buscar-trabajos"
      buscar={buscarTrabajos}
      coincideTexto={coincideTexto}
      contador={contador}
      textos={TEXTOS}
      renderItem={(job) => (
        <JobSearchCard key={job.id} {...job} yaPostulado={idsPostulados.has(String(job.id))} />
      )}
    />
  );
}
