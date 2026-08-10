import styles from "./PerfilHeader.module.css";

function getIniciales(nombre = "") {
    return nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((palabra) => palabra[0]?.toUpperCase())
        .join("");
}

export default function PerfilHeader({ perfil, modo, setModo }) {

    return (
        <div className={styles.header}>

            {perfil.avatar ? (
                <img
                    src={perfil.avatar}
                    alt={perfil.nombreCompleto}
                    className={styles.avatar}
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
                        className={styles.verificadoIcono}
                        title="Verificado"
                    >
                        ✔️
                    </span>
                )}
            </h1>

            {perfil.localidad && (
                <p className={styles.localidad}>
                    📍 {perfil.localidad}
                </p>
            )}

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

        </div>
    );
}