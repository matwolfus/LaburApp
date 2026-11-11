import { useRef, useState } from 'react';
import { geocodeAddress, reverseGeocode } from '../../../services/geocoding';
import { ubicacionDesdeMapa, nombresDeUbicacion } from '../../../utils/ubicacionDesdeMapa';

// Estado y lógica de la ubicación de un trabajo: dirección escrita, provincia
// y localidad elegidas, y el punto del mapa. Mantiene las tres cosas en
// sincronía (buscar la dirección mueve el mapa; mover el mapa completa la
// dirección y la localidad) y avisa si no coinciden.
export default function useUbicacionTrabajo() {
  const [direccion, setDireccion] = useState('');
  const [ubicacion, setUbicacion] = useState({ idProvincia: '', idLocalidad: '' });
  // Provincia / localidad detectadas en el punto del mapa.
  const [ubicacionMapa, setUbicacionMapa] = useState(null);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(null);
  // Si el usuario mueve el mapa varias veces seguidas, solo cuenta la última respuesta.
  const ultimaBusquedaRef = useRef(0);

  // Al editar: carga lo que el trabajo ya tenía.
  const cargar = (job) => {
    setDireccion(job.address ?? '');
    setUbicacion({ idProvincia: job.id_provincia ?? '', idLocalidad: job.id_localidad ?? '' });
    setLat(job.lat ?? null);
    setLng(job.lng ?? null);
  };

  // Completa provincia y localidad con lo que hay en el punto del mapa.
  const sincronizarConMapa = async (address) => {
    try {
      const detectada = await ubicacionDesdeMapa(address);
      setUbicacionMapa(detectada);
      if (detectada.idProvincia) {
        setUbicacion({ idProvincia: detectada.idProvincia, idLocalidad: detectada.idLocalidad });
      }
    } catch (err) {
      console.error('No se pudo detectar la localidad del mapa:', err);
    }
  };

  // Dirección escrita -> punto en el mapa.
  const buscarDireccion = async () => {
    if (!direccion.trim()) return;
    setBuscando(true);
    setErrorBusqueda(null);
    try {
      // La provincia / localidad ya elegidas acotan la búsqueda.
      const contexto = await nombresDeUbicacion(ubicacion).catch(() => ({}));
      const { lat: nuevaLat, lng: nuevaLng, address } = await geocodeAddress(direccion, contexto);
      setLat(nuevaLat);
      setLng(nuevaLng);
      await sincronizarConMapa(address);
    } catch (err) {
      setErrorBusqueda(err.message || 'Error al buscar la dirección');
    } finally {
      setBuscando(false);
    }
  };

  // Punto movido en el mapa -> dirección y localidad.
  const moverMapa = async ({ lat: nuevaLat, lng: nuevaLng, isUserAction }) => {
    setLat(nuevaLat);
    setLng(nuevaLng);
    if (!isUserAction) return;

    const id = ++ultimaBusquedaRef.current;
    setBuscando(true);
    setErrorBusqueda(null);
    try {
      const { direccion: calle, address } = await reverseGeocode(nuevaLat, nuevaLng);
      if (id === ultimaBusquedaRef.current) {
        setDireccion(calle);
        await sincronizarConMapa(address);
      }
    } catch (err) {
      if (id === ultimaBusquedaRef.current) setErrorBusqueda(err.message || 'Error al buscar la dirección');
    } finally {
      if (id === ultimaBusquedaRef.current) setBuscando(false);
    }
  };

  // Aviso si el punto del mapa no coincide con la localidad elegida.
  let aviso = null;
  if (ubicacionMapa?.idProvincia) {
    if (!ubicacionMapa.idLocalidad) {
      aviso = ubicacionMapa.localidadDetectada
        ? `El punto del mapa está en "${ubicacionMapa.localidadDetectada}", que no está en la lista de localidades. Elegí la más cercana.`
        : null;
    } else if (String(ubicacion.idLocalidad) !== String(ubicacionMapa.idLocalidad)) {
      aviso = `El punto del mapa está en ${ubicacionMapa.nombreLocalidad}, pero elegiste otra localidad. Revisá que coincidan.`;
    }
  }

  return {
    direccion, setDireccion,
    ubicacion, setUbicacion,
    lat, lng,
    buscando, errorBusqueda, aviso,
    cargar, buscarDireccion, moverMapa,
  };
}
