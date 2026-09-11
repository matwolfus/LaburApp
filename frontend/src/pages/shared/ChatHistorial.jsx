import { MessageSquare } from 'lucide-react';

// Placeholder: el chat real (mensajería entre contratador y trabajador) todavía
// no está construido — es un feature compartido entre ambos roles que se aborda
// en otra etapa. Esto evita que el ítem "Chat" del BottomNav apunte a una ruta
// sin manejar.
export default function ChatHistorial() {
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
      <MessageSquare size={40} strokeWidth={1.5} />
      <h2 style={{ margin: 0, color: '#2D3B8E' }}>Chat</h2>
      <p style={{ margin: 0, fontSize: 14 }}>Disponible próximamente.</p>
    </div>
  );
}
