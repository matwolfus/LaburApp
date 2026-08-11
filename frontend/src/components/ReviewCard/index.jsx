import styles from "./ReviewCard.module.css";

export default function ReviewCard({ review }) {

    const calificacion = Math.max(
        0,
        Math.min(
            5,
            Number(review?.calificacion) || 0
        )
    );

    return (
        <article className={styles.card}>

            <div className={styles.reviewTop}>

                {review?.autor?.avatar ? (

                    <img
                        src={review.autor.avatar}
                        alt={`Foto de ${review.autor.nombre}`}
                        className={styles.avatar}
                    />

                ) : (

                    <div className={styles.avatarPlaceholder}>
                        {review?.autor?.nombre
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                    </div>

                )}

                <div className={styles.info}>

                    <h3 className={styles.nombre}>
                        {review?.autor?.nombre || "Usuario"}
                    </h3>

                    <div className={styles.rating}>

                        <span className={styles.estrellas}>
                            {"★".repeat(calificacion)}
                        </span>

                        <span className={styles.ratingNumero}>
                            {review?.calificacion ?? "—"}/5
                        </span>

                    </div>

                </div>

            </div>

            {review?.comentario && (
                <p className={styles.comentario}>
                    {review.comentario}
                </p>
            )}

            {review?.fecha && (
                <time
                    className={styles.fecha}
                    dateTime={review.fecha}
                >
                    {new Date(review.fecha).toLocaleDateString("es-AR")}
                </time>
            )}

        </article>
    );
}