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

                        <article
                            key={review.id}
                            className={styles.review}
                        >

                            <div className={styles.reviewTop}>

                                {review.autor?.avatar ? (

                                    <img
                                        src={review.autor.avatar}
                                        alt={`Foto de ${review.autor.nombre}`}
                                        className={styles.avatar}
                                    />

                                ) : (

                                    <div className={styles.avatarPlaceholder}>

                                        {review.autor?.nombre
                                            ?.charAt(0)
                                            ?.toUpperCase() || "U"}

                                    </div>

                                )}


                                <div className={styles.info}>

                                    <h3 className={styles.nombre}>
                                        {review.autor?.nombre ||
                                            "Usuario"}
                                    </h3>

                                    <div className={styles.rating}>

                                        <span className={styles.estrellas}>
                                            {"★".repeat(
                                                Math.max(
                                                    0,
                                                    Math.min(
                                                        5,
                                                        Number(review.calificacion) || 0
                                                    )
                                                )
                                            )}
                                        </span>

                                        <span className={styles.ratingNumero}>
                                            {review.calificacion}/5
                                        </span>

                                    </div>

                                </div>

                            </div>


                            {review.comentario && (

                                <p className={styles.comentario}>
                                    {review.comentario}
                                </p>

                            )}


                            {review.fecha && (

                                <time
                                    className={styles.fecha}
                                    dateTime={review.fecha}
                                >
                                    {new Date(
                                        review.fecha
                                    ).toLocaleDateString(
                                        "es-AR"
                                    )}
                                </time>

                            )}

                        </article>

                    ))}

                </div>

            )}

        </section>

    );
}