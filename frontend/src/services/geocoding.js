const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_EMAIL = import.meta.env.VITE_NOMINATIM_EMAIL ?? '';

// GET https://nominatim.openstreetmap.org/search
export async function geocodeAddress(query) {
  const params = new URLSearchParams({ format: 'json', limit: '1', q: query });
  if (NOMINATIM_EMAIL) params.set('email', NOMINATIM_EMAIL);

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { 'Accept-Language': 'es' },
  });
  if (!res.ok) throw new Error('Error al buscar la dirección');

  const results = await res.json();
  if (!results.length) throw new Error('No encontramos esa dirección, probá ser más específico');

  return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
}

// GET https://nominatim.openstreetmap.org/reverse
export async function reverseGeocodeAddress(lat, lng) {
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

  return address.house_number ? `${calle} ${address.house_number}` : calle;
}
