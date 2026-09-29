import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Sidebar from '../components/Sidebar';
import { getMiUsuario } from '../services/api';
import { useAuth } from '../context/useAuth';
import { homeDeModo } from '../hooks/useRoleSwitch';
import '../layouts/layout.css';
import logo from '../assets/logo.png';

const DEFAULT_AVATAR = 'https://placehold.co/40x40/CBD5E1/FFFFFF?text=R';

export default function AppLayout() {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { modo, hydrateModo } = useAuth();

  useEffect(() => {
    getMiUsuario()
      .then((user) => {
        if (user?.avatar) setAvatar(user.avatar);
        // Cubre el caso de entrar directo a una pantalla con layout (ej.
        // refrescar en /inicio) sin haber pasado por Perfil.jsx todavía:
        // el contexto arranca en null en cada carga de página a propósito.
        if (!modo && user?.ultimoRol) hydrateModo(user.ultimoRol);
      })
      .catch((err) => console.error('Error al cargar el avatar del usuario:', err));
  }, []);

  return (
    <div className="app-shell">
      <Header
        logoSrc={logo}
        avatarSrc={avatar}
        onLogoClick={() => navigate(homeDeModo(modo ?? localStorage.getItem('modoActivo')))}
        onAvatarClick={() => navigate('/perfil')}
        onBellClick={() => navigate('/notificaciones')}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-shell__content">
        <Outlet />
      </main>
      <BottomNav modo={modo} />
    </div>
  );
}