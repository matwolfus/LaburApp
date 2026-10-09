import { useState } from 'react';
import { Bell, Menu } from 'lucide-react';

// Mismo criterio que PerfilHeader: primeras letras de nombre y apellido.
function getIniciales(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase())
    .join('');
}

export default function Header({ logoSrc, avatarSrc, nombre = '', onLogoClick, onAvatarClick, onMenuClick, onBellClick, notificacionesNoLeidas = 0 }) {
  const hayNoLeidas = notificacionesNoLeidas > 0;
  // Si la foto no carga (URL rota), también se muestran las iniciales.
  const [avatarRoto, setAvatarRoto] = useState(null);
  const mostrarFoto = avatarSrc && avatarRoto !== avatarSrc;
  return (
    <header className="app-header">
      <button className="app-header__icon-btn" onClick={onLogoClick} aria-label="Ir al inicio">
        <span className="app-header__logo-crop">
          <img className="app-header__logo" src={logoSrc} alt="LaburApp" />
        </span>
      </button>

      <div className="app-header__actions">
        <button className="app-header__icon-btn" onClick={onAvatarClick} aria-label="Mi perfil">
          {mostrarFoto ? (
            <img
              className="app-header__avatar"
              src={avatarSrc}
              alt="Perfil"
              onError={() => setAvatarRoto(avatarSrc)}
            />
          ) : (
            <span className="app-header__avatar app-header__avatar--iniciales" aria-hidden="true">
              {getIniciales(nombre)}
            </span>
          )}
        </button>
        <button
          className="app-header__icon-btn app-header__bell"
          onClick={onBellClick}
          aria-label={hayNoLeidas ? `Notificaciones (${notificacionesNoLeidas} sin leer)` : 'Notificaciones'}
        >
          <Bell size={22} strokeWidth={2} />
          {hayNoLeidas && (
            <span className="app-header__badge">
              {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
            </span>
          )}
        </button>
        <button className="app-header__icon-btn" onClick={onMenuClick} aria-label="Menú">
          <Menu size={24} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
