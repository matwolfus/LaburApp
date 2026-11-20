import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCheck, Eye, ArrowLeft, User, Phone } from "lucide-react";
import { actualizarMisCategorias, getCategorias, getMiUsuario, actualizarPerfil } from "../../services/api";
import UbicacionSelector from "../../components/UbicacionSelector";
import PantallaGuardado from "../../components/PantallaGuardado";
import FotoPerfilEditor from "./editarPerfil/FotoPerfilEditor";
import { CategoriasOfrecidas, InsigniasPerfil } from "./editarPerfil/CategoriasPerfil";
import styles from "../../styles/editarPerfil.module.css";

const telefonoValido = (tel) => /^\d{10}$/.test(tel);

// "Editar perfil": carga los datos del usuario, los muestra en el form y los
// guarda (perfil + categorías que ofrece). La foto y las categorías son
// componentes aparte (carpeta editarPerfil/).
export default function EditarPerfil() {
    const navigate = useNavigate();

    // Formulario
    const [nombreCompleto, setNombreCompleto] = useState("");
    const [telefono, setTelefono] = useState("");
    const [biografiaContratante, setBiografiaContratante] = useState("");
    const [biografiaTrabajador, setBiografiaTrabajador] = useState("");
    const [ubicacion, setUbicacion] = useState({ idProvincia: "", idLocalidad: "" });
    const [avatar, setAvatar] = useState("");
    const [subiendoFoto, setSubiendoFoto] = useState(false);

    // Categorías
    const [categorias, setCategorias] = useState([]);
    const [categoriaIdsSeleccionadas, setCategoriaIdsSeleccionadas] = useState([]);
    const [insignias, setInsignias] = useState([]); // solo lectura

    // Pantalla
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [guardado, setGuardado] = useState(false);
    const [error, setError] = useState("");

    const telefonoOk = telefonoValido(telefono);

    useEffect(() => {
        async function cargarDatosIniciales() {
            try {
                if (!localStorage.getItem("token")) {
                    navigate("/login");
                    return;
                }

                // Un 401 (sesión vencida) lo maneja api.js: borra la sesión y
                // manda al login. Acá solo queda mostrar el resto de los errores.
                const [perfil, dataCategorias] = await Promise.all([
                    getMiUsuario(),
                    getCategorias().catch((err) => {
                        console.error("No se pudieron cargar las categorías:", err);
                        return [];
                    }),
                ]);

                setCategorias(dataCategorias);
                setNombreCompleto(perfil.nombreCompleto || "");
                // Solo dígitos: hay teléfonos viejos guardados con guiones o espacios
                // ("11-2345-6789"). Así se pueden volver a guardar sin retocarlos.
                setTelefono((perfil.telefono || "").replace(/\D/g, ""));
                setBiografiaContratante(perfil.biografiaContratante || "");
                setBiografiaTrabajador(perfil.biografiaTrabajador || "");
                // La provincia no se guarda en el usuario: viene deducida de su localidad.
                setUbicacion({ idProvincia: perfil.idProvincia || "", idLocalidad: perfil.idLocalidad || "" });
                setAvatar(perfil.avatar || "");
                setCategoriaIdsSeleccionadas((perfil.categoriasOfrecidas || []).map((c) => c.id));
                setInsignias(perfil.insignias || []);
            } catch (err) {
                console.error("Error al cargar el perfil:", err);
                setError(err.status === 404
                    ? "Usuario no encontrado."
                    : err.message || "Ocurrió un error al cargar los datos del perfil.");
            } finally {
                setCargando(false);
            }
        }

        cargarDatosIniciales();
    }, [navigate]);

    function toggleCategoria(idCategoria) {
        setCategoriaIdsSeleccionadas((prev) =>
            prev.includes(idCategoria) ? prev.filter((id) => id !== idCategoria) : [...prev, idCategoria]
        );
    }

    async function guardarPerfil(event) {
        event.preventDefault();
        setError("");

        if (!telefonoOk) {
            setError("El teléfono debe tener exactamente 10 dígitos.");
            return;
        }

        setGuardando(true);
        try {
            await actualizarPerfil({
                nombreCompleto,
                telefono,
                biografia_contratante: biografiaContratante,
                biografia_trabajador: biografiaTrabajador,
                idLocalidad: ubicacion.idLocalidad ? Number(ubicacion.idLocalidad) : null,
                avatar,
            });

            try {
                await actualizarMisCategorias(categoriaIdsSeleccionadas);
            } catch (err) {
                console.error("Error al guardar categorías:", err);
                setError("Se guardó el perfil, pero no se pudieron guardar las categorías. Probá de nuevo.");
                return;
            }

            setGuardado(true);
        } catch (err) {
            console.error("Error al guardar perfil:", err);
            // El backend manda el motivo en el mensaje (ej. foto inválida).
            setError(err.message || "Ocurrió un error. Intentá nuevamente.");
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return <p className={styles.loading}>Cargando datos del perfil...</p>;
    }

    if (guardado) {
        return (
            <main className={styles.container}>
                <PantallaGuardado
                    titulo="¡Perfil actualizado!"
                    subtitulo="Tus cambios ya están guardados"
                    filas={[
                        { icono: <UserCheck size={18} />, texto: "Tu información ya está al día" },
                        { icono: <Eye size={18} />, texto: "Los demás verán tu perfil actualizado" },
                    ]}
                    primario={{ label: "Volver a mi perfil", onClick: () => navigate("/perfil", { replace: true }) }}
                />
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <section className={styles.formContainer}>

                <header className={styles.pageHeader}>
                    <button type="button" className={styles.backBtn} onClick={() => navigate("/perfil")} aria-label="Volver al perfil">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1>Editar perfil</h1>
                        <p className={styles.subtitle}>Mantené tu información al día</p>
                    </div>
                </header>

                {error && <p className={styles.error} role="alert">{error}</p>}

                <form onSubmit={guardarPerfil}>

                    <FotoPerfilEditor
                        avatar={avatar}
                        nombre={nombreCompleto}
                        onChange={setAvatar}
                        onSubiendoChange={setSubiendoFoto}
                    />

                    {/* DATOS PERSONALES */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Datos personales</h2>

                        <div className={styles.field}>
                            <label htmlFor="nombre">Nombre completo</label>
                            <div className={styles.inputWrap}>
                                <User size={18} className={styles.inputIcon} />
                                <input
                                    id="nombre"
                                    maxLength={120}
                                    type="text"
                                    value={nombreCompleto}
                                    onChange={(e) => setNombreCompleto(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="telefono">Teléfono</label>
                            <div className={styles.inputWrap}>
                                <Phone size={18} className={styles.inputIcon} />
                                <input
                                    id="telefono"
                                    type="tel"
                                    inputMode="numeric"
                                    value={telefono}
                                    // Solo números, hasta 10 dígitos.
                                    onChange={(e) => { if (/^\d{0,10}$/.test(e.target.value)) setTelefono(e.target.value); }}
                                    maxLength={10}
                                    required
                                />
                            </div>
                            {telefono.length > 0 && (
                                <p className={`${styles.hint} ${telefonoOk ? styles.ok : styles.fail}`}>
                                    {telefonoOk ? "✓" : "✗"} 10 dígitos
                                </p>
                            )}
                        </div>

                        <div className={styles.field}>
                            <UbicacionSelector value={ubicacion} onChange={setUbicacion} idPrefix="perfil" />
                        </div>
                    </div>

                    {/* SOBRE VOS */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Sobre vos</h2>
                        <p className={styles.categoriasHint}>Opcional. Contale a los demás un poco sobre vos.</p>

                        <div className={styles.field}>
                            <label htmlFor="biografiaContratante">Como contratador</label>
                            <textarea
                                id="biografiaContratante"
                                maxLength={1000}
                                placeholder="Contá qué tipo de trabajos solés publicar..."
                                value={biografiaContratante}
                                onChange={(e) => setBiografiaContratante(e.target.value)}
                            />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="biografiaTrabajador">Como trabajador</label>
                            <textarea
                                id="biografiaTrabajador"
                                maxLength={1000}
                                placeholder="Contá tu experiencia y en qué sos bueno..."
                                value={biografiaTrabajador}
                                onChange={(e) => setBiografiaTrabajador(e.target.value)}
                            />
                        </div>
                    </div>

                    <InsigniasPerfil insignias={insignias} />

                    <CategoriasOfrecidas
                        categorias={categorias}
                        seleccionadas={categoriaIdsSeleccionadas}
                        onToggle={toggleCategoria}
                    />

                    {/* BOTONES (barra fija abajo) */}
                    <div className={styles.buttons}>
                        <button type="button" onClick={() => navigate("/perfil")}>Cancelar</button>
                        <button type="submit" disabled={guardando || !telefonoOk || subiendoFoto}>
                            {guardando ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>

                </form>
            </section>
        </main>
    );
}
