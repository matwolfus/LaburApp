import ReviewCard from "../ReviewCard";
import styles from "./PerfilResenas.module.css";

export default function PerfilResenas({ resenas, cantidad }) {

    return (

        <section>

            <h3>

                Reseñas ({cantidad})

            </h3>

            {

                resenas.length === 0

                    ?

                    <p>

                        Este usuario todavía no tiene reseñas.

                    </p>

                    :

                    resenas.map((review) => (

                        <ReviewCard

                            key={review.id}

                            review={review}

                        />

                    ))

            }

        </section>

    );

}