import styles from "./VerPerfilCategorias.module.css";

export default function VerPerfilCategorias({
    categorias = []
}) {

    return (
        <section className={styles.card}>

            <h3 className={styles.title}>
                Categorías
            </h3>

            {categorias.length === 0 ? (

                <p className={styles.vacio}>
                    Este usuario todavía no tiene categorías registradas.
                </p>

            ) : (

                <div className={styles.lista}>

                    {categorias.map((categoria, index) => (
                        <span
                            key={`${categoria}-${index}`}
                            className={styles.pill}
                        >
                            {categoria}
                        </span>
                    ))}

                </div>

            )}

        </section>
    );
}