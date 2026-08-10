import ReviewCard from "../ReviewCard";
import styles from "./PerfilResenas.module.css";

export default function PerfilResenas({ resenas = [], cantidad = 0 }) {

    return (
        <section className={styles.card}>

            <h3 className={styles.title}>
                Reseñas ({cantidad})
            </h3>

            {resenas.length === 0 ? (

                <p className={styles.vacio}>
                    Este usuario todavía no tiene reseñas.
                </p>

            ) : (

                <div className={styles.lista}>

                    {resenas.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}

                </div>

            )}

        </section>
    );
}