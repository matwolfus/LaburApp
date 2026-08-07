import styles from "./PerfilCategorias.module.css";

export default function PerfilCategorias({ categorias }) {

    return (

        <section>

            <h3>Categorías</h3>

            <div className="categorias">

                {

                    categorias.map((categoria) => (

                        <span
                            key={categoria}
                            className="categoria"
                        >
                            {categoria}
                        </span>

                    ))

                }

            </div>

        </section>

    );

}