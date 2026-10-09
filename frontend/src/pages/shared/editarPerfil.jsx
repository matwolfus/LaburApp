import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, UserCheck, Eye, ArrowLeft, Camera, User, Phone, Award, Briefcase } from "lucide-react";
import { uploadFotos, actualizarMisCategorias, getCategorias, BASE_URL } from "../../services/api";
import UbicacionSelector from "../../components/UbicacionSelector";
import { resizeImage } from "../../utils/resizeImage";
import styles from "../../styles/editarPerfil.module.css";

function validateTelefono(tel) {
    return /^\d{10}$/.test(tel);
}

export default function EditarPerfil() {

    const navigate = useNavigate();

    // =====================================
    // ESTADOS DEL FORMULARIO
    // =====================================

    const [nombreCompleto, setNombreCompleto] = useState("");
    const [telefono, setTelefono] = useState("");
    const [biografiaContratante, setBiografiaContratante] = useState("");
    const [biografiaTrabajador, setBiografiaTrabajador] = useState("");
    const [ubicacion, setUbicacion] = useState({ idProvincia: "", idLocalidad: "" });
    const [avatar, setAvatar] = useState("");

    // =====================================
    // ESTADO FOTO DE PERFIL
    // =====================================

    const [avatarPreview, setAvatarPreview] = useState("");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState("");
    const fileInputRef = useRef(null);

    // =====================================
    // ESTADO CATEGORÍAS QUE OFRECE
    // =====================================

    const [categorias, setCategorias] = useState([]);
    const [categoriaIdsSeleccionadas, setCategoriaIdsSeleccionadas] = useState([]);
    // Solo lectura: categorías donde ya completó trabajos como trabajador.
    const [insignias, setInsignias] = useState([]);

    // =====================================
    // ESTADOS UI
    // =====================================

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [guardado, setGuardado] = useState(false);
    const [error, setError] = useState("");

    // =====================================
    // VALIDACIÓN DEL TELÉFONO
    // =====================================

    const telefonoValido = validateTelefono(telefono);

    // =====================================
    // CARGAR DATOS INICIALES
    // =====================================

    useEffect(() => {

        async function cargarDatosIniciales() {

            try {

                const token = localStorage.getItem("token");

                if (!token) {
                    navigate("/login");
                    return;
                }

                const [resPerfil, dataCategorias] = await Promise.all([

                    fetch(`${BASE_URL}/usuarios/me`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),

                    getCategorias().catch((err) => {
                        console.error("No se pudieron cargar las categorías:", err);
                        return [];
                    })

                ]);

                setCategorias(dataCategorias);

                // =====================================
                // PERFIL
                // =====================================

                if (resPerfil.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/login");
                    return;
                }

                if (resPerfil.status === 404) {
                    setError("Usuario no encontrado.");
                    return;
                }

                if (!resPerfil.ok) {
                    setError(
                        "Ocurrió un error al cargar los datos del perfil."
                    );
                    return;
                }

                const dataPerfil = await resPerfil.json();

                // Cargar datos recibidos por la API

                setNombreCompleto(
                    dataPerfil.nombreCompleto || ""
                );

                setTelefono(
                    dataPerfil.telefono || ""
                );

                setBiografiaContratante(
                    dataPerfil.biografiaContratante || ""
                );

                setBiografiaTrabajador(
                    dataPerfil.biografiaTrabajador || ""
                );

                // La provincia no se guarda en el usuario: viene deducida
                // de su localidad (el backend la devuelve en idProvincia).
                setUbicacion({
                    idProvincia: dataPerfil.idProvincia || "",
                    idLocalidad: dataPerfil.idLocalidad || ""
                });

                setAvatar(
                    dataPerfil.avatar || ""
                );

                setCategoriaIdsSeleccionadas(
                    (dataPerfil.categoriasOfrecidas || []).map((c) => c.id)
                );

                setInsignias(dataPerfil.insignias || []);

            } catch (err) {

                console.error(
                    "Error al conectar con el servidor:",
                    err
                );

                setError(
                    "No se pudo conectar con el servidor."
                );

            } finally {

                setCargando(false);

            }

        }

        cargarDatosIniciales();

    }, [navigate]);

    // =====================================
    // FOTO DE PERFIL
    // =====================================

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    async function handleAvatarChange(event) {

        const file = event.target.files[0];
        event.target.value = "";

        if (!file) {
            return;
        }

        setAvatarError("");

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setAvatarError("Solo se permiten imágenes JPG, PNG o WebP.");
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
        setUploadingAvatar(true);

        try {

            // Se achica a 800px / JPEG 0.8 antes de subir: una foto de celular
            // pesa varios MB y el backend rechaza más de 5 MB.
            const reducida = await resizeImage(file);
            const { urls } = await uploadFotos([reducida]);
            setAvatar(urls[0]);

        } catch (err) {

            setAvatarError(
                err.message || "No se pudo subir la foto."
            );

        } finally {

            setAvatarPreview("");
            setUploadingAvatar(false);

        }

    }

    // =====================================
    // CATEGORÍAS QUE OFRECE
    // =====================================

    function toggleCategoria(idCategoria) {
        setCategoriaIdsSeleccionadas((prev) =>
            prev.includes(idCategoria)
                ? prev.filter((id) => id !== idCategoria)
                : [...prev, idCategoria]
        );
    }

    // =====================================
    // GUARDAR CAMBIOS
    // =====================================

    async function guardarPerfil(event) {

        event.preventDefault();

        setError("");

        // Validar teléfono antes de enviar
        if (!telefonoValido) {

            setError(
                "El teléfono debe tener exactamente 10 dígitos."
            );

            return;
        }

        setGuardando(true);

        try {

            const token = localStorage.getItem("token");

            const response = await fetch(
                `${BASE_URL}/usuarios/me`,
                {
                    method: "PUT",

                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        nombreCompleto,

                        telefono,

                        biografia_contratante:
                            biografiaContratante,

                        biografia_trabajador:
                            biografiaTrabajador,

                        idLocalidad:
                            ubicacion.idLocalidad
                                ? Number(ubicacion.idLocalidad)
                                : null,

                        avatar

                    })
                }
            );

            if (response.status === 401) {

                localStorage.removeItem("token");
                navigate("/login");

                return;
            }

            if (response.status === 400) {

                setError(
                    "Los datos ingresados no son válidos."
                );

                return;
            }

            if (response.status === 404) {

                setError(
                    "Usuario no encontrado."
                );

                return;
            }

            if (!response.ok) {

                setError(
                    "Ocurrió un error. Intentá nuevamente."
                );

                return;
            }

            await response.json();

            try {
                await actualizarMisCategorias(categoriaIdsSeleccionadas);
            } catch (err) {
                console.error("Error al guardar categorías:", err);
                setError(
                    "Se guardó el perfil, pero no se pudieron guardar las categorías. Probá de nuevo."
                );
                return;
            }

            setGuardado(true);

        } catch (err) {

            console.error(
                "Error al guardar perfil:",
                err
            );

            setError(
                "No se pudo conectar con el servidor."
            );

        } finally {

            setGuardando(false);

        }

    }

    // =====================================
    // PANTALLA DE CARGA
    // =====================================

    if (cargando) {

        return (
            <p className={styles.loading}>
                Cargando datos del perfil...
            </p>
        );

    }

    // =====================================
    // PANTALLA DE CONFIRMACIÓN
    // =====================================

    if (guardado) {

        return (
            <main className={styles.container}>

                <div className={styles.confirmWrapper}>

                    <div className={styles.confirmIconOuter}>
                        <div className={styles.confirmIconInner}>
                            <Check size={32} color="white" strokeWidth={3} />
                        </div>
                    </div>

                    <h1 className={styles.confirmTitle}>
                        ¡Perfil actualizado!
                    </h1>

                    <p className={styles.confirmSubtitle}>
                        Tus cambios ya están guardados
                    </p>

                    <div className={styles.confirmCard}>

                        <div className={styles.confirmRow}>
                            <UserCheck size={18} className={styles.confirmRowIcon} />
                            <span>Tu información ya está al día</span>
                        </div>

                        <div className={styles.confirmDivider} />

                        <div className={styles.confirmRow}>
                            <Eye size={18} className={styles.confirmRowIcon} />
                            <span>Los demás verán tu perfil actualizado</span>
                        </div>

                    </div>

                    <button
                        type="button"
                        className={styles.confirmPrimaryBtn}
                        onClick={() =>
                            navigate("/perfil", { replace: true })
                        }
                    >
                        Volver a mi perfil
                    </button>

                </div>

            </main>
        );

    }

    // =====================================
    // FORMULARIO
    // =====================================

    return (

        <main className={styles.container}>

            <section className={styles.formContainer}>

                <header className={styles.pageHeader}>
                    <button
                        type="button"
                        className={styles.backBtn}
                        onClick={() => navigate("/perfil")}
                        aria-label="Volver al perfil"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1>Editar perfil</h1>
                        <p className={styles.subtitle}>Mantené tu información al día</p>
                    </div>
                </header>

                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                <form onSubmit={guardarPerfil}>

                    {/* ========================= */}
                    {/* AVATAR */}
                    {/* ========================= */}

                    <div className={styles.avatarSection}>

                        <button
                            type="button"
                            className={styles.avatarButton}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            aria-label={avatar ? "Cambiar foto de perfil" : "Elegir foto de perfil"}
                        >
                            {(avatarPreview || avatar) ? (
                                <img
                                    src={avatarPreview || avatar}
                                    alt="Foto de perfil"
                                    className={styles.avatarPreview}
                                />
                            ) : (
                                <span className={styles.avatarPlaceholder}>
                                    {nombreCompleto?.charAt(0)?.toUpperCase() || <User size={40} />}
                                </span>
                            )}
                            <span className={styles.avatarBadge}>
                                <Camera size={16} />
                            </span>
                        </button>

                        <input
                            ref={fileInputRef}
                            id="avatar"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className={styles.avatarInputHidden}
                            onChange={handleAvatarChange}
                        />

                        <p className={styles.avatarHint}>
                            {uploadingAvatar
                                ? "Subiendo foto..."
                                : avatar
                                    ? "Tocá la foto para cambiarla"
                                    : "Tocá para elegir una foto"}
                        </p>

                        {avatarError && (
                            <p className={styles.avatarError} role="alert">
                                {avatarError}
                            </p>
                        )}

                    </div>


                    {/* ========================= */}
                    {/* DATOS PERSONALES */}
                    {/* ========================= */}

                    <div className={styles.card}>

                        <h2 className={styles.cardTitle}>Datos personales</h2>

                        <div className={styles.field}>

                            <label htmlFor="nombre">
                                Nombre completo
                            </label>

                            <div className={styles.inputWrap}>
                                <User size={18} className={styles.inputIcon} />
                                <input
                                    id="nombre"
                                    type="text"
                                    value={nombreCompleto}
                                    onChange={(e) =>
                                        setNombreCompleto(e.target.value)
                                    }
                                    required
                                />
                            </div>

                        </div>

                        <div className={styles.field}>

                            <label htmlFor="telefono">
                                Teléfono
                            </label>

                            <div className={styles.inputWrap}>
                                <Phone size={18} className={styles.inputIcon} />
                                <input
                                    id="telefono"
                                    type="tel"
                                    inputMode="numeric"
                                    value={telefono}
                                    onChange={(e) => {

                                        const valor =
                                            e.target.value;

                                        // Solo números
                                        // Máximo 10 dígitos
                                        if (/^\d{0,10}$/.test(valor)) {

                                            setTelefono(valor);

                                        }

                                    }}
                                    maxLength={10}
                                    required
                                />
                            </div>

                            {/* Validación en tiempo real */}

                            {telefono.length > 0 && (

                                <p
                                    className={
                                        telefonoValido
                                            ? `${styles.hint} ${styles.ok}`
                                            : `${styles.hint} ${styles.fail}`
                                    }
                                >
                                    {telefonoValido ? "✓" : "✗"} 10 dígitos
                                </p>

                            )}

                        </div>

                        <div className={styles.field}>
                            <UbicacionSelector
                                value={ubicacion}
                                onChange={setUbicacion}
                                idPrefix="perfil"
                            />
                        </div>

                    </div>


                    {/* ========================= */}
                    {/* SOBRE VOS */}
                    {/* ========================= */}

                    <div className={styles.card}>

                        <h2 className={styles.cardTitle}>Sobre vos</h2>

                        <p className={styles.categoriasHint}>
                            Opcional. Contale a los demás un poco sobre vos.
                        </p>

                        <div className={styles.field}>

                            <label htmlFor="biografiaContratante">
                                Como contratante
                            </label>

                            <textarea
                                id="biografiaContratante"
                                placeholder="Contá qué tipo de trabajos solés publicar..."
                                value={biografiaContratante}
                                onChange={(e) =>
                                    setBiografiaContratante(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div className={styles.field}>

                            <label htmlFor="biografiaTrabajador">
                                Como trabajador
                            </label>

                            <textarea
                                id="biografiaTrabajador"
                                placeholder="Contá tu experiencia y en qué sos bueno..."
                                value={biografiaTrabajador}
                                onChange={(e) =>
                                    setBiografiaTrabajador(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                    </div>


                    {/* ========================= */}
                    {/* INSIGNIAS (solo lectura) */}
                    {/* ========================= */}

                    <div className={styles.card}>

                        <h2 className={styles.cardTitle}>
                            <Award size={18} className={styles.cardTitleIcon} />
                            Insignias
                        </h2>

                        <p className={styles.categoriasHint}>
                            Categorías en las que completaste trabajos.
                        </p>

                        {insignias.length === 0 ? (
                            <p className={styles.emptyState}>
                                Todavía no completaste trabajos.
                            </p>
                        ) : (
                            <div className={styles.categoriasGrid}>
                                {insignias.map((ins) => (
                                    <span
                                        key={ins.id}
                                        className={`${styles.categoriaChip} ${styles.insigniaChip}`}
                                    >
                                        🏅 {ins.nombre}
                                    </span>
                                ))}
                            </div>
                        )}

                    </div>


                    {/* ========================= */}
                    {/* TRABAJOS QUE ESTÁ DISPUESTO A HACER */}
                    {/* ========================= */}

                    <div className={styles.card}>

                        <h2 className={styles.cardTitle}>
                            <Briefcase size={18} className={styles.cardTitleIcon} />
                            Trabajos que estás dispuesto a hacer
                        </h2>

                        <p className={styles.categoriasHint}>
                            Elegí en qué categorías querés que te encuentren. Podés cambiarlas cuando quieras.
                        </p>

                        {categorias.length === 0 ? (
                            <p className={styles.emptyState}>
                                No hay categorías disponibles.
                            </p>
                        ) : (
                            <div className={styles.categoriasGrid}>
                                {categorias.map((cat) => {
                                    const activa = categoriaIdsSeleccionadas.includes(cat.id);
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            className={
                                                activa
                                                    ? `${styles.categoriaChip} ${styles.categoriaChipActive}`
                                                    : styles.categoriaChip
                                            }
                                            aria-pressed={activa}
                                            onClick={() => toggleCategoria(cat.id)}
                                        >
                                            {activa && <Check size={14} strokeWidth={3} />}
                                            {cat.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                    </div>


                    {/* ========================= */}
                    {/* BOTONES (barra fija abajo) */}
                    {/* ========================= */}

                    <div className={styles.buttons}>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/perfil")
                            }
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={
                                guardando ||
                                !telefonoValido ||
                                uploadingAvatar
                            }
                        >
                            {guardando
                                ? "Guardando..."
                                : "Guardar cambios"}
                        </button>

                    </div>

                </form>

            </section>

        </main>

    );

}
