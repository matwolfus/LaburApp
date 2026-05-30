import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import '../layouts/layout.css';
import logo from '../assets/logo.png';  

const avatar = 'https://placehold.co/40x40/CBD5E1/FFFFFF?text=R';

export default function AppLayout() {
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