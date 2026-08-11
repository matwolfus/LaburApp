import ReviewCard from "../ReviewCard";
import styles from "./VerPerfilResenas.module.css";

export default function VerPerfilResenas({
    resenas = [],
    cantidad = 0
}) {

    return (
        <section className={styles.card}>

            <div className={styles.header}>

                <h2 className={styles.title}>
                    Reseñas
                </h2>

                <span className={styles.cantidad}>
                    {cantidad}
                </span>

            </div>

            {resenas.length === 0 ? (

                <p className={styles.vacio}>
                    Este usuario todavía no tiene reseñas.
                </p>

            ) : (

                <div className={styles.lista}>

                    {resenas.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                        />
                    ))}

                </div>

            )}

        </section>
    );
}