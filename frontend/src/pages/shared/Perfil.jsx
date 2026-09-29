import { useEffect, useMemo, useState } from "react";
import { getMiUsuario, logout } from "../../services/api";
import { useAuth } from "../../context/useAuth";
import { useRoleSwitch } from "../../hooks/useRoleSwitch";
import styles from '../../styles/Perfil.module.css'

import PerfilHeader from "../../components/PerfilHeader";
import PerfilStats from "../../components/PerfilStats";
import PerfilBio from "../../components/PerfilBio";
import PerfilCategorias from "../../components/PerfilCategorias";
import PerfilResenas from "../../components/PerfilResenas";
import PerfilActions from "../../components/PerfilActions";
import ConfirmModal from "../../components/ConfirmModal";
import LoadingOverlay from "../../components/LoadingOverlay";

export default function PerfilPage() {

    const [perfil, setPerfil] = useState(null);
    const { modo, hydrateModo, modoError } = useAuth();
    const { switching, changeModo } = useRoleSwitch();

    // Reconfirmación al cambiar de rol: roleSwitchTarget es el modo que se
    // está por confirmar (null = no hay diálogo abierto).
    const [roleSwitchTarget, setRoleSwitchTarget] = useState(null);

    useEffect(() => {

        async function cargarPerfil() {

            try {

                const perfilCompleto = await getMiUsuario();

                setPerfil(perfilCompleto);

                // Solo hidrata si todavía no hay modo activo (sesión recién
                // iniciada / primer login post-feature). Nunca pisa un modo
                // que el usuario ya eligió a mano vía el toggle — eso sería
                // un PATCH "actualizar a lo mismo" en cada visita a Perfil,
                // y acá ni siquiera pega al backend porque es hidratación,
                // no una decisión del usuario.
                if (!modo) {
                    hydrateModo(perfilCompleto.ultimoRol);
                }

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

    // Pide confirmación antes de tocar el modo activo (a diferencia de
    // hidratar, esto SÍ es una decisión del usuario). Si confirma, se
    // muestra la pantalla de carga durante al menos MIN_SWITCH_DELAY_MS
    // (aunque el PATCH sea instantáneo) para que se sienta como "está
    // trayendo la info del otro rol", y al terminar navega al home de ese rol.
    const handleRequestModoChange = (nuevoModo) => {
        if (nuevoModo === modo) return;
        setRoleSwitchTarget(nuevoModo);
    };

    const handleConfirmModoChange = () => {
        const nuevoModo = roleSwitchTarget;
        setRoleSwitchTarget(null);
        changeModo(nuevoModo);
    };

    if (switching) {
        return <LoadingOverlay message="Cargando información..." />;
    }

    if (!perfil || !datos) {
        return <div>Cargando...</div>;
    }

   return (
    <div className={styles.page}>
        <div className={styles.container}>

            <PerfilHeader
                perfil={perfil}
                modo={modo}
                setModo={handleRequestModoChange}
            />

            {modoError && (
                <p className={styles.modoError}>{modoError}</p>
            )}

            <PerfilStats
                datos={datos}
                miembroDesde={perfil.miembroDesde}
            />

            <PerfilBio
                biografia={datos.biografia}
            />

            {modo === "trabajador" && (
                <PerfilCategorias
                    categorias={(perfil.categoriasOfrecidas || []).map((c) => c.nombre)}
                    titulo="Categorías que ofrecés"
                    vacioOwn="Todavía no elegiste categorías. Agregalas desde 'Editar perfil'."
                />
            )}

            <PerfilCategorias
                categorias={datos.categorias}
                titulo={modo === "trabajador" ? "Trabajos en los que participaste" : "Categorías que contrataste"}
                vacioOwn={
                    modo === "trabajador"
                        ? "Todavía no trabajaste en ninguna categoría."
                        : "Todavía no contrataste en ninguna categoría."
                }
            />

            <PerfilResenas
                resenas={datos.resenas}
                cantidad={datos.cantidadResenas}
            />

            <PerfilActions
                onLogout={logout}
            />

        </div>

        <ConfirmModal
            open={roleSwitchTarget != null}
            title={`¿Cambiar a modo ${roleSwitchTarget === "trabajador" ? "Trabajador" : "Contratador"}?`}
            message="Vas a ver la app desde esa perspectiva. Podés volver a cambiar cuando quieras."
            confirmLabel="Sí, cambiar"
            cancelLabel="Cancelar"
            onConfirm={handleConfirmModoChange}
            onCancel={() => setRoleSwitchTarget(null)}
        />
    </div>
);

}