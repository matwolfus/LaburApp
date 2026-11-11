import { useEffect, useRef, useState } from "react";
import { Camera, User } from "lucide-react";
import Avatar from "../../../components/Avatar";
import { uploadFotos } from "../../../services/api";
import { resizeImage } from "../../../utils/resizeImage";
import { ACCEPT_IMAGENES, TIPOS_IMAGEN } from "../../../constants/dominio";
import styles from "../../../styles/editarPerfil.module.css";

// Foto de perfil de "Editar perfil": elegir, previsualizar y subir.
// Cuando termina de subir avisa la URL nueva con onChange(url); mientras
// sube, onSubiendoChange(true) (el form no deja guardar a mitad de camino).
export default function FotoPerfilEditor({ avatar, nombre, onChange, onSubiendoChange }) {
    const [preview, setPreview] = useState("");
    const [subiendo, setSubiendo] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef(null);

    // Libera la URL temporal de la vista previa.
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    const marcarSubiendo = (valor) => {
        setSubiendo(valor);
        onSubiendoChange?.(valor);
    };

    async function handleArchivo(event) {
        const file = event.target.files[0];
        event.target.value = "";
        if (!file) return;

        setError("");
        if (!TIPOS_IMAGEN.includes(file.type)) {
            setError("Solo se permiten imágenes JPG, PNG o WebP.");
            return;
        }

        setPreview(URL.createObjectURL(file));
        marcarSubiendo(true);

        try {
            // Se achica a 800px / JPEG 0.8 antes de subir: una foto de celular
            // pesa varios MB y el backend rechaza más de 5 MB.
            const reducida = await resizeImage(file);
            const { urls } = await uploadFotos([reducida]);
            onChange(urls[0]);
        } catch (err) {
            setError(err.message || "No se pudo subir la foto.");
        } finally {
            setPreview("");
            marcarSubiendo(false);
        }
    }

    return (
        <div className={styles.avatarSection}>
            <button
                type="button"
                className={styles.avatarButton}
                onClick={() => inputRef.current?.click()}
                disabled={subiendo}
                aria-label={avatar ? "Cambiar foto de perfil" : "Elegir foto de perfil"}
            >
                <Avatar
                    src={preview || avatar}
                    nombre={nombre}
                    alt="Foto de perfil"
                    className={styles.avatarPreview}
                    fallbackClassName={styles.avatarPlaceholder}
                    fallbackTag="span"
                    fallback={<User size={40} />}
                />
                <span className={styles.avatarBadge}>
                    <Camera size={16} />
                </span>
            </button>

            <input
                ref={inputRef}
                id="avatar"
                type="file"
                accept={ACCEPT_IMAGENES}
                className={styles.avatarInputHidden}
                onChange={handleArchivo}
            />

            <p className={styles.avatarHint}>
                {subiendo ? "Subiendo foto..." : avatar ? "Tocá la foto para cambiarla" : "Tocá para elegir una foto"}
            </p>

            {error && <p className={styles.avatarError} role="alert">{error}</p>}
        </div>
    );
}
