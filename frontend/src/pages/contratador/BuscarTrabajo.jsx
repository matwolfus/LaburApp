import { useEffect, useState } from 'react';
import { buscarTrabajadores, getConversaciones } from '../../services/api';
import PantallaBusqueda from '../../components/PantallaBusqueda';
import WorkerSearchCard from '../../components/WorkerSearchCard/WorkerSearchCard.jsx';

const TEXTOS = {
  buscando: 'Buscando trabajadores...',
  buscandoDetalle: 'Estamos buscando profesionales disponibles.',
  vacioTitulo: 'Todavía no hay trabajadores',
  vacioDetalle: 'No hay trabajadores disponibles con estos filtros todavía.',
  sinFiltroTitulo: 'Elegí un oficio o una zona',
  sinFiltroDetalle: 'Seleccioná una categoría o una ubicación para ver trabajadores disponibles.',
};

const coincideTexto = (worker, query) =>
  (worker.name?.toLowerCase() || '').includes(query) ||
  (worker.description?.toLowerCase() || '').includes(query);

const contador = (n) => `${n} ${n === 1 ? 'profesional' : 'profesionales'}`;

// "Buscar trabajadores" (modo contratador).
export default function BuscarTrabajo() {
  // otro_id -> id_postulacion del chat más reciente con esa persona, para
  // habilitar "Contactar" solo con quien ya hay una conversación.
  const [chatsPorUsuario, setChatsPorUsuario] = useState({});

  useEffect(() => {
    getConversaciones()
      .then((convs) => {
        // Vienen ordenadas de la más reciente a la más vieja: se queda la primera.
        const mapa = {};
        for (const c of convs) {
          mapa[String(c.otro_id)] ??= c.id_postulacion;
        }
        setChatsPorUsuario(mapa);
      })
      .catch((err) => console.error('Error cargando conversaciones:', err));
  }, []);

  return (
    <PantallaBusqueda
      titulo="Buscar trabajadores"
      subtitulo="Encontrá la solución ideal para tus necesidades."
      placeholder="Buscar trabajadores..."
      idPrefix="buscar-trabajadores"
      buscar={buscarTrabajadores}
      requiereFiltro
      coincideTexto={coincideTexto}
      contador={contador}
      textos={TEXTOS}
      renderItem={(worker) => (
        <WorkerSearchCard
          key={worker.id}
          {...worker}
          idPostulacionChat={chatsPorUsuario[String(worker.id)] ?? null}
        />
      )}
    />
  );
}
