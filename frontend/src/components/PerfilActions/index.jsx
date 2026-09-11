import { useNavigate } from "react-router-dom";
import { Pencil, LogOut } from "lucide-react";
import styles from "./PerfilAction.module.css";

export default function PerfilActions({ onLogout }) {

    const navigate = useNavigate();

    function cerrarSesion() {
        onLogout();
        navigate("/login");
    }

    return (
        <div className={styles.actions}>

            <button
                className={styles.editar}
                onClick={() => navigate("/perfil/editar")}
            >
                <Pencil size={16} />
                Editar Perfil
            </button>

            <button
                className={styles.logout}
                onClick={cerrarSesion}
            >
                <LogOut size={14} />
                Cerrar sesión
            </button>

        </div>
    );
}