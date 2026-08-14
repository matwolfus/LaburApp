import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { getMiUsuario } from '../services/api';
import '../layouts/layout.css';
import logo from '../assets/logo.png';

const DEFAULT_AVATAR = 'https://placehold.co/40x40/CBD5E1/FFFFFF?text=R';

export default function AppLayout() {
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);

  useEffect(() => {
    getMiUsuario()
      .then((user) => {
        if (user?.avatar) setAvatar(user.avatar);
      })
      .catch((err) => console.error('Error al cargar el avatar del usuario:', err));
  }, []);

  return (
    <div className="app-shell">
      <Header logoSrc={logo} avatarSrc={avatar} />
      <main className="app-shell__content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}