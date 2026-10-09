import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getCategorias,
  buscarTrabajadores,
  getConversaciones,
} from '../../services/api';

import WorkerSearchCard from '../../components/WorkerSearchCard/WorkerSearchCard.jsx';
import UbicacionSelector from '../../components/UbicacionSelector';

export default function BuscarTrabajo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [categoriaId, setCategoriaId] = useState(() => {
    const fromUrl = searchParams.get('categoria');
    const parsed = Number(fromUrl);
    return fromUrl && !Number.isNaN(parsed) ? parsed : null;
  });
  const [workers, setWorkers] = useState([]);
  const [ubicacion, setUbicacion] = useState({ idProvincia: '', idLocalidad: '' });
  const [reintento, setReintento] = useState(0);
  // otro_id -> id_postulacion del chat más reciente con esa persona, para
  // habilitar "Contactar" solo con quien ya hay una conversación.
  const [chatsPorUsuario, setChatsPorUsuario] = useState({});

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);

  const selectedCategory = categories.find(
    (category) => category.id === categoriaId
  );

  useEffect(() => {
    const cargarCategorias = async () => {
      setLoadingCategories(true);
      setError(null);
      try {
        const data = await getCategorias();
        setCategories(data || []);
      } catch (err) {
        console.error('Error cargando categorías:', err);
        setError('No pudimos cargar las categorías.');
      } finally {
        setLoadingCategories(false);
      }
    };
    cargarCategorias();
  }, []);

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

  // Hace falta al menos un filtro (oficio o zona) para listar trabajadores.
  const hayFiltro = Boolean(categoriaId || ubicacion.idProvincia || ubicacion.idLocalidad);

  useEffect(() => {
    if (!hayFiltro) {
      setWorkers([]);
      return;
    }
    const buscar = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await buscarTrabajadores({
          categoria: categoriaId,
          provincia: ubicacion.idProvincia,
          localidad: ubicacion.idLocalidad,
        });
        setWorkers(data || []);
      } catch (err) {
        console.error('Error buscando trabajadores:', err);
        setError(err.message || 'No pudimos cargar los trabajadores.');
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, [hayFiltro, categoriaId, ubicacion.idProvincia, ubicacion.idLocalidad, reintento]);

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return workers;
    return workers.filter((worker) => {
      const name = worker.name?.toLowerCase() || '';
      const description = worker.description?.toLowerCase() || '';
      return name.includes(query) || description.includes(query);
    });
  }, [workers, search]);

  // Tocar la categoría ya elegida la deselecciona.
  const handleCategoryChange = (categoryId) => {
    const nueva = categoriaId === categoryId ? null : categoryId;
    setCategoriaId(nueva);
    setSearchParams(nueva ? { categoria: nueva } : {}, { replace: true });
    setSearch('');
    setError(null);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="buscar-state-container">
          <div className="buscar-spinner" />
          <h3>Buscando trabajadores...</h3>
          <p>Estamos buscando profesionales disponibles.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="buscar-state-container">
          <span className="buscar-state-icon">!</span>
          <h3>Ocurrió un problema</h3>
          <p>{error}</p>
          <button
            type="button"
            className="buscar-retry-button"
            onClick={() => setReintento((n) => n + 1)}
          >
            Intentar nuevamente
          </button>
        </div>
      );
    }

    if (!hayFiltro) {
      return (
        <div className="buscar-state-container">
          <span className="buscar-state-icon">⌕</span>
          <h3>Elegí un oficio o una zona</h3>
          <p>Seleccioná una categoría o una ubicación para ver trabajadores disponibles.</p>
        </div>
      );
    }

    if (workers.length === 0) {
      return (
        <div className="buscar-state-container">
          <span className="buscar-state-icon">⌕</span>
          <h3>Todavía no hay trabajadores</h3>
          <p>No hay trabajadores disponibles con estos filtros todavía.</p>
        </div>
      );
    }

    if (filteredWorkers.length === 0) {
      return (
        <div className="buscar-state-container">
          <span className="buscar-state-icon">⌕</span>
          <h3>No encontramos resultados</h3>
          <p>Probá con otro nombre o término de búsqueda.</p>
        </div>
      );
    }

    return (
      <div className="buscar-workers-list">
        {filteredWorkers.map((worker) => (
          <WorkerSearchCard
            key={worker.id}
            {...worker}
            idPostulacionChat={chatsPorUsuario[String(worker.id)] ?? null}
          />
        ))}
      </div>
    );
  };

  return (
    <main className="buscar-page">
      <div className="buscar-content">

        {/* HERO */}
        <section className="buscar-hero">
          <h1>{selectedCategory?.name || 'Buscar trabajadores'}</h1>
          <p>Encontrá la solución ideal para tus necesidades.</p>
        </section>

        {/* BUSCADOR */}
        <section className="buscar-search-section" aria-label="Buscar trabajadores">
          <div className="buscar-search-box">
            <span className="buscar-search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar trabajadores..."
              aria-label="Buscar trabajadores"
              disabled={!hayFiltro}
            />
          </div>
        </section>

        {/* ZONA DE TRABAJO */}
        <section className="buscar-filters-section" aria-label="Filtrar por zona de trabajo">
          <UbicacionSelector
            variant="filter"
            value={ubicacion}
            onChange={setUbicacion}
            idPrefix="buscar-trabajadores"
          />
        </section>

        {/* CATEGORÍAS */}
        <section className="buscar-filters-section" aria-label="Filtrar por categoría">
          <div className="buscar-chips-row" role="radiogroup" aria-label="Categorías">
            {loadingCategories ? (
              <>
                <div className="buscar-chip-skeleton" />
                <div className="buscar-chip-skeleton" />
                <div className="buscar-chip-skeleton" />
              </>
            ) : (
              categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  role="radio"
                  aria-checked={categoriaId === category.id}
                  className={
                    categoriaId === category.id
                      ? 'buscar-chip buscar-chip-selected'
                      : 'buscar-chip'
                  }
                  onClick={() => handleCategoryChange(category.id)}
                >
                  {category.name}
                </button>
              ))
            )}
          </div>
        </section>

        {/* UBICACIÓN */}
        <div className="buscar-location">
          <span>⌖</span>
          <span>Cerca tuyo</span>
          <span className="buscar-location-separator">•</span>
          <span>San Isidro</span>
        </div>

        {/* RESULTADOS */}
        <section className="buscar-results-section" aria-label="Resultados de trabajadores">
          <div className="buscar-results-header">
            <span>
              {loading
                ? 'Buscando...'
                : categoriaId
                  ? `${filteredWorkers.length} profesionales`
                  : 'Profesionales disponibles'}
            </span>
          </div>
          {renderContent()}
        </section>

      </div>
    </main>
  );
}