import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getCategorias,
  buscarTrabajosPorCategoria,
} from '../../services/api';

import JobSearchCard from '../../components/JobSearchCard/index.jsx';

// Mismo esqueleto que pages/contratador/BuscarTrabajo.jsx (mismas clases
// globales de index.css: buscar-page/buscar-content/etc.), pero buscando
// TRABAJOS abiertos en vez de trabajadores.
export default function BuscarTrabajos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [categoriaId, setCategoriaId] = useState(() => {
    const fromUrl = searchParams.get('categoria');
    const parsed = Number(fromUrl);
    return fromUrl && !Number.isNaN(parsed) ? parsed : null;
  });
  const [jobs, setJobs] = useState([]);

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
    const buscar = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await buscarTrabajosPorCategoria(categoriaId);
        setJobs(data || []);
      } catch (err) {
        console.error('Error buscando trabajos:', err);
        setError(err.message || 'No pudimos cargar los trabajos.');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, [categoriaId]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobs;
    return jobs.filter((job) => {
      const title = job.title?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      return title.includes(query) || description.includes(query);
    });
  }, [jobs, search]);

  const handleCategoryChange = (categoryId) => {
    setCategoriaId(categoryId);
    setSearchParams({ categoria: categoryId }, { replace: true });
    setSearch('');
    setError(null);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="buscar-state-container">
          <div className="buscar-spinner" />
          <h3>Buscando trabajos...</h3>
          <p>Estamos buscando trabajos disponibles.</p>
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
            onClick={() => {
              const currentCategory = categoriaId;
              setCategoriaId(null);
              setTimeout(() => setCategoriaId(currentCategory), 0);
            }}
          >
            Intentar nuevamente
          </button>
        </div>
      );
    }

    if (jobs.length === 0) {
      return (
        <div className="buscar-state-container">
          <span className="buscar-state-icon">⌕</span>
          <h3>Todavía no hay trabajos</h3>
          <p>No hay trabajos abiertos en esta categoría todavía.</p>
        </div>
      );
    }

    if (filteredJobs.length === 0) {
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
        {filteredJobs.map((job) => (
          <JobSearchCard key={job.id} {...job} />
        ))}
      </div>
    );
  };

  return (
    <main className="buscar-page">
      <div className="buscar-content">

        {/* HERO */}
        <section className="buscar-hero">
          <h1>{selectedCategory?.name || 'Buscar trabajos'}</h1>
          <p>Encontrá la changa ideal para vos.</p>
        </section>

        {/* BUSCADOR */}
        <section className="buscar-search-section" aria-label="Buscar trabajos">
          <div className="buscar-search-box">
            <span className="buscar-search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar trabajos..."
              aria-label="Buscar trabajos"
            />
          </div>
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

        {/* RESULTADOS */}
        <section className="buscar-results-section" aria-label="Resultados de trabajos">
          <div className="buscar-results-header">
            <span>
              {loading
                ? 'Buscando...'
                : `${filteredJobs.length} trabajos disponibles`}
            </span>
          </div>
          {renderContent()}
        </section>

      </div>
    </main>
  );
}
