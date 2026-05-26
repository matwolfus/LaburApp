// frontend/src/components/SectionHeader.jsx
export default function SectionHeader({ title, onFilter }) {
  return (
    <div className="section-header">
      <h2 className="section-header__title">{title}</h2>
      <button className="section-header__filter" onClick={onFilter}>
        ⊞ Filtrar
      </button>
    </div>
  );
}