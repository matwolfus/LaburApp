import styles from "./ReviewCard.module.css";
export default function ReviewCard({ review }) {

    return (

        <div className="review-card">

            <img
                src={review.autor.avatar}
                alt={review.autor.nombre}
            />

            <div>

                <strong>

                    {review.autor.nombre}

                </strong>

                <div>

                    ⭐ {review.calificacion}

                </div>

                <p>

                    {review.comentario}

                </p>

            </div>

        </div>

    );

}