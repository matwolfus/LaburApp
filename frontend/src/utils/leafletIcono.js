// frontend/src/utils/leafletIcono.js
// Arreglo del ícono del marcador de Leaflet con Vite: Leaflet arma la URL de
// la imagen a partir del CSS y con el bundler queda rota (marcador invisible).
// Se importa una sola vez por efecto secundario desde los componentes de mapa
// (antes estaba copiado en MapPicker y MapPreview).
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
