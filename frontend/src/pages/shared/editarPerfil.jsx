import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/editarPerfil.module.css";

export default function EditarPerfil() {

    const navigate = useNavigate();

    // Estados del formulario
    const [nombreCompleto, setNombreCompleto] = useState("");
    const [telefono, setTelefono] = useState("");
    const [biografiaContratante, setBiografiaContratante] = useState("");
    const [biografiaTrabajador, setBiografiaTrabajador] = useState("");
    const [idLocalidad, setIdLocalidad] = useState("");
    const [avatar, setAvatar] = useState("");

    // Estado para guardar el listado de localidades
    const [localidades, setLocalidades] = useState([]);

    // Estados de control de la UI
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");


    // =====================================
    // CARGAR DATOS INICIALES (PERFIL + LOCALIDADES)
    // =====================================

    useEffect(() => {

        async function cargarDatosIniciales() {

            try {

                const token = localStorage.getItem("token");

                if (!token) {
                    navigate("/login");
                    return;
                }

                // Peticiones en paralelo: Perfil (Autenticado) y Localidades (Público)
                const [resPerfil, resLocalidades] = await Promise.all([
                    fetch("http://localhost:3000/api/usuarios/me", {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),
                    fetch("http://localhost:3000/api/localidades")
                ]);

                // 1. Manejo del Endpoint de Perfil
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
                    setError("Ocurrió un error al cargar los datos del perfil.");
                    return;
                }

                // Cargar datos del usuario
                const dataPerfil = await resPerfil.json();
                setNombreCompleto(dataPerfil.nombre_completo || "");
                setTelefono(dataPerfil.telefono || "");
                setBiografiaContratante(dataPerfil.biografia_contratante || "");
                setBiografiaTrabajador(dataPerfil.biografia_trabajador || "");
                setIdLocalidad(dataPerfil.id_localidad || "");
                setAvatar(dataPerfil.url_avatar || "");

                // 2. Manejo del Endpoint de Localidades (Público, GET /api/localidades)
                if (resLocalidades.ok) {
                    const dataLocalidades = await resLocalidades.json();
                    setLocalidades(dataLocalidades);
                } else {
                    console.error("No se pudieron cargar las localidades desde la API.");
                }

            } catch (err) {

                console.error("Error al conectar con el servidor:", err);
                setError("No se pudo conectar con el servidor.");

            } finally {

                setCargando(false);

            }
        }

        cargarDatosIniciales();

    }, [navigate]);


    // =====================================
    // GUARDAR CAMBIOS
    // =====================================

    async function guardarPerfil(event) {

        event.preventDefault();

        setError("");
        setMensaje("");
        setGuardando(true);

        try {

            const token = localStorage.getItem("token");

            const response = await fetch("http://localhost:3000/api/usuarios/me", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombreCompleto,
                    telefono,
                    biografia_contratante: biografiaContratante,
                    biografia_trabajador: biografiaTrabajador,
                    idLocalidad: idLocalidad ? Number(idLocalidad) : null,
                    avatar
                })
            });

            if (response.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }

            if (response.status === 400) {
                setError("Los datos ingresados no son válidos.");
                return;
            }

            if (response.status === 404) {
                setError("Usuario no encontrado.");
                return;
            }

            if (!response.ok) {
                setError("Ocurrió un error. Intentá nuevamente.");
                return;
            }

            const data = await response.json();
            console.log("Perfil actualizado exitosamente:", data);

            setMensaje("Perfil actualizado correctamente.");

        } catch (err) {

            console.error("Error al guardar perfil:", err);
            setError("No se pudo conectar con el servidor.");

        } finally {

            setGuardando(false);

        }
    }


    // =====================================
    // RENDER: PANTALLA DE CARGA
    // =====================================

    if (cargando) {
        return (
            <p className={styles.loading}>
                Cargando datos del perfil...
            </p>
        );
    }


    // =====================================
    // RENDER: FORMULARIO
    // =====================================

    return (
        <main className={styles.container}>

            <section className={styles.formContainer}>

                <h1>Editar perfil</h1>

                {error && <p className={styles.error}>{error}</p>}
                {mensaje && <p className={styles.success}>{mensaje}</p>}

                <form onSubmit={guardarPerfil}>

                    {/* NOMBRE */}
                    <div className={styles.field}>
                        <label htmlFor="nombre">Nombre completo</label>
                        <input
                            id="nombre"
                            type="text"
                            value={nombreCompleto}
                            onChange={(e) => setNombreCompleto(e.target.value)}
                            required
                        />
                    </div>

                    {/* TELEFONO */}
                    <div className={styles.field}>
                        <label htmlFor="telefono">Teléfono</label>
                        <input
                            id="telefono"
                            type="text"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                            required
                        />
                    </div>

                    {/* BIOGRAFIA CONTRATANTE */}
                    <div className={styles.field}>
                        <label htmlFor="biografiaContratante">
                            Biografía como contratante
                        </label>
                        <textarea
                            id="biografiaContratante"
                            value={biografiaContratante}
                            onChange={(e) => setBiografiaContratante(e.target.value)}
                            required
                        />
                    </div>

                    {/* BIOGRAFIA TRABAJADOR */}
                    <div className={styles.field}>
                        <label htmlFor="biografiaTrabajador">
                            Biografía como trabajador
                        </label>
                        <textarea
                            id="biografiaTrabajador"
                            value={biografiaTrabajador}
                            onChange={(e) => setBiografiaTrabajador(e.target.value)}
                            required
                        />
                    </div>

                    {/* SELECTOR DE LOCALIDADES */}
                    <div className={styles.field}>
                        <label htmlFor="localidad">Localidad</label>
                        <select
                            id="localidad"
                            value={idLocalidad}
                            onChange={(e) => setIdLocalidad(e.target.value)}
                            required
                        >
                            <option value="">Selecciona una localidad</option>
                            {localidades.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.nombre} — {loc.provincia}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* URL DE AVATAR */}
                    <div className={styles.field}>
                        <label htmlFor="avatar">URL del avatar</label>
                        <input
                            id="avatar"
                            type="text"
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                            required
                        />
                    </div>

                    {/* BOTONES */}
                    <div className={styles.buttons}>
                        <button
                            type="button"
                            onClick={() => navigate("/perfil")}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={guardando}
                        >
                            {guardando ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>

                </form>

            </section>

        </main>
    );
}