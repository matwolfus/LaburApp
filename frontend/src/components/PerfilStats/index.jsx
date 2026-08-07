import styles from "./PerfilStats.module.css";

export default function PerfilStats({ datos, miembroDesde }) {

    const fecha = new Date(miembroDesde);

    return (

        <div className="perfil-stats">

            <div>

                <h2>{datos.cantidadTrabajos}</h2>

                <span>Trabajos</span>

            </div>

            <div>

                <h2>{datos.rating.toFixed(1)}</h2>

                <span>Rating</span>

            </div>

            <div>

                <h2>

                    {fecha.toLocaleDateString("es-AR", {

                        month: "short",

                        year: "2-digit"

                    })}

                </h2>

                <span>Miembro</span>

            </div>

        </div>

    );

}