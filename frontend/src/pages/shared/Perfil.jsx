import { useEffect, useMemo, useState } from "react";
import { getMiUsuario, logout } from "../../services/api";
import styles from '../../styles/Perfil.module.css'

import PerfilHeader from "../../components/PerfilHeader";
import PerfilStats from "../../components/PerfilStats";
import PerfilBio from "../../components/PerfilBio";
import PerfilCategorias from "../../components/PerfilCategorias";
import PerfilResenas from "../../components/PerfilResenas";
import PerfilActions from "../../components/PerfilActions";

export default function PerfilPage() {

    const [perfil, setPerfil] = useState(null);
    const [modo, setModo] = useState(null);

    useEffect(() => {

        async function cargarPerfil() {

            try {

                const perfilCompleto = await getMiUsuario();

                setPerfil(perfilCompleto);
                setModo(perfilCompleto.ultimoRol);

            } catch (error) {

                console.error("Error al cargar el perfil:", error);

            }

        }

        cargarPerfil();

    }, []);

    const datos = useMemo(() => {

        if (!perfil || !modo) return null;

        return {

            rating:
                modo === "trabajador"
                    ? perfil.ratingTrabajador
                    : perfil.ratingContratante,

            cantidadTrabajos:
                modo === "trabajador"
                    ? perfil.trabajosRealizados
                    : perfil.trabajosPublicados,

            cantidadResenas:
                modo === "trabajador"
                    ? perfil.cantidadResenasTrabajador
                    : perfil.cantidadResenasContratante,

            biografia:
                modo === "trabajador"
                    ? perfil.biografiaTrabajador
                    : perfil.biografiaContratante,

            categorias:
                modo === "trabajador"
                    ? perfil.categoriasTrabaja
                    : perfil.categoriasContrata,

            resenas:
                modo === "trabajador"
                    ? perfil.resenasTrabajador
                    : perfil.resenasContratante

        };

    }, [perfil, modo]);

    if (!perfil || !datos) {
        return <div>Cargando...</div>;
    }

   return (
    <div className={styles.page}>
        <div className={styles.container}>

            <PerfilHeader
                perfil={perfil}
                modo={modo}
                setModo={setModo}
            />

            <PerfilStats
                datos={datos}
                miembroDesde={perfil.miembroDesde}
            />

            <PerfilBio
                biografia={datos.biografia}
            />

            <PerfilCategorias
                categorias={datos.categorias}
            />

            <PerfilResenas
                resenas={datos.resenas}
                cantidad={datos.cantidadResenas}
            />

            <PerfilActions
                onLogout={logout}
            />

        </div>
    </div>
);

}   