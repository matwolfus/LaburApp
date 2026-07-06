import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X } from "lucide-react";
import BackButton from "../../components/BackButton";
import CategorySelector from "../../components/CategorySelector/CategorySelector";
import DateTimePicker from "../../components/DateTimeSelector/DateTimeSelector";
import DurationSelector from "../../components/DurationSelector/DurationSelector";
import PrioritySelector from "../../components/PrioritySelector/PrioritySelector";
import MapPicker from "../../components/MapPicker/MapPicker";
import { createTrabajo, uploadFotos } from "../../services/api";
import { geocodeAddress, reverseGeocodeAddress } from "../../services/geocoding";
import styles from "../../styles/NuevoTrabajo.module.css";

const MAX_FOTOS = 2;

// Formatea un string de dígitos (+ opcional coma decimal) con puntos de miles: "10000" -> "10.000"
function formatPresupuesto(raw) {
  const [entero, decimales] = raw.split(",");
  const enteroConPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimales !== undefined ? `${enteroConPuntos},${decimales}` : enteroConPuntos;
}

// Convierte el valor formateado ("10.000,50") al número que espera el backend (10000.5)
function parsePresupuesto(formatted) {
  return Number(formatted.replace(/\./g, "").replace(",", "."));
}

export default function NuevoTrabajo() {
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState("");
  const [idCategoria, setIdCategoria] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [prioridad, setPrioridad] = useState("normal");
  const [duracion, setDuracion] = useState(60);
  const [presupuesto, setPresupuesto] = useState("");
  const [direccion, setDireccion] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodingError, setGeocodingError] = useState(null);
  const reverseGeocodeRequestRef = useRef(0);

  const [fotos, setFotos] = useState([]);
  const [uploadingFotos, setUploadingFotos] = useState(false);
  const [fotosError, setFotosError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => fotos.forEach((foto) => URL.revokeObjectURL(foto.previewUrl));
  }, [fotos]);

  const handleFotosChange = (e) => {
    const selected = Array.from(e.target.files);
    e.target.value = "";

    if (fotos.length + selected.length > MAX_FOTOS) {
      setFotosError(`Podés subir hasta ${MAX_FOTOS} fotos.`);
      return;
    }

    setFotosError(null);
    const nuevas = selected.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setFotos((prev) => [...prev, ...nuevas]);
  };

  const handleRemoveFoto = (index) => {
    setFotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleGeocodeAddress = async () => {
    if (!direccion.trim()) return;

    setGeocodingLoading(true);
    setGeocodingError(null);

    try {
      const { lat: foundLat, lng: foundLng } = await geocodeAddress(direccion);
      setLat(foundLat);
      setLng(foundLng);
    } catch (err) {
      setGeocodingError(err.message || "Error al buscar la dirección");
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleMapChange = async ({ lat: newLat, lng: newLng, isUserAction }) => {
    setLat(newLat);
    setLng(newLng);

    if (!isUserAction) return;

    const requestId = ++reverseGeocodeRequestRef.current;
    setGeocodingLoading(true);
    setGeocodingError(null);

    try {
      const address = await reverseGeocodeAddress(newLat, newLng);
      if (requestId === reverseGeocodeRequestRef.current) setDireccion(address);
    } catch (err) {
      if (requestId === reverseGeocodeRequestRef.current) {
        setGeocodingError(err.message || "Error al buscar la dirección");
      }
    } finally {
      if (requestId === reverseGeocodeRequestRef.current) setGeocodingLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idCategoria) {
      setError("Seleccioná una categoría.");
      return;
    }
    if (!titulo.trim()) {
      setError("Ingresá un título.");
      return;
    }
    if (!fecha) {
      setError("Seleccioná una fecha.");
      return;
    }
    const presupuestoNum = parsePresupuesto(presupuesto);
    if (!presupuesto || isNaN(presupuestoNum) || presupuestoNum <= 0) {
      setError("Ingresá un presupuesto válido.");
      return;
    }
    if (!direccion.trim()) {
      setError("Ingresá una ubicación.");
      return;
    }

    // Sin offset a propósito: la columna es "timestamp without time zone" y toda la app
    // asume una sola timezone (Argentina), así que mandamos la hora tal cual la eligió el usuario.
    const programado_para = `${fecha}T${hora || "00:00"}:00`;

    setSubmitting(true);
    setError(null);

    try {
      let imagenes;
      if (fotos.length > 0) {
        setUploadingFotos(true);
        const { urls } = await uploadFotos(fotos.map((f) => f.file));
        imagenes = urls;
      }

      await createTrabajo({
        id_categoria: idCategoria,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        presupuesto: presupuestoNum,
        programado_para,
        prioridad,
        duracion,
        direccion: direccion.trim(),
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        imagenes,
      });
      navigate("/inicio");
    } catch (err) {
      setError(err.message || "Error al publicar la tarea");
    } finally {
      setSubmitting(false);
      setUploadingFotos(false);
    }
  };

  return (
    <div className={styles.screen}>
      <BackButton title="Nuevo Trabajo" />

      <form className={styles.content} onSubmit={handleSubmit}>
        <div className={styles.intro}>
          <h1 className={styles.heading}>Nuevo trabajo</h1>
          <p className={styles.subheading}>Describe lo que necesitas y encontrá la ayuda ideal.</p>
        </div>

        <div className={styles.card}>
          <label className={styles.label} htmlFor="titulo">¿QUÉ NECESITAS?</label>
          <input
            id="titulo"
            className={styles.textInput}
            type="text"
            placeholder="Ej: Paseador de perros para fin de semana"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <CategorySelector selectedId={idCategoria} onChange={setIdCategoria} />
        </div>

        <div className={styles.card}>
          <label className={styles.label} htmlFor="descripcion">
            DETALLES DE LA TAREA <span className={styles.optional}>(Opcional)</span>
          </label>
          <textarea
            id="descripcion"
            className={styles.textarea}
            placeholder="Contanos qué necesitas exactamente..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
          />
        </div>

        <DateTimePicker fecha={fecha} hora={hora} onFechaChange={setFecha} onHoraChange={setHora} />

        <PrioritySelector value={prioridad} onChange={setPrioridad} />

        <DurationSelector value={duracion} onChange={setDuracion} />

        <div className={styles.card}>
          <label className={styles.label} htmlFor="presupuesto">PRESUPUESTO ESTIMADO</label>
          <div className={styles.budgetInputWrapper}>
            <span className={styles.budgetPrefix}>$</span>
            <input
              id="presupuesto"
              className={styles.budgetInput}
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={presupuesto}
              onChange={(e) => {
                let raw = e.target.value.replace(/[^\d,]/g, "");
                const [entero, ...resto] = raw.split(",");
                if (resto.length > 0) raw = `${entero},${resto.join("").slice(0, 2)}`;
                setPresupuesto(raw === "" ? "" : formatPresupuesto(raw));
              }}
            />
          </div>

          <label className={styles.label} htmlFor="direccion">UBICACIÓN</label>
          <input
            id="direccion"
            className={styles.textInput}
            type="text"
            placeholder="Ej: Potosí 123, Buenos Aires"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleGeocodeAddress();
              }
            }}
            disabled={geocodingLoading}
          />
          {geocodingError && <p className={styles.errorText} role="alert">{geocodingError}</p>}
          <div className={styles.mapWrapper}>
            <MapPicker lat={lat} lng={lng} onChange={handleMapChange} />
          </div>
        </div>

        <div className={`${styles.card} ${styles.photosCard}`}>
          <div className={styles.photosHeader}>
            <div className={styles.photosIcon} aria-hidden="true">
              <Camera size={22} />
            </div>
            <div>
              <p className={styles.photosTitle}>
                Agregar fotos <span className={styles.optional}>(Opcional)</span>
              </p>
              <p className={styles.photosSubtitle}>
                Muestra lo que necesitas para obtener mejores ofertas
              </p>
            </div>
          </div>

          {fotos.length > 0 && (
            <div className={styles.photosGrid}>
              {fotos.map((foto, index) => (
                <div key={foto.previewUrl} className={styles.photoThumb}>
                  <img src={foto.previewUrl} alt={`Foto ${index + 1}`} />
                  <button
                    type="button"
                    className={styles.photoRemoveBtn}
                    onClick={() => handleRemoveFoto(index)}
                    aria-label="Quitar foto"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {fotos.length < MAX_FOTOS && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className={styles.photosInputHidden}
                onChange={handleFotosChange}
              />
              <button
                type="button"
                className={styles.photosAddBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                Elegir fotos
              </button>
            </>
          )}

          {fotosError && <p className={styles.errorText} role="alert">{fotosError}</p>}
        </div>

        {error && <p className={styles.errorText} role="alert">{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? (uploadingFotos ? "Subiendo fotos..." : "Publicando...") : "Publicar tarea"}
        </button>
      </form>
    </div>
  );
}
