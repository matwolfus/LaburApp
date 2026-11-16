import { Settings } from 'lucide-react';

// Placeholder: todavía no está definido qué va a tener la pantalla de
// Ajustes. Esto evita que el ítem "Ajustes" de la barra lateral apunte a
// una ruta sin manejar (mismo patrón que ChatHistorial.jsx).
export default function Ajustes() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: '80px 24px',
      textAlign: 'center',
      color: 'var(--color-muted)',
    }}>
      <span style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--color-cta-bg)',
        color: 'var(--color-primary)',
      }}>
        <Settings size={32} strokeWidth={1.75} />
      </span>
      <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>Ajustes</h2>
      <p style={{
        margin: 0,
        padding: '4px 12px',
        borderRadius: 999,
        background: 'var(--color-orange-bg)',
        color: 'var(--color-orange-text)',
        fontSize: 'var(--fs-sm)',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>Disponible próximamente.</p>
    </div>
  );
}
