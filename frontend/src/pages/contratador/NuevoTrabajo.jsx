import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bell, FileEdit } from "lucide-react";
import BackButton from "../../components/BackButton";
import CategorySelector from "../../components/CategorySelector/CategorySelector";
import DateTimePicker from "../../components/DateTimeSelector/DateTimeSelector";
import DurationSelector from "../../components/DurationSelector/DurationSelector";
import PrioritySelector from "../../components/PrioritySelector/PrioritySelector";
import MapPicker from "../../components/MapPicker/MapPicker";
import UbicacionSelector from "../../components/UbicacionSelector";
import PantallaGuardado from "../../components/PantallaGuardado";
import { createTrabajo, updateTrabajo, getTrabajoById, uploadFotos } from "../../services/api";
import { resizeImage } from "../../utils/resizeImage";
import { fechaHoraYaPaso, hoyLocal } from "../../utils/fechas";
import FotosTrabajoEditor from "./nuevoTrabajo/FotosTrabajoEditor";
import useUbicacionTrabajo from "./nuevoTrabajo/useUbicacionTrabajo";
import { limpiarEntradaPresupuesto, parsePresupuesto, presupuestoParaInput } from "./nuevoTrabajo/presupuesto";
import styles from "../../styles/NuevoTrabajo.module.css";

