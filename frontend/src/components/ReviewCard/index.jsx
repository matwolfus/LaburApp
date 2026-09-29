import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ReviewCard.module.css";

export default function ReviewCard({ review }) {

    const navigate = useNavigate();
    const [avatarError, setAvatarError] = useState(false);

    const autorId = review?.autor?.id;
    const abrirPerfilAutor = () => {
        if (!autorId) return;
        const esPropio = String(autorId) === String(localStorage.getItem("userId"));
        navigate(esPropio ? "/perfil" : `/perfil/${autorId}`);
    };

    const calificacion = Math.max(
        0,
        Math.min(
            5,
            Number(review?.calificacion) || 0
        )
    );

    return (
        <article className={styles.card}>

            <div
                className={styles.reviewTop}
                onClick={abrirPerfilAutor}
                onKeyDown={(e) => { if (e.key === "Enter") abrirPerfilAutor(); }}
                role={autorId ? "button" : undefined}
                tabIndex={autorId ? 0 : undefined}
                style={autorId ? { cursor: "pointer" } : undefined}
            >

                {review?.autor?.avatar && !avatarError ? (

                    <img
                        src={review.autor.avatar}
                        alt={`Foto de ${review.autor.nombre}`}
                        className={styles.avatar}
                        onError={() => setAvatarError(true)}
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