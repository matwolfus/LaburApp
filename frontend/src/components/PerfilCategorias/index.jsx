import { Tags } from "lucide-react";
import styles from "./PerfilCategorias.module.css";

export default function PerfilCategorias({ categorias = [], own = true }) {

    return (
        <section className={styles.card}>

            <h3 className={styles.title}>
                <Tags size={17} className={styles.icon} />
                Categorías
            </h3>

            {categorias.length === 0 ? (

                <p className={styles.vacio}>
                    {own
                        ? "Todavía no seleccionaste categorías."
                        : "Este usuario todavía no tiene categorías registradas."}
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
