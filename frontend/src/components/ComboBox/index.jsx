import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import styles from './ComboBox.module.css';

// Desplegable con buscador: un input donde se escribe para filtrar y una
// lista de opciones debajo. options: [{ value, label }]. value es el value
// elegido (o '' si no hay). Navegable con teclado (flechas, Enter, Escape).
export default function ComboBox({
  id,
  options,
  value,
  onChange,
  placeholder = 'Seleccioná una opción',
  disabled = false,
  emptyText = 'Sin resultados',
  clearable = false,
  icon = null,
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  const filtered = useMemo(() => {
    const q = normalizar(query);
    if (!q) return options;
    return options.filter((o) => normalizar(o.label).includes(q));
  }, [options, query]);

  // Cerrar al tocar afuera.
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (!wrapperRef.current?.contains(e.target)) cerrar();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Mantener visible la opción activa al moverse con el teclado.
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function abrir() {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    const idx = filtered.findIndex((o) => String(o.value) === String(value));
    setActiveIndex(idx >= 0 ? idx : 0);
  }

  function cerrar() {
    setOpen(false);
    setQuery('');
  }

  function elegir(option) {
    onChange(option.value);
    cerrar();
  }

  function handleKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      abrir();
      return;
    }
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) elegir(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      cerrar();
    }
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        className={`${styles.input} ${icon ? styles.withIcon : ''}`}
        placeholder={selected ? selected.label : placeholder}
        value={open ? query : selected?.label ?? ''}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          if (!open) setOpen(true);
        }}
        onFocus={abrir}
        onClick={() => !open && abrir()}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      {clearable && selected && !disabled ? (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => onChange('')}
          aria-label="Limpiar selección"
        >
          <X size={16} />
        </button>
      ) : (
        <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
      )}

      {open && (
        <ul id={listId} role="listbox" className={styles.list} ref={listRef}>
          {filtered.length === 0 ? (
            <li className={styles.empty}>{emptyText}</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={String(o.value) === String(value)}
                className={`${styles.option} ${i === activeIndex ? styles.optionActive : ''} ${String(o.value) === String(value) ? styles.optionSelected : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(o)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// Para buscar sin importar mayúsculas ni tildes ("nunez" encuentra "Núñez").
function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}
