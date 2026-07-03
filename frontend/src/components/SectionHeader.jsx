// frontend/src/components/SectionHeader.jsx
export default function SectionHeader({ title, onFilter }) {
  return (
    <div className="section-header">
      <h2 className="section-header__title">{title}</h2>
      {onFilter && (
        <button className="section-header__filter" onClick={onFilter}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5"
               strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
            <circle cx="9" cy="6" r="2" fill="var(--color-bg)" />
            <circle cx="15" cy="12" r="2" fill="var(--color-bg)" />
            <circle cx="9" cy="18" r="2" fill="var(--color-bg)" />
          </svg>
          Filtrar
        </button>
      )}
    </div>
  );
}