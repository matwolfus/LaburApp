// TODO: AppRouter with role-based routing
// frontend/src/router/index.jsx

//a medida que agreguen nuevas pantallas, las agregás en router/index.jsx como una línea más:
//{ path: '/contratador/nueva-pantalla', element: <NuevaPantalla /> },

import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import PrivateRoute from './PrivateRoute';
import Ofertas from '../pages/contratador/Ofertas';
import VerPostulantes from '../pages/contratador/VerPostulantes';
import Register from '../pages/shared/Register';
import Login from '../pages/shared/Login';
import InicioContratador from '../pages/contratador/InicioContratador';
import NuevoTrabajo from '../pages/contratador/NuevoTrabajo';


const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },

  // Rutas públicas (login, registro)
  { path: '/registro', element: <Register /> },
  { path: '/login', element: <Login /> },

  // Rutas privadas: requieren token, si no redirigen a /login.
  // NOTA: hoy solo cubren el flujo de contratador (las únicas que existen).
  // Cuando se sume el flujo de trabajador, esas rutas también hay que meterlas acá.
  {
    element: <PrivateRoute />,
    children: [
      // Sin header/navbar
      { path: '/ofertas/:jobId/postulantes', element: <VerPostulantes /> },
      { path: '/nuevo-trabajo', element: <NuevoTrabajo /> },

      // Con header/navbar
      {
        element: <AppLayout />,
        children: [
          { path: '/ofertas', element: <Ofertas /> },
          { path: '/inicio', element: <InicioContratador /> },
          // acá inicio, chats, perfil...
        ],
      },
    ],
  },
]);

export default router;