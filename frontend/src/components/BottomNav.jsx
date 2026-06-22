import { NavLink } from 'react-router-dom';
import { Home, Search, Briefcase, MessageSquare, User } from 'lucide-react';

const items = [
  { to: '/InicioContratador', icon: Home,          label: 'Inicio'   },
  { to: '/buscar',  icon: Search,        label: 'Buscar'   },
  { to: '/ofertas', icon: Briefcase,     label: 'Trabajos' },
  { to: '/chats',   icon: MessageSquare, label: 'Chat'     },
  { to: '/perfil',  icon: User,          label: 'Perfil'   },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            'bottom-nav__item' + (isActive ? ' bottom-nav__item--active' : '')
          }
        >
          <Icon size={22} strokeWidth={2} />
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}