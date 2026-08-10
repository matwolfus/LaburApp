import { useNavigate } from "react-router-dom";
import styles from "./PerfilAction.module.css";

export default function PerfilActions({ onLogout }) {

    const navigate = useNavigate();

    function cerrarSesion() {
        onLogout();
        navigate("/login");
    }

    return (
        <div className={styles["perfil-actions"]}>

            <button onClick={() => navigate("/perfil/editar")}>
                Editar perfil
            </button>

            <button onClick={cerrarSesion}>
                Cerrar sesión
            </button>

        </div>
    );
}