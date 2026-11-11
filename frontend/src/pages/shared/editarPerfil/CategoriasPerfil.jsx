import { Award, Briefcase, Check } from "lucide-react";
import styles from "../../../styles/editarPerfil.module.css";

// Insignias (solo lectura): categorías en las que ya completó trabajos.
export function InsigniasPerfil({ insignias }) {
    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>
                <Award size={18} className={styles.cardTitleIcon} />
                Insignias
            </h2>
            <p className={styles.categoriasHint}>Categorías en las que completaste trabajos.</p>

            {insignias.length === 0 ? (
                <p className={styles.emptyState}>Todavía no completaste trabajos.</p>
            ) : (
                <div className={styles.categoriasGrid}>
                    {insignias.map((ins) => (
                        <span key={ins.id} className={`${styles.categoriaChip} ${styles.insigniaChip}`}>
                            🏅 {ins.nombre}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// Categorías en las que el usuario se ofrece como trabajador (editable).
export function CategoriasOfrecidas({ categorias, seleccionadas, onToggle }) {
    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>
                <Briefcase size={18} className={styles.cardTitleIcon} />
                Trabajos que estás dispuesto a hacer
            </h2>
            <p className={styles.categoriasHint}>
                Elegí en qué categorías querés que te encuentren. Podés cambiarlas cuando quieras.
            </p>

            {categorias.length === 0 ? (
                <p className={styles.emptyState}>No hay categorías disponibles.</p>
            ) : (
                <div className={styles.categoriasGrid}>
                    {categorias.map((cat) => {
                        const activa = seleccionadas.includes(cat.id);
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                className={activa ? `${styles.categoriaChip} ${styles.categoriaChipActive}` : styles.categoriaChip}
                                aria-pressed={activa}
                                onClick={() => onToggle(cat.id)}
                            >
                                {activa && <Check size={14} strokeWidth={3} />}
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
