import styles from "./VerPerfilHeader.module.css";

function getIniciales(nombre = "") {

    return nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((palabra) => palabra[0]?.toUpperCase())
        .join("");

}

export default function VerPerfilHeader({
    perfil,
    modo,
    setModo
}) {

    return (

        <section className={styles.header}>

            {perfil.avatar ? (

                <img
                    src={perfil.avatar}
                    alt={`Foto de ${perfil.nombreCompleto}`}
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
                        modo === "contratante"
                            ? `${styles.switchBtn} ${styles.activo}`
                            : styles.switchBtn
                    }
                    onClick={() => setModo("contratante")}
                >
                    Contratante
                </button>

            </div>

        </section>

    );
}