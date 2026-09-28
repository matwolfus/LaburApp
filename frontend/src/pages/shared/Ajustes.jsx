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
      color: '#64748B',
    }}>
      <Settings size={40} strokeWidth={1.5} />
      <h2 style={{ margin: 0, color: '#2D3B8E' }}>Ajustes</h2>
      <p style={{ margin: 0, fontSize: 14 }}>Disponible próximamente.</p>
    </div>
  );
}
