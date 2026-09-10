import styles from "./VerPerfilStats.module.css";

export default function VerPerfilStats({
    datos,
    miembroDesde
}) {

    const fecha = miembroDesde
        ? new Date(miembroDesde)
        : null;

    const fechaValida =
        fecha && !isNaN(fecha.getTime());

    return (

        <section className={styles.stats}>

            <div className={styles.stat}>

                <strong>
                    {datos?.cantidadTrabajos ?? 0}
                </strong>

                <span>
                    Trabajos
                </span>

            </div>


            <div className={styles.stat}>

                <strong>

                    {datos?.rating != null
                        ? Number(datos.rating).toFixed(1)
                        : "—"}

                </strong>

                <span>
                    Rating
                </span>

            </div>


            <div className={styles.stat}>

                <strong>

                    {fechaValida
                        ? fecha.toLocaleDateString(
                            "es-AR",
                            {
                                month: "short",
                                year: "2-digit"
                            }
                        )
                        : "—"}

                </strong>

                <span>
                    Miembro
                </span>

            </div>

        </section>

    );
}