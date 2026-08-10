import { useNavigate } from "react-router-dom";
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
                ✏️ Editar Perfil
            </button>

            <button
                className={styles.logout}
                onClick={cerrarSesion}
            >
                Cerrar sesión
            </button>

        </div>
    );
}