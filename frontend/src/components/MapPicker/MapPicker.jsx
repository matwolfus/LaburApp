import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import styles from "./MapPicker.module.css";

// Vite no resuelve los paths default de los íconos de Leaflet sin esto.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const FALLBACK_CENTER = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires

const MapPicker = ({ lat, lng, onChange }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const center = lat != null && lng != null ? { lat, lng } : FALLBACK_CENTER;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 15,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([center.lat, center.lng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    const emitPosition = (latlng) => onChangeRef.current({ lat: latlng.lat, lng: latlng.lng });

    marker.on("dragend", () => emitPosition(marker.getLatLng()));
    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      emitPosition(e.latlng);
    });

    if (lat == null || lng == null) {
      emitPosition(center);
    }

    if (navigator.geolocation && lat == null && lng == null) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const pos = { lat: coords.latitude, lng: coords.longitude };
          map.setView([pos.lat, pos.lng], 15);
          marker.setLatLng([pos.lat, pos.lng]);
          emitPosition(pos);
        },
        () => {
          // sin permiso o sin soporte: nos quedamos con el fallback fijo
        }
      );
    }

    return () => {
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={styles.map} />;
};

export default MapPicker;
