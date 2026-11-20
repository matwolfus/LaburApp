import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategorias } from '../../services/api';
import UbicacionSelector from '../UbicacionSelector';

// Referencia estable para 'sin resultados' (no un [] nuevo en cada render).
const SIN_ITEMS = [];

// Pantalla de búsqueda con filtros (texto, ubicación y categoría). La usan
// "Buscar trabajadores" (contratador) y "Buscar trabajos" (trabajador):
// antes eran dos copias del mismo archivo.
//
// Props:
//   titulo, subtitulo, placeholder, idPrefix   textos de la pantalla
//   buscar({ categoria, provincia, localidad }) -> Promise<array>
//                                              tiene que ser una función estable (ej. de api.js)
//   requiereFiltro       sin al menos un filtro no se busca (trabajadores)
//   coincideTexto(item, query)                 filtro local del buscador de texto
//   renderItem(item)     la tarjeta de cada resultado
//   contador(n)          texto del encabezado de resultados
//   textos               { buscando, buscandoDetalle, vacioTitulo, vacioDetalle,
//                          sinFiltroTitulo, sinFiltroDetalle }
export default function PantallaBusqueda({
  titulo,
  subtitulo,
  placeholder,
  idPrefix,
  buscar,
  requiereFiltro = false,
  coincideTexto,
  renderItem,
  contador,
  textos,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoriaId, setCategoriaId] = useState(() => {
    const parsed = Number(searchParams.get('categoria'));
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  });
  const [ubicacion, setUbicacion] = useState({ idProvincia: '', idLocalidad: '' });
  const [search, setSearch] = useState('');
  const [reintento, setReintento] = useState(0);

  const [categorias, setCategorias] = useState(null); // null = cargando
  const [errorCategorias, setErrorCategorias] = useState(null);

  useEffect(() => {
    getCategorias()
      .then((data) => setCategorias(data || []))
      .catch((err) => {
        console.error('Error cargando categorías:', err);
        setCategorias([]);
        setErrorCategorias('No pudimos cargar las categorías.');
      });
  }, []);

  const hayFiltro = Boolean(categoriaId || ubicacion.idProvincia || ubicacion.idLocalidad);
  const debeBuscar = !requiereFiltro || hayFiltro;

  // Resultado de la última búsqueda, junto con los filtros que la pidieron.
  // "Cargando" se deriva (los filtros actuales todavía no tienen resultado),
  // así no hay setState sincrónico en el efecto y una respuesta vieja no
  // pisa a una más nueva.
  const consulta = JSON.stringify([categoriaId, ubicacion.idProvincia, ubicacion.idLocalidad, reintento]);
  const [resultado, setResultado] = useState({ consulta: null, items: SIN_ITEMS, error: null });

  useEffect(() => {
    if (!debeBuscar) return;
    let vigente = true;
    buscar({ categoria: categoriaId, provincia: ubicacion.idProvincia, localidad: ubicacion.idLocalidad })
      .then((items) => vigente && setResultado({ consulta, items: items || [], error: null }))
      .catch((err) => {
        console.error('Error en la búsqueda:', err);
        if (vigente) setResultado({ consulta, items: [], error: err.message || 'No pudimos cargar los resultados.' });
      });
    return () => { vigente = false; };
  }, [buscar, debeBuscar, consulta, categoriaId, ubicacion.idProvincia, ubicacion.idLocalidad]);

  const vigente = debeBuscar && resultado.consulta === consulta;
  const loading = debeBuscar && !vigente;
  const items = vigente ? resultado.items : SIN_ITEMS;
  const error = (vigente ? resultado.error : null) ?? errorCategorias;

  const filtrados = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? items.filter((item) => coincideTexto(item, query)) : items;
  }, [items, search, coincideTexto]);

  const categoriaElegida = categorias?.find((c) => c.id === categoriaId);

  // Tocar la categoría ya elegida la deselecciona.
  const handleCategoria = (id) => {
    const nueva = categoriaId === id ? null : id;
    setCategoriaId(nueva);
    setSearchParams(nueva ? { categoria: nueva } : {}, { replace: true });
    setSearch('');
  };

  const estado = (icono, tituloEstado, detalle, accion = null) => (
    <div className="buscar-state-container">
      {icono === 'spinner' ? <div className="buscar-spinner" /> : <span className="buscar-state-icon">{icono}</span>}
      <h3>{tituloEstado}</h3>
      <p>{detalle}</p>
      {accion}
    </div>
  );

  const renderResultados = () => {
    if (!debeBuscar) return estado('⌕', textos.sinFiltroTitulo, textos.sinFiltroDetalle);
    if (loading) return estado('spinner', textos.buscando, textos.buscandoDetalle);
    if (error) {
      return estado('!', 'Ocurrió un problema', error, (
        <button type="button" className="buscar-retry-button" onClick={() => setReintento((n) => n + 1)}>
          Intentar nuevamente
        </button>
      ));
    }
    if (items.length === 0) return estado('⌕', textos.vacioTitulo, textos.vacioDetalle);
    if (filtrados.length === 0) return estado('⌕', 'No encontramos resultados', 'Probá con otro nombre o término de búsqueda.');
    return <div className="buscar-workers-list">{filtrados.map(renderItem)}</div>;
  };

  return (
    <main className="buscar-page">
      <div className="buscar-content">

        <section className="buscar-hero">
          <h1>{categoriaElegida?.name || titulo}</h1>
          <p>{subtitulo}</p>
        </section>

        <section className="buscar-search-section" aria-label={titulo}>
          <div className="buscar-search-box">
            <span className="buscar-search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              disabled={!debeBuscar}
            />
          </div>
        </section>

        <section className="buscar-filters-section" aria-label="Filtrar por ubicación">
          <UbicacionSelector variant="filter" value={ubicacion} onChange={setUbicacion} idPrefix={idPrefix} />
        </section>

        <section className="buscar-filters-section" aria-label="Filtrar por categoría">
          <div className="buscar-chips-row" role="radiogroup" aria-label="Categorías">
            {categorias === null ? (
              <>
                <div className="buscar-chip-skeleton" />
                <div className="buscar-chip-skeleton" />
                <div className="buscar-chip-skeleton" />
              </>
            ) : (
              categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  type="button"
                  role="radio"
                  aria-checked={categoriaId === categoria.id}
                  className={categoriaId === categoria.id ? 'buscar-chip buscar-chip-selected' : 'buscar-chip'}
                  onClick={() => handleCategoria(categoria.id)}
                >
                  {categoria.name}
                </button>
              ))
            )}
          </div>
        </section>

        <section className="buscar-results-section" aria-label="Resultados">
          <div className="buscar-results-header">
            <span>{loading ? 'Buscando...' : contador(filtrados.length)}</span>
          </div>
          {renderResultados()}
        </section>

      </div>
    </main>
  );
}
