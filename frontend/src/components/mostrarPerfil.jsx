import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Perfil from "../components/perfil/Perfil";
import DatosPerfil from "../components/perfil/DatosPerfil";
import Biografia from "../components/perfil/Biografia";
import Categorias from "../components/perfil/Categorias";
import Resenas from "../components/perfil/Resenas";
import Botones from "../components/perfil/Botones";

import { useAuth } from "../context/AuthContext";

import "./MostrarPerfil.css";

export default function MostrarPerfil() {
    const { id } = useParams();

    const { usuario } = useAuth(); // Ajustalo a tu contexto

    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /*
        El rol que se visualiza comienza siendo el de la sesión,
        pero puede cambiar mediante el switch.
    */

    const [rolVisualizado, setRolVisualizado] = useState(usuario.rol);

    useEffect(() => {
        obtenerPerfil();
    }, [id]);

    async function obtenerPerfil() {
        try {
            setLoading(true);

            const response = await fetch(`/api/usuarios/${id}/perfil`);

            if (!response.ok) {
                throw new Error("No se pudo obtener el perfil.");
            }

            const data = await response.json();

            setPerfil(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div>Cargando perfil...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!perfil) {
        return null;
    }

    /*
        Todos los datos dependientes del rol
    */

    const datosPerfil =
        rolVisualizado === "trabajador"
            ? {
                  biografia: perfil.biografiaTrabajador,
                  rating: perfil.ratingTrabajador,
                  trabajos: perfil.trabajosRealizados,
                  cantidadResenas: perfil.cantidadResenasTrabajador,
                  categorias: perfil.categoriasTrabaja,
                  resenas: perfil.resenasTrabajador,
                  textoTrabajos: "Contratos",
              }
            : {
                  biografia: perfil.biografiaContratante,
                  rating: perfil.ratingContratante,
                  trabajos: perfil.trabajosPublicados,
                  cantidadResenas: perfil.cantidadResenasContratante,
                  categorias: perfil.categoriasContrata,
                  resenas: perfil.resenasContratante,
                  textoTrabajos: "Publicaciones",
              };

    function cambiarRol() {
        setRolVisualizado((rolActual) =>
            rolActual === "trabajador"
                ? "contratador"
                : "trabajador"
        );
    }

    return (
        <div className="mostrarPerfil">

            {/* Switch */}

            <div className="switchRol">

                <div
                    className={`slider ${
                        rolVisualizado === "trabajador"
                            ? "trabajador"
                            : "contratador"
                    }`}
                />

                <button
                    onClick={() => setRolVisualizado("trabajador")}
                >
                    Trabajador
                </button>

                <button
                    onClick={() => setRolVisualizado("contratador")}
                >
                    Contratador
                </button>

            </div>

            <Perfil
                nombre={perfil.nombreCompleto}
                avatar={perfil.avatar}
                localidad={perfil.localidad}
                verificado={perfil.verificado}
            />

            <DatosPerfil
                trabajos={datosPerfil.trabajos}
                rating={datosPerfil.rating}
                cantidadResenas={datosPerfil.cantidadResenas}
                miembroDesde={perfil.miembroDesde}
                textoTrabajos={datosPerfil.textoTrabajos}
            />

            <Biografia
                texto={datosPerfil.biografia}
            />

            <Categorias
                categorias={datosPerfil.categorias}
                rol={rolVisualizado}
            />

            <Resenas
                resenas={datosPerfil.resenas}
            />

            <Botones
                usuarioId={perfil.id}
            />

        </div>
    );
}