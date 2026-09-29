import { useState } from "react";
import { Pencil } from "lucide-react";
import styles from "./PerfilHeader.module.css";

function getIniciales(nombre = "") {
    return nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((palabra) => palabra[0]?.toUpperCase())
        .join("");
}

export default function PerfilHeader({ perfil, modo, setModo, own = true, onEdit }) {

    const [avatarError, setAvatarError] = useState(false);

    return (
        <div className={styles.header}>

            {own && onEdit && (
                <button type="button" className={styles.editBtn} onClick={onEdit}>
                    <Pencil size={14} />
                    Editar perfil
                </button>
            )}

            {perfil.avatar && !avatarError ? (
                <img
                    src={perfil.avatar}
                    alt={perfil.nombreCompleto}
                    className={styles.avatar}
                    onError={() => setAvatarError(true)}
                />
            ) : (
                <div className={styles.avatarPlaceholder}>
                    {getIniciales(perfil.nombreCompleto)}
                </div>
            )}

            <h1 className={styles.nombre}>
                {perfil.nombreCompleto}

                {perfil.verificado && (
                    <span
    className={styles.verificado}
    title="Usuario verificado"
>
    ✓
</span>
                )}
            </h1>

            {perfil.localidad && (
                <p className={styles.localidad}>
                    📍 {perfil.localidad}
                </p>
            )}

            <p className={styles.switchLabel}>
                {own ? "Modo activo · tocá para cambiar" : "Mostrando el perfil como"}
            </p>

            {own ? (
                <div className={styles.switch}>

                    <button
                        type="button"
                        className={
                            modo === "trabajador"
                                ? `${styles.switchBtn} ${styles.activo}`
                                : styles.switchBtn
                        }
                        onClick={() => setModo("trabajador")}
                    >
                        Trabajador
                    </button>

                    <button
                        type="button"
                        className={
                            modo === "contratador"
                                ? `${styles.switchBtn} ${styles.activo}`
                                : styles.switchBtn
                        }
                        onClick={() => setModo("contratador")}
                    >
                        Contratador
                    </button>

                </div>
            ) : (
                // Perfil ajeno: solo indica qué rol se está mostrando, no es
                // una acción para "cambiarle el rol" a la otra persona.
                <div className={`${styles.switch} ${styles.switchReadOnly}`}>
                    <span className={modo === "trabajador" ? `${styles.switchBtn} ${styles.activo}` : styles.switchBtn}>
                        Trabajador
                    </span>
                    <span className={modo === "contratador" ? `${styles.switchBtn} ${styles.activo}` : styles.switchBtn}>
                        Contratador
                    </span>
                </div>
            )}

        </div>
    );
}