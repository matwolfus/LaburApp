import { Tags, Award } from "lucide-react";
import styles from "./PerfilCategorias.module.css";

export default function PerfilCategorias({
    categorias = [],
    own = true,
    titulo = "Categorías",
    vacioOwn = "Todavía no seleccionaste categorías.",
    vacioOther = "Este usuario todavía no tiene categorías registradas.",
    insignias = false,
}) {
    const Icono = insignias ? Award : Tags;

    return (
        <section className={styles.card}>

            <h3 className={styles.title}>
                <Icono size={17} className={insignias ? `${styles.icon} ${styles.iconInsignia}` : styles.icon} />
                {titulo}
            </h3>

            {categorias.length === 0 ? (

                <p className={styles.vacio}>
                    {own ? vacioOwn : vacioOther}
                </p>

            ) : (

                <div className={styles.lista}>

                    {categorias.map((categoria) => (
                        <span key={categoria} className={insignias ? `${styles.pill} ${styles.pillInsignia}` : styles.pill}>
                            {insignias && "🏅 "}{categoria}
                        </span>
                    ))}

                </div>

            )}

        </section>
    );
}
