import { Tags } from "lucide-react";
import styles from "./PerfilCategorias.module.css";

export default function PerfilCategorias({
    categorias = [],
    own = true,
    titulo = "Categorías",
    vacioOwn = "Todavía no seleccionaste categorías.",
    vacioOther = "Este usuario todavía no tiene categorías registradas.",
}) {

    return (
        <section className={styles.card}>

            <h3 className={styles.title}>
                <Tags size={17} className={styles.icon} />
                {titulo}
            </h3>

            {categorias.length === 0 ? (

                <p className={styles.vacio}>
                    {own ? vacioOwn : vacioOther}
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
