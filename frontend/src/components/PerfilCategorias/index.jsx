import styles from "./PerfilCategorias.module.css";

export default function PerfilCategorias({ categorias = [] }) {

    return (
        <section className={styles.card}>

            <h3 className={styles.title}>
                Categorías
            </h3>

            {categorias.length === 0 ? (

                <p className={styles.vacio}>
                    Todavía no seleccionaste categorías.
                </p>

            ) : (

                <div className={styles.lista}>

                    {categorias.map((categoria) => (
                        <span key={categoria} className={styles.pill}>
                            {categoria}
                        </span>
                    ))}

                </div>

            )}

        </section>
    );
}