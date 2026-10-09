const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_EMAIL = import.meta.env.VITE_NOMINATIM_EMAIL ?? '';

// GET https://nominatim.openstreetmap.org/search
// contexto (opcional): nombres de localidad / provincia elegidas en el form.
// Se suman a la búsqueda para que "Potosí 123" caiga en el barrio elegido y
// no en otra ciudad con una calle del mismo nombre. Devuelve también el
// detalle de la dirección encontrada (para detectar provincia y localidad).
export async function geocodeAddress(query, contexto = {}) {
  const partes = [query];
  for (const extra of [contexto.localidad, contexto.provincia, 'Argentina']) {
    if (extra && !normalizarNombre(query).includes(normalizarNombre(extra))) partes.push(extra);
  }

  const params = new URLSearchParams({
    format: 'json',
    limit: '1',
    q: partes.join(', '),
    addressdetails: '1',
    countrycodes: 'ar',
  });
  if (NOMINATIM_EMAIL) params.set('email', NOMINATIM_EMAIL);

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { 'Accept-Language': 'es' },
  });
  if (!res.ok) throw new Error('Error al buscar la dirección');

  const results = await res.json();
  if (!results.length) throw new Error('No encontramos esa dirección, probá ser más específico');

  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
    address: results[0].address ?? {},
  };
}

// GET https://nominatim.openstreetmap.org/reverse
// Devuelve la calle + altura y el detalle de la dirección del punto.
export async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({
    format: 'json',
    lat: String(lat),
    lon: String(lng),
    addressdetails: '1',
  });
  if (NOMINATIM_EMAIL) params.set('email', NOMINATIM_EMAIL);

  const res = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
    headers: { 'Accept-Language': 'es' },
  });
  if (!res.ok) throw new Error('Error al buscar la dirección');

  const { address = {} } = await res.json();
  const calle = address.road ?? address.pedestrian ?? address.footway;
  if (!calle) throw new Error('No encontramos una calle para ese punto');

  return {
    direccion: address.house_number ? `${calle} ${address.house_number}` : calle,
    address,
  };
}

// Para comparar nombres sin importar mayúsculas, tildes ni prefijos
// ("Provincia de Córdoba" ~ "Cordoba").
export function normalizarNombre(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/^(provincia de|partido de|barrio|comuna)\s+/, '')
    .trim();
}
