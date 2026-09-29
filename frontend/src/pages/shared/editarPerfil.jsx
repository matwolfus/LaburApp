import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, UserCheck, Eye } from "lucide-react";
import { uploadFotos, actualizarMisCategorias, getCategorias, BASE_URL } from "../../services/api";
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
    const [idLocalidad, setIdLocalidad] = useState("");
    const [avatar, setAvatar] = useState("");

    // =====================================
    // ESTADO FOTO DE PERFIL
    // =====================================

    const [avatarPreview, setAvatarPreview] = useState("");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState("");
    const fileInputRef = useRef(null);

    // =====================================
    // ESTADO LOCALIDADES
    // =====================================

    const [localidades, setLocalidades] = useState([]);

    // =====================================
    // ESTADO CATEGORÍAS QUE OFRECE
    // =====================================

    const [categorias, setCategorias] = useState([]);
    const [categoriaIdsSeleccionadas, setCategoriaIdsSeleccionadas] = useState([]);

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

                const [resPerfil, resLocalidades, dataCategorias] = await Promise.all([

                    fetch(`${BASE_URL}/usuarios/me`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),

                    fetch(`${BASE_URL}/localidades`),

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

                setIdLocalidad(
                    dataPerfil.idLocalidad || ""
                );

                setAvatar(
                    dataPerfil.avatar || ""
                );

                setCategoriaIdsSeleccionadas(
                    (dataPerfil.categoriasOfrecidas || []).map((c) => c.id)
                );

                // =====================================
                // LOCALIDADES
                // =====================================

                if (resLocalidades.ok) {

                    const dataLocalidades =
                        await resLocalidades.json();

                    setLocalidades(dataLocalidades);

                } else {

                    console.error(
                        "No se pudieron cargar las localidades desde la API."
                    );

                }

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
        if (file.size > 5 * 1024 * 1024) {
            setAvatarError("La imagen supera los 5 MB.");
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
        setUploadingAvatar(true);

        try {

            const { urls } = await uploadFotos([file]);
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
                            idLocalidad
                                ? Number(idLocalidad)
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

                <h1>
                    Editar perfil
                </h1>

                {error && (
                    <p className={styles.error}>
                        {error}
                    </p>
                )}

                <form onSubmit={guardarPerfil}>

                    {/* ========================= */}
                    {/* NOMBRE */}
                    {/* ========================= */}

                    <div className={styles.field}>

                        <label htmlFor="nombre">
                            Nombre completo
                        </label>

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


                    {/* ========================= */}
                    {/* TELEFONO */}
                    {/* ========================= */}

                    <div className={styles.field}>

                        <label htmlFor="telefono">
                            Teléfono
                        </label>

                        <input
                            id="telefono"
                            type="tel"
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

                        {/* Validación en tiempo real */}

                        {telefono.length > 0 && (

                            <ul
                                className={
                                    styles.passwordRequirements
                                }
                            >

                                <li
                                    className={
                                        telefonoValido
                                            ? styles.ok
                                            : styles.fail
                                    }
                                >

                                    {telefonoValido
                                        ? "✓"
                                        : "✗"}

                                    {" "}10 dígitos

                                </li>

                            </ul>

                        )}

                    </div>


                    {/* ========================= */}
                    {/* BIOGRAFIA CONTRATANTE */}
                    {/* ========================= */}

                    <div className={styles.field}>

                        <label htmlFor="biografiaContratante">
                            Biografía como contratante
                        </label>

                        <textarea
                            id="biografiaContratante"
                            value={biografiaContratante}
                            onChange={(e) =>
                                setBiografiaContratante(
                                    e.target.value
                                )
                            }
                            required
                        />

                    </div>


                    {/* ========================= */}
                    {/* BIOGRAFIA TRABAJADOR */}
                    {/* ========================= */}

                    <div className={styles.field}>

                        <label htmlFor="biografiaTrabajador">
                            Biografía como trabajador
                        </label>

                        <textarea
                            id="biografiaTrabajador"
                            value={biografiaTrabajador}
                            onChange={(e) =>
                                setBiografiaTrabajador(
                                    e.target.value
                                )
                            }
                            required
                        />

                    </div>


                    {/* ========================= */}
                    {/* LOCALIDAD */}
                    {/* ========================= */}

                    <div className={styles.field}>

                        <label htmlFor="localidad">
                            Localidad
                        </label>

                        <select
                            id="localidad"
                            value={idLocalidad}
                            onChange={(e) =>
                                setIdLocalidad(
                                    e.target.value
                                )
                            }
                            required
                        >

                            <option value="">
                                Selecciona una localidad
                            </option>

                            {localidades.map((loc) => (

                                <option
                                    key={loc.id}
                                    value={loc.id}
                                >
                                    {loc.nombre} — {loc.provincia}
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* ========================= */}
                    {/* CATEGORÍAS QUE OFRECE */}
                    {/* ========================= */}

                    <div className={styles.field}>

                        <label>
                            Categorías que ofrecés como trabajador
                        </label>

                        <p className={styles.categoriasHint}>
                            Elegí en qué categorías querés que te encuentren. Podés cambiarlas cuando quieras.
                        </p>

                        {categorias.length === 0 ? (
                            <p className={styles.categoriasHint}>
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
                                            {cat.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                    </div>


                    {/* ========================= */}
                    {/* AVATAR */}
                    {/* ========================= */}

                    <div className={styles.field}>

                        <label htmlFor="avatar">
                            Foto de perfil
                        </label>

                        <div className={styles.avatarRow}>

                            {(avatarPreview || avatar) ? (
                                <img
                                    src={avatarPreview || avatar}
                                    alt="Foto de perfil"
                                    className={styles.avatarPreview}
                                />
                            ) : (
                                <div className={styles.avatarPlaceholder} />
                            )}

                            <input
                                ref={fileInputRef}
                                id="avatar"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className={styles.avatarInputHidden}
                                onChange={handleAvatarChange}
                            />

                            <button
                                type="button"
                                className={styles.avatarBtn}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                            >
                                {uploadingAvatar
                                    ? "Subiendo..."
                                    : avatar
                                        ? "Cambiar foto"
                                        : "Elegir foto"}
                            </button>

                        </div>

                        {avatarError && (
                            <p className={styles.error}>
                                {avatarError}
                            </p>
                        )}

                    </div>


                    {/* ========================= */}
                    {/* BOTONES */}
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