import { getProvincias, getLocalidades } from '../services/api';
import { normalizarNombre } from '../services/geocoding';

// Campos de Nominatim donde puede venir la localidad, del más específico al
// más general (en CABA el barrio viene como suburb; en el resto del país la
// ciudad viene como city / town / village).
const CAMPOS_LOCALIDAD = ['suburb', 'neighbourhood', 'quarter', 'city_district', 'city', 'town', 'village', 'municipality', 'county'];

// Nominatim no siempre usa el nombre oficial de la provincia.
function coincideProvincia(nombreBase, address) {
  const candidatos = [address.state, address.city, address['ISO3166-2-lvl4'] === 'AR-C' ? 'Ciudad Autónoma de Buenos Aires' : null]
    .filter(Boolean)
    .map(normalizarNombre);
  const base = normalizarNombre(nombreBase);
  return candidatos.some((c) => c === base || c.startsWith(base) || base.startsWith(c));
}

// A partir del detalle de dirección de Nominatim, busca la provincia y la
// localidad equivalentes de nuestra base. Devuelve
// { idProvincia, idLocalidad, nombreLocalidad, localidadDetectada } con '' en
// lo que no se pudo resolver (ej. provincias sin localidades cargadas).
export async function ubicacionDesdeMapa(address) {
  const provincias = await getProvincias();

  // CABA primero: su "state" a veces viene vacío y "city" dice "Buenos Aires",
  // que si no se confundiría con la provincia de Buenos Aires.
  const esCaba = address['ISO3166-2-lvl4'] === 'AR-C'
    || normalizarNombre(address.state).includes('ciudad autonoma');
  const provincia = esCaba
    ? provincias.find((p) => normalizarNombre(p.nombre).includes('ciudad autonoma'))
    : provincias.find((p) => coincideProvincia(p.nombre, address));

  const candidatos = CAMPOS_LOCALIDAD.map((campo) => address[campo]).filter(Boolean);
  const localidadDetectada = candidatos[0] ?? '';

  if (!provincia) {
    return { idProvincia: '', idLocalidad: '', nombreLocalidad: '', localidadDetectada };
  }

  const localidades = await getLocalidades({ provincia: provincia.id });
  let localidad = null;
  for (const candidato of candidatos) {
    localidad = localidades.find((l) => normalizarNombre(l.nombre) === normalizarNombre(candidato));
    if (localidad) break;
  }

  return {
    idProvincia: provincia.id,
    idLocalidad: localidad?.id ?? '',
    nombreLocalidad: localidad?.nombre ?? '',
    localidadDetectada,
  };
}

// Nombres de la provincia / localidad elegidas, para sumarlos a la búsqueda
// de la dirección (ver geocodeAddress).
export async function nombresDeUbicacion({ idProvincia, idLocalidad }) {
  if (!idProvincia) return {};
  const [provincias, localidades] = await Promise.all([
    getProvincias(),
    idLocalidad ? getLocalidades({ provincia: idProvincia }) : Promise.resolve([]),
  ]);
  return {
    provincia: provincias.find((p) => String(p.id) === String(idProvincia))?.nombre,
    localidad: localidades.find((l) => String(l.id) === String(idLocalidad))?.nombre,
  };
}
