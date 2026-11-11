import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Sidebar from '../components/Sidebar';
import { getMiUsuario } from '../services/api';
import { useAuth } from '../context/useAuth';
import { homeDeModo } from '../hooks/useRoleSwitch';
import useBadges from '../hooks/useBadges';
import '../layouts/layout.css';
import logo from '../assets/logo.png';

export default function AppLayout() {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(null);
  const [nombre, setNombre] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // El modo lo carga AuthProvider (única fuente de verdad); acá solo se lee.
  const { modo } = useAuth();
  const badges = useBadges();

  useEffect(() => {
    getMiUsuario()
      .then((user) => {
        if (user?.avatar) setAvatar(user.avatar);
        setNombre(user?.nombreCompleto ?? '');
      })
      .catch((err) => console.error('Error al cargar el avatar del usuario:', err));
  }, []);

  return (
    <div className="app-shell">
      <Header
        logoSrc={logo}
        avatarSrc={avatar}
        nombre={nombre}
        onLogoClick={() => navigate(homeDeModo(modo))}
        onAvatarClick={() => navigate('/perfil')}
        onBellClick={() => navigate('/notificaciones')}
        notificacionesNoLeidas={badges.notificaciones}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-shell__content">
        <Outlet />
      </main>
      <BottomNav modo={modo} mensajesNoLeidos={badges.mensajes} />
    </div>
  );
}