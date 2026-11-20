import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMiUsuario } from "../../services/api";
import { useAuth } from "../../context/useAuth";
import { useRoleSwitch } from "../../hooks/useRoleSwitch";
import { datosPerfilSegunModo } from "../../utils/perfil";
import styles from '../../styles/Perfil.module.css'

import PerfilHeader from "../../components/PerfilHeader";
import PerfilStats from "../../components/PerfilStats";
import PerfilBio from "../../components/PerfilBio";
import PerfilCategorias from "../../components/PerfilCategorias";
import PerfilResenas from "../../components/PerfilResenas";
import ConfirmModal from "../../components/ConfirmModal";
import LoadingOverlay from "../../components/LoadingOverlay";

export default function PerfilPage() {

    const navigate = useNavigate();
    const [perfil, setPerfil] = useState(null);
    // El modo lo carga AuthProvider (única fuente de verdad); acá solo se lee.
    const { modo, modoError } = useAuth();
    const { switching, changeModo } = useRoleSwitch();

    // Reconfirmación al cambiar de rol: roleSwitchTarget es el modo que se
    // está por confirmar (null = no hay diálogo abierto).
    const [roleSwitchTarget, setRoleSwitchTarget] = useState(null);

    useEffect(() => {

        async function cargarPerfil() {

            try {

                const perfilCompleto = await getMiUsuario();

                setPerfil(perfilCompleto);

            } catch (error) {

                console.error("Error al cargar el perfil:", error);

            }

        }

        cargarPerfil();

    }, []);

    const datos = useMemo(() => datosPerfilSegunModo(perfil, modo), [perfil, modo]);

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
                onEdit={() => navigate("/perfil/editar")}
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
                insignias={modo === "trabajador"}
                titulo={modo === "trabajador" ? "Insignias" : "Categorías que contrataste"}
                vacioOwn={
                    modo === "trabajador"
                        ? "Todavía no completaste trabajos."
                        : "Todavía no contrataste en ninguna categoría."
                }
            />

            <PerfilResenas
                resenas={datos.resenas}
                cantidad={datos.cantidadResenas}
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