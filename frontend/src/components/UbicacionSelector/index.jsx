import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import ComboBox from '../ComboBox';
import { getProvincias, getLocalidades } from '../../services/api';
import styles from './UbicacionSelector.module.css';

// Provincia + localidad, los dos con buscador. La localidad se habilita
// recién al elegir provincia y se carga según esa provincia; cambiar la
// provincia limpia la localidad. En la base se guarda solo id_localidad.
//
// value: { idProvincia, idLocalidad } ('' cuando no hay)
// onChange: ({ idProvincia, idLocalidad }) => void
// variant: 'form' (labels arriba, para formularios) | 'filter' (compacto,
// con botón para limpiar, para las pantallas de búsqueda)
export default function UbicacionSelector({
  value,
  onChange,
  variant = 'form',
  labelClassName,
  labels = { provincia: 'Provincia', localidad: 'Localidad' },
  idPrefix = 'ubicacion',
}) {
  const [provincias, setProvincias] = useState([]);
  // Localidades cargadas + de qué provincia son: mientras no coincidan con
  // la provincia elegida, se está cargando (sin setState sincrónico en el effect).
  const [cargadas, setCargadas] = useState({ idProvincia: null, localidades: [] });
  const [error, setError] = useState(null);

  const idProvincia = value?.idProvincia ?? '';
  const idLocalidad = value?.idLocalidad ?? '';
  const esFiltro = variant === 'filter';

  useEffect(() => {
    getProvincias()
      .then(setProvincias)
      .catch(() => setError('No se pudieron cargar las provincias.'));
  }, []);

  useEffect(() => {
    if (!idProvincia) return;
    let cancelado = false;
    getLocalidades({ provincia: idProvincia })
      .then((data) => !cancelado && setCargadas({ idProvincia: String(idProvincia), localidades: data }))
      .catch(() => {
        if (cancelado) return;
        setError('No se pudieron cargar las localidades.');
        setCargadas({ idProvincia: String(idProvincia), localidades: [] });
      });
    return () => { cancelado = true; };
  }, [idProvincia]);

  const loadingLocalidades = Boolean(idProvincia) && cargadas.idProvincia !== String(idProvincia);
  const localidades = idProvincia && !loadingLocalidades ? cargadas.localidades : [];

  const provinciaOptions = provincias.map((p) => ({ value: p.id, label: p.nombre }));
  const localidadOptions = localidades.map((l) => ({ value: l.id, label: l.nombre }));

  const sinLocalidades = Boolean(idProvincia) && !loadingLocalidades && localidades.length === 0;

  const localidadPlaceholder = !idProvincia
    ? 'Elegí primero una provincia'
    : loadingLocalidades
      ? 'Cargando...'
      : sinLocalidades
        ? 'Todavía no hay localidades cargadas'
        : esFiltro ? 'Todas las localidades' : 'Seleccioná una localidad';

  return (
    <div className={esFiltro ? styles.filterRow : styles.formGroup}>
      <div className={styles.field}>
        {!esFiltro && (
          <label htmlFor={`${idPrefix}-provincia`} className={labelClassName}>{labels.provincia}</label>
        )}
        <ComboBox
          id={`${idPrefix}-provincia`}
          options={provinciaOptions}
          value={idProvincia}
          onChange={(nuevaProvincia) =>
            onChange({ idProvincia: nuevaProvincia, idLocalidad: '' })
          }
          placeholder={esFiltro ? 'Todas las provincias' : 'Seleccioná una provincia'}
          emptyText="No encontramos esa provincia"
          clearable={esFiltro}
          icon={esFiltro ? null : <MapPin size={18} />}
        />
      </div>

      <div className={styles.field}>
        {!esFiltro && (
          <label htmlFor={`${idPrefix}-localidad`} className={labelClassName}>{labels.localidad}</label>
        )}
        <ComboBox
          id={`${idPrefix}-localidad`}
          options={localidadOptions}
          value={idLocalidad}
          onChange={(nuevaLocalidad) =>
            onChange({ idProvincia, idLocalidad: nuevaLocalidad })
          }
          placeholder={localidadPlaceholder}
          emptyText="No encontramos esa localidad"
          disabled={!idProvincia || loadingLocalidades || sinLocalidades}
          clearable={esFiltro}
          icon={esFiltro ? null : <MapPin size={18} />}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
