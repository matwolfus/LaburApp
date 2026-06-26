import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import BackButton from "../../components/BackButton";
import CategorySelector from "../../components/CategorySelector/CategorySelector";
import DateTimePicker from "../../components/DateTimeSelector/DateTimeSelector";
import DurationSelector from "../../components/DurationSelector/DurationSelector";
import PrioritySelector from "../../components/PrioritySelector/PrioritySelector";
import MapPicker from "../../components/MapPicker/MapPicker";
import { createTrabajo } from "../../services/api";
import styles from "../../styles/NuevoTrabajo.module.css";

// TODO: reemplazar por el id del usuario logueado (auth context).
// Mismo TODO que InicioContratador.jsx y Ofertas.jsx: hay que tocar los 3 lugares.
const EMPLOYER_ID = 2;

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idCategoria) {
      setError("Seleccioná una categoría.");
      return;
    }

    const presupuestoNum = Number(presupuesto);
    const programado_para =
      fecha && hora ? new Date(`${fecha}T${hora}:00-03:00`).toISOString() : undefined;

    setSubmitting(true);
    setError(null);

    try {
      await createTrabajo({
        id_contratante: EMPLOYER_ID,
        id_categoria: idCategoria,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        presupuesto: presupuestoNum > 0 ? presupuestoNum : undefined,
        programado_para,
        prioridad,
        duracion,
        direccion: direccion.trim() || undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
      });
      navigate("/InicioContratador");
    } catch (err) {
      setError(err.message || "Error al publicar la tarea");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.screen}>
      <BackButton title="Nueva Changua" />

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
            required
          />
          <CategorySelector selectedId={idCategoria} onChange={setIdCategoria} />
        </div>

        <div className={styles.card}>
          <label className={styles.label} htmlFor="descripcion">DETALLES DE LA TAREA</label>
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
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
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
          />
          <div className={styles.mapWrapper}>
            <MapPicker lat={lat} lng={lng} onChange={({ lat, lng }) => { setLat(lat); setLng(lng); }} />
          </div>
        </div>

        <div className={`${styles.card} ${styles.photosCard}`}>
          <div className={styles.photosIcon} aria-hidden="true">
            <Camera size={22} />
          </div>
          <p className={styles.photosTitle}>Agregar fotos</p>
          <p className={styles.photosSubtitle}>
            Muestra lo que necesitas para obtener mejores ofertas (próximamente)
          </p>
        </div>

        {error && <p className={styles.errorText} role="alert">{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? "Publicando..." : "Publicar tarea"}
        </button>
      </form>
    </div>
  );
}
