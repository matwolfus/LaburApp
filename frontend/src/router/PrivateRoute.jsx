import { Navigate, Outlet } from 'react-router-dom';

// Protege las rutas privadas: si no hay token en localStorage, redirige a /login.
// La validación real del token la hace el backend en cada request protegida;
// acá solo evitamos mostrar pantallas privadas sin sesión.
export default function PrivateRoute() {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
