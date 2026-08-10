import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/editarPerfil.module.css";

export default function EditarPerfil() {

    const navigate = useNavigate();

    const [nombreCompleto, setNombreCompleto] = useState("");
    const [telefono, setTelefono] = useState("");
    const [biografiaContratante, setBiografiaContratante] = useState("");
    const [biografiaTrabajador, setBiografiaTrabajador] = useState("");
    const [idLocalidad, setIdLocalidad] = useState("");
    const [avatar, setAvatar] = useState("");

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");


    // =====================================
    // CARGAR DATOS ACTUALES DEL PERFIL
    // =====================================

    useEffect(() => {

        async function cargarPerfil() {

            try {

                const token = localStorage.getItem("token");

                if (!token) {
                    navigate("/login");
                    return;
                }

                const response = await fetch(
                    "http://localhost:3000/api/usuarios/me",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.status === 401) {

                    localStorage.removeItem("token");
                    navigate("/login");
                    return;

                }

                if (response.status === 404) {

                    setError("Usuario no encontrado");
                    return;

                }

                if (!response.ok) {

                    setError(
                        "Ocurrió un error al cargar el perfil."
                    );

                    return;
                }

                const data = await response.json();

                // La API devuelve estos nombres
                setNombreCompleto(data.nombre_completo || "");
                setTelefono(data.telefono || "");

                setBiografiaContratante(
                    data.biografia_contratante || ""
                );

                setBiografiaTrabajador(
                    data.biografia_trabajador || ""
                );

                setIdLocalidad(
                    data.id_localidad || ""
                );

                setAvatar(
                    data.url_avatar || ""
                );

            } catch (error) {

                console.error(error);

                setError(
                    "No se pudo conectar con el servidor."
                );

            } finally {

                setCargando(false);

            }
        }

        cargarPerfil();

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

            const response = await fetch(
                "http://localhost:3000/api/usuarios/me",
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

                        idLocalidad: Number(idLocalidad),

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


            if (response.status === 500) {

                setError(
                    "Ocurrió un error. Intentá nuevamente."
                );

                return;

            }


            if (!response.ok) {

                setError(
                    "Ocurrió un error. Intentá nuevamente."
                );

                return;

            }


            const data = await response.json();

            console.log("Perfil actualizado:", data);

            setMensaje(
                "Perfil actualizado correctamente."
            );

        } catch (error) {

            console.error(error);

            setError(
                "No se pudo conectar con el servidor."
            );

        } finally {

            setGuardando(false);

        }
    }


    // =====================================
    // LOADING
    // =====================================

    if (cargando) {

        return (
            <p className={styles.loading}>
                Cargando datos del perfil...
            </p>
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


                {mensaje && (
                    <p className={styles.success}>
                        {mensaje}
                    </p>
                )}


                <form onSubmit={guardarPerfil}>


                    {/* NOMBRE */}

                    <div className={styles.field}>

                        <label htmlFor="nombre">
                            Nombre completo
                        </label>

                        <input
                            id="nombre"
                            type="text"
                            value={nombreCompleto}
                            onChange={(event) =>
                                setNombreCompleto(
                                    event.target.value
                                )
                            }
                            required
                        />

                    </div>


                    {/* TELEFONO */}

                    <div className={styles.field}>

                        <label htmlFor="telefono">
                            Teléfono
                        </label>

                        <input
                            id="telefono"
                            type="text"
                            value={telefono}
                            onChange={(event) =>
                                setTelefono(
                                    event.target.value
                                )
                            }
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
                            onChange={(event) =>
                                setBiografiaContratante(
                                    event.target.value
                                )
                            }
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
                            onChange={(event) =>
                                setBiografiaTrabajador(
                                    event.target.value
                                )
                            }
                            required
                        />

                    </div>


                    {/* LOCALIDAD */}

                    <div className={styles.field}>

                        <label htmlFor="localidad">
                            ID de localidad
                        </label>

                        <input
                            id="localidad"
                            type="number"
                            value={idLocalidad}
                            onChange={(event) =>
                                setIdLocalidad(
                                    event.target.value
                                )
                            }
                            required
                        />

                    </div>


                    {/* AVATAR */}

                    <div className={styles.field}>

                        <label htmlFor="avatar">
                            URL del avatar
                        </label>

                        <input
                            id="avatar"
                            type="text"
                            value={avatar}
                            onChange={(event) =>
                                setAvatar(
                                    event.target.value
                                )
                            }
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
                            {guardando
                                ? "Guardando..."
                                : "Guardar cambios"
                            }
                        </button>

                    </div>

                </form>

            </section>

        </main>
    );
}