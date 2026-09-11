import { MessageCircleMore } from "lucide-react";
import styles from "./PerfilBio.module.css";

export default function PerfilBio({ biografia }) {

    return (
        <section className={styles.card}>

            <h3 className={styles.title}>
                <MessageCircleMore size={17} className={styles.icon} />
                ¿Quién soy?
            </h3>

            <p className={styles.text}>
                {biografia || "Este usuario todavía no agregó una biografía."}
            </p>

        </section>
    );
}
