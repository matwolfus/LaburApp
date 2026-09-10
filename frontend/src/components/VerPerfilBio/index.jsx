import styles from "./VerPerfilBio.module.css";

export default function VerPerfilBio({
    biografia
}) {

    return (

        <section className={styles.card}>

            <h2 className={styles.title}>
                ¿Quién soy?
            </h2>

            <p className={styles.text}>
                {biografia ||
                    "Este usuario todavía no agregó una biografía."}
            </p>

        </section>

    );
}