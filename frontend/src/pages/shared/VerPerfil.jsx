import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { getPerfil } from "../../services/api";

import VerPerfilHeader from "../../components/VerPerfilHeader";
import VerPerfilStats from "../../components/VerPerfilStats";
import VerPerfilBio from "../../components/VerPerfilBio";
import VerPerfilCategorias from "../../components/VerPerfilCategorias";
import VerPerfilResenas from "../../components/VerPerfilResenas";

import styles from "../../styles/Perfil.module.css";


export default function VerPerfil() {

    const { id } = useParams();

    const [perfil, setPerfil] = useState(null);
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


    const datos = useMemo(() => {

        if (!perfil || !modo) {
            return null;
        }

        const esTrabajador = modo === "trabajador";

        return {

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
                ? perfil.categoriasTrabaja
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

                <VerPerfilHeader
                    perfil={perfil}
                    modo={modo}
                    setModo={setModo}
                />

                <VerPerfilStats
                    datos={datos}
                    miembroDesde={perfil.miembroDesde}
                />

                <VerPerfilBio
                    biografia={datos.biografia}
                />

                <VerPerfilCategorias
                    categorias={datos.categorias}
                />

                <VerPerfilResenas
                    resenas={datos.resenas}
                    cantidad={datos.cantidadResenas}
                />

            </div>

        </main>

    );
}