import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";

import { getPerfil, getConversaciones } from "../../services/api";

import PerfilHeader from "../../components/PerfilHeader";
import PerfilStats from "../../components/PerfilStats";
import PerfilBio from "../../components/PerfilBio";
import PerfilCategorias from "../../components/PerfilCategorias";
import PerfilResenas from "../../components/PerfilResenas";

import styles from "../../styles/Perfil.module.css";
import verPerfilStyles from "../../styles/VerPerfil.module.css";


export default function VerPerfil() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [perfil, setPerfil] = useState(null);
    // Solo se puede chatear si ya existe una conversación entre el usuario
    // logueado y este perfil (el chat vive atado a una postulación, no a un
    // par de usuarios en general). Si no hay ninguna, el botón "Contactar"
    // directamente no se muestra. Si hay varias, se usa la más reciente.
    const [idChatConEstePerfil, setIdChatConEstePerfil] = useState(null);
    // Acá el modo es SOLO local (no pasa por useAuth/switchModo): es la vista
    // de un perfil ajeno, tocar el toggle solo cambia qué se está mirando,
    // nunca el modo activo propio.
    const [modo, setModo] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        async function cargarPerfil() {

            try {

                setLoading(true);
                setError(null);

                const perfilCompleto = await getPerfil(id);

                setPerfil(perfilCompleto);

                // El rol inicial es el último rol utilizado
                setModo(perfilCompleto.ultimoRol);

            } catch (error) {

                console.error(
                    "Error al cargar el perfil:",
                    error
                );

                setError(
                    error.message ||
                    "No se pudo cargar el perfil."
                );

            } finally {

                setLoading(false);

            }

        }

        if (id) {
            cargarPerfil();
        }

    }, [id]);

    useEffect(() => {
        if (!id) return;

        getConversaciones()
            .then((conversaciones) => {
                const conv = conversaciones.find((c) => String(c.otro_id) === String(id));
                setIdChatConEstePerfil(conv?.id_postulacion ?? null);
            })
            .catch((err) => console.error("Error al consultar conversaciones:", err));

    }, [id]);


    const datos = useMemo(() => {

        if (!perfil || !modo) {
            return null;
        }

        const esTrabajador = modo === "trabajador";

        return {

            esTrabajador,

            rating: esTrabajador
                ? perfil.ratingTrabajador
                : perfil.ratingContratante,

            cantidadTrabajos: esTrabajador
                ? perfil.trabajosRealizados
                : perfil.trabajosPublicados,

            cantidadResenas: esTrabajador
                ? perfil.cantidadResenasTrabajador
                : perfil.cantidadResenasContratante,

            biografia: esTrabajador
                ? perfil.biografiaTrabajador
                : perfil.biografiaContratante,

            categorias: esTrabajador
                ? (perfil.insignias || []).map((c) => c.nombre)
                : perfil.categoriasContrata,

            resenas: esTrabajador
                ? perfil.resenasTrabajador
                : perfil.resenasContratante

        };

    }, [perfil, modo]);


    // =========================
    // CARGANDO
    // =========================

    if (loading) {

        return (
            <main className={styles.page}>
                <div className={styles.container}>

                    <div className={styles.estado}>
                        <p>Cargando perfil...</p>
                    </div>

                </div>
            </main>
        );

    }


    // =========================
    // ERROR
    // =========================

    if (error) {

        return (
            <main className={styles.page}>
                <div className={styles.container}>

                    <div className={styles.estado}>

                        <h2>
                            No pudimos cargar este perfil
                        </h2>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>
            </main>
        );

    }


    // =========================
    // SIN PERFIL
    // =========================

    if (!perfil || !datos) {

        return (
            <main className={styles.page}>
                <div className={styles.container}>

                    <div className={styles.estado}>
                        <p>Usuario no encontrado.</p>
                    </div>

                </div>
            </main>
        );

    }


    // =========================
    // PERFIL
    // =========================

    return (

        <main className={styles.page}>

            <div className={styles.container}>

                <button
                    type="button"
                    className={verPerfilStyles.volverBtn}
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={16} />
                    Volver
                </button>

                <PerfilHeader
                    perfil={perfil}
                    modo={modo}
                    own={false}
                />

                {idChatConEstePerfil && (
                    <button
                        className={styles.contactarBtn}
                        onClick={() => navigate(`/chats/${idChatConEstePerfil}`)}
                    >
                        <MessageSquare size={16} />
                        Contactar
                    </button>
                )}

                <PerfilStats
                    datos={datos}
                    miembroDesde={perfil.miembroDesde}
                />

                <PerfilBio
                    biografia={datos.biografia}
                />

                {datos.esTrabajador && (
                    <PerfilCategorias
                        categorias={(perfil.categoriasOfrecidas || []).map((c) => c.nombre)}
                        own={false}
                        titulo="Categorías que ofrece"
                        vacioOther="Este usuario todavía no eligió categorías."
                    />
                )}

                <PerfilCategorias
                    categorias={datos.categorias}
                    own={false}
                    insignias={datos.esTrabajador}
                    titulo={datos.esTrabajador ? "Insignias" : "Categorías que contrató"}
                    vacioOther={
                        datos.esTrabajador
                            ? "Todavía no completó trabajos."
                            : "Todavía no contrató en ninguna categoría."
                    }
                />

                <PerfilResenas
                    resenas={datos.resenas}
                    cantidad={datos.cantidadResenas}
                />

            </div>

        </main>

    );
}