// "Nuevo trabajo" y "Editar trabajo" (con :jobId). La ubicación (dirección +
// mapa + localidad) y las fotos viven en la carpeta nuevoTrabajo/.
export default function NuevoTrabajo() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const isEdit = Boolean(jobId);

  const [titulo, setTitulo] = useState("");
  const [idCategoria, setIdCategoria] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [prioridad, setPrioridad] = useState("normal");
  const [duracion, setDuracion] = useState(60);
  const [presupuesto, setPresupuesto] = useState("");
  const ubic = useUbicacionTrabajo();

  // Fotos que el trabajo ya tenía (solo en edición) y nuevas sin subir.
  const [fotosExistentes, setFotosExistentes] = useState([]);
  const [fotosNuevas, setFotosNuevas] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const [error, setError] = useState(null);

  const [loadingJob, setLoadingJob] = useState(isEdit);
  const [loadJobError, setLoadJobError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    getTrabajoById(jobId)
      .then((job) => {
        setTitulo(job.title ?? "");
        setIdCategoria(job.id_categoria ?? null);
        setDescripcion(job.description ?? "");
        if (job.scheduled_at) {
          const [fechaPart, horaPart] = job.scheduled_at.split("T");
          setFecha(fechaPart ?? "");
          setHora(horaPart ? horaPart.slice(0, 5) : "");
        }
        setPrioridad(job.priority ?? "normal");
        setDuracion(job.duration != null ? Number(job.duration) : null);
        setPresupuesto(presupuestoParaInput(job.budget));
        ubic.cargar(job);
        setFotosExistentes((job.images ?? []).map((img) => ({ id: img.id, url: img.url })));
      })
      .catch((err) => setLoadJobError(err.message || "Error al cargar el trabajo"))
      .finally(() => setLoadingJob(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // Devuelve el mensaje de error del form, o null si está todo bien.
  const validar = () => {
    if (!idCategoria) return "Seleccioná una categoría.";
    if (!titulo.trim()) return "Ingresá un título.";
    if (!fecha) return "Seleccioná una fecha.";
    if (!isEdit && fechaHoraYaPaso(fecha, hora)) return "La fecha y hora ya pasaron. Elegí una fecha futura.";
    const monto = parsePresupuesto(presupuesto);
    if (!presupuesto || isNaN(monto) || monto <= 0) return "Ingresá un presupuesto válido.";
    if (!ubic.direccion.trim()) return "Ingresá una ubicación.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorValidacion = validar();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let nuevasUrls = [];
      if (fotosNuevas.length > 0) {
        setSubiendoFotos(true);
        // Se achican a 800px / JPEG antes de subir: una foto de celular
        // pesa varios MB y el backend rechaza más de 5 MB.
        const reducidas = await Promise.all(fotosNuevas.map((f) => resizeImage(f.file)));
        nuevasUrls = (await uploadFotos(reducidas)).urls;
      }

      const datos = {
        id_categoria: idCategoria,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        presupuesto: parsePresupuesto(presupuesto),
        // Sin offset a propósito: la columna es "timestamp without time zone"
        // y toda la app asume hora argentina.
        programado_para: `${fecha}T${hora || "00:00"}:00`,
        prioridad,
        duracion,
        direccion: ubic.direccion.trim(),
        id_localidad: ubic.ubicacion.idLocalidad ? Number(ubic.ubicacion.idLocalidad) : undefined,
        lat: ubic.lat ?? undefined,
        lng: ubic.lng ?? undefined,
      };

      if (isEdit) {
        // En edición siempre se manda la lista final completa de fotos (puede quedar vacía).
        const imagenes = [...fotosExistentes.map((f) => f.url), ...nuevasUrls];
        await updateTrabajo(jobId, { ...datos, imagenes });
        setSaved(true);
      } else {
        await createTrabajo({ ...datos, imagenes: nuevasUrls.length > 0 ? nuevasUrls : undefined });
        navigate("/inicio");
      }
    } catch (err) {
      setError(err.message || (isEdit ? "Error al guardar los cambios" : "Error al publicar el trabajo"));
    } finally {
      setSubmitting(false);
      setSubiendoFotos(false);
    }
  };

  if (saved) {
    return (
      <div className={styles.screen}>
        <PantallaGuardado
          titulo="¡Cambios guardados!"
          subtitulo="Tu publicación fue actualizada"
          filas={[
            { icono: <Bell size={18} />, texto: "Los postulantes verán la información actualizada" },
            { icono: <FileEdit size={18} />, texto: "Tu publicación ya está al día" },
          ]}
          nota="Podés seguir editando cuando quieras"
          primario={{ label: "Volver al inicio", onClick: () => navigate("/inicio", { replace: true }) }}
          secundario={{ label: "Ver postulantes", onClick: () => navigate(`/ofertas/${jobId}/postulantes`, { replace: true }) }}
        />
      </div>
    );
  }

  if (loadingJob || loadJobError) {
    return (
      <div className={styles.screen}>
        <BackButton title="Editar trabajo" />
        {loadJobError
          ? <p className={styles.errorText} style={{ padding: "20px" }} role="alert">{loadJobError}</p>
          : <p className={styles.subheading} style={{ padding: "20px" }}>Cargando...</p>}
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <BackButton title={isEdit ? "Editar trabajo" : "Nuevo trabajo"} />

      <form className={styles.content} onSubmit={handleSubmit}>
        <div className={styles.intro}>
          <h1 className={styles.heading}>{isEdit ? "Editar trabajo" : "Nuevo trabajo"}</h1>
          <p className={styles.subheading}>
            {isEdit ? "Actualizá los datos de tu publicación." : "Describí lo que necesitás y encontrá la ayuda ideal."}
          </p>
        </div>

        <div className={styles.card}>
          <label className={styles.label} htmlFor="titulo">¿QUÉ NECESITÁS?</label>
          <input
            id="titulo"
            className={styles.textInput}
            maxLength={100}
            type="text"
            placeholder="Ej: Paseador de perros para fin de semana"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <CategorySelector selectedId={idCategoria} onChange={setIdCategoria} />
        </div>

        <div className={styles.card}>
          <label className={styles.label} htmlFor="descripcion">
            DETALLES DEL TRABAJO <span className={styles.optional}>(Opcional)</span>
          </label>
          <textarea
            id="descripcion"
            className={styles.textarea}
            maxLength={2000}
            placeholder="Contanos qué necesitás exactamente..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
          />
        </div>

        <DateTimePicker fecha={fecha} hora={hora} minFecha={isEdit ? undefined : hoyLocal()} onFechaChange={setFecha} onHoraChange={setHora} />

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
              onChange={(e) => setPresupuesto(limpiarEntradaPresupuesto(e.target.value))}
            />
          </div>

          <UbicacionSelector
            value={ubic.ubicacion}
            onChange={ubic.setUbicacion}
            labelClassName={styles.label}
            labels={{ provincia: "PROVINCIA", localidad: "LOCALIDAD" }}
            idPrefix="trabajo"
          />

          <label className={styles.label} htmlFor="direccion">UBICACIÓN</label>
          <input
            id="direccion"
            className={styles.textInput}
            maxLength={255}
            type="text"
            placeholder="Ej: Potosí 123, Buenos Aires"
            value={ubic.direccion}
            onChange={(e) => ubic.setDireccion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                ubic.buscarDireccion();
              }
            }}
            disabled={ubic.buscando}
          />
          {ubic.errorBusqueda && <p className={styles.errorText} role="alert">{ubic.errorBusqueda}</p>}
          {ubic.aviso && <p className={styles.warningText} role="status">{ubic.aviso}</p>}
          <div className={styles.mapWrapper}>
            <MapPicker lat={ubic.lat} lng={ubic.lng} onChange={ubic.moverMapa} />
          </div>
        </div>

        <FotosTrabajoEditor
          existentes={fotosExistentes}
          nuevas={fotosNuevas}
          onExistentesChange={setFotosExistentes}
          onNuevasChange={setFotosNuevas}
        />

        {error && <p className={styles.errorText} role="alert">{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting
            ? (subiendoFotos ? "Subiendo fotos..." : (isEdit ? "Guardando..." : "Publicando..."))
            : (isEdit ? "Guardar cambios" : "Publicar trabajo")}
        </button>
      </form>
    </div>
  );
}
