import styles from "./PerfilBio.module.css";

export default function PerfilBio({ biografia }) {

    return (

        <section>

            <h3>Biografía</h3>

            <p>

                {biografia || "Este usuario todavía no agregó una biografía."}

            </p>

        </section>

    );

}