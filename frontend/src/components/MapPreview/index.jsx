import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import styles from "./MapPreview.module.css";

// Vite no resuelve los paths default de los íconos de Leaflet sin esto.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Versión de solo lectura de MapPicker: un pin fijo en lat/lng, sin
// arrastre ni click-to-move, y sin scroll-to-zoom (para no atrapar el
// scroll de la página cuando el mapa está embebido en el detalle de un
// trabajo).
const MapPreview = ({ lat, lng }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (lat == null || lng == null) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.marker([lat, lng]).addTo(map);

    return () => {
      map.remove();
    };
  }, [lat, lng]);

  if (lat == null || lng == null) return null;

  return <div ref={containerRef} className={styles.map} />;
};

export default MapPreview;
