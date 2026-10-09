import { Bell, Menu } from 'lucide-react';

export default function Header({ logoSrc, avatarSrc, onLogoClick, onAvatarClick, onMenuClick, onBellClick, notificacionesNoLeidas = 0 }) {
  const hayNoLeidas = notificacionesNoLeidas > 0;
  return (
    <header className="app-header">
      <button className="app-header__icon-btn" onClick={onLogoClick} aria-label="Ir al inicio">
        <span className="app-header__logo-crop">
          <img className="app-header__logo" src={logoSrc} alt="LaburApp" />
        </span>
      </button>

      <div className="app-header__actions">
        <button className="app-header__icon-btn" onClick={onAvatarClick} aria-label="Mi perfil">
          <img className="app-header__avatar" src={avatarSrc} alt="Perfil" />
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
