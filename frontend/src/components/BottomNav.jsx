import { NavLink } from 'react-router-dom';
import { Home, Search, Briefcase, MessageSquare, User } from 'lucide-react';

const ITEMS_CONTRATADOR = [
  { to: '/inicio', icon: Home,          label: 'Inicio'   },
  { to: '/buscar',  icon: Search,        label: 'Buscar'   },
  { to: '/ofertas', icon: Briefcase,     label: 'Trabajos' },
  { to: '/chats',   icon: MessageSquare, label: 'Chat'     },
  { to: '/perfil',  icon: User,          label: 'Perfil'   },
];

const ITEMS_TRABAJADOR = [
  { to: '/trabajador/inicio', icon: Home,          label: 'Inicio'       },
  { to: '/trabajador/buscar', icon: Search,        label: 'Buscar'       },
  { to: '/trabajador/estado', icon: Briefcase,     label: 'Postulaciones' },
  { to: '/chats',             icon: MessageSquare, label: 'Chat'         },
  { to: '/perfil',            icon: User,          label: 'Perfil'       },
];

export default function BottomNav({ modo, mensajesNoLeidos = 0 }) {
  const items = modo === 'trabajador' ? ITEMS_TRABAJADOR : ITEMS_CONTRATADOR;

  return (
    <nav className="bottom-nav">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/' || to === '/perfil'}
          className={({ isActive }) =>
            'bottom-nav__item' + (isActive ? ' bottom-nav__item--active' : '')
          }
        >
          <span className="bottom-nav__icon">
            <Icon size={22} strokeWidth={2} />
            {to === '/chats' && mensajesNoLeidos > 0 && (
              <span className="bottom-nav__dot" aria-label="Mensajes sin leer" />
            )}
          </span>
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
