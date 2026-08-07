import styles from "./PerfilHeader.module.css";

export default function PerfilHeader({ perfil, modo, setModo }) {

    return (
        <div className="perfil-header">

            <img
                src={perfil.avatar}
                alt={perfil.nombreCompleto}
                className="perfil-avatar"
            />

            <h1>
                {perfil.nombreCompleto}

                {perfil.verificado && " ✔️"}
            </h1>

            <p>{perfil.localidad}</p>

            <div className="perfil-switch">

                <button
                    className={modo === "trabajador" ? "activo" : ""}
                    onClick={() => setModo("trabajador")}
                >
                    Trabajador
                </button>

                <button
                    className={modo === "contratador" ? "activo" : ""}
                    onClick={() => setModo("contratador")}
                >
                    Contratador
                </button>

            </div>

        </div>
    );

}