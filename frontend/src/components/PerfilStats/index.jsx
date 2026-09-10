import styles from "./PerfilStats.module.css";

export default function PerfilStats({ datos, miembroDesde }) {

    const fecha = miembroDesde ? new Date(miembroDesde) : null;

    return (
        <div className={styles.stats}>

            {/* Cantidad de trabajos */}
            <div className={styles.stat}>
                <h2>{datos?.cantidadTrabajos ?? 0}</h2>
                <span>Trabajos</span>
            </div>

            {/* Rating */}
            <div className={styles.stat}>
                <h2>
                    {datos?.rating != null
                        ? Number(datos.rating).toFixed(1)
                        : "—"}
                </h2>
                <span>Rating</span>
            </div>

            {/* Miembro desde */}
            <div className={styles.stat}>
                <h2>
                    {fecha && !isNaN(fecha.getTime())
                        ? fecha.toLocaleDateString("es-AR", {
                              month: "short",
                              year: "2-digit"
                          })
                        : "—"}
                </h2>
                <span>Miembro</span>
            </div>

        </div>
    );
}