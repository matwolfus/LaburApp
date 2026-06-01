import { Bell, Menu } from 'lucide-react';

export default function Header({ logoSrc, avatarSrc, onMenuClick, onBellClick }) {
  return (
    <header className="app-header">
      <img className="app-header__logo" src={logoSrc} alt="LaburApp" />

      <div className="app-header__actions">
        <img className="app-header__avatar" src={avatarSrc} alt="Perfil" />
        <button className="app-header__icon-btn" onClick={onBellClick} aria-label="Notificaciones">
          <Bell size={22} strokeWidth={2} />
        </button>
        <button className="app-header__icon-btn" onClick={onMenuClick} aria-label="Menú">
          <Menu size={24} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}