export function CategoryCard({category, onClick}) {
   return (
         <button
      className="category-card"
      onClick={() => onClick?.(category)}
      aria-label={`Explorar ${category.name}`}
    >
      <img
        src={category.icon}
        alt=""
        className="category-icon"
        aria-hidden="true"
        loading="lazy"
        onError={(e) => {
          // Si la URL falla, muestra un fallback genérico
          e.currentTarget.src = "/icons/default-category.png";
        }}
      />
      <span className="category-label">{category.name}</span>
    </button>
    );
}

