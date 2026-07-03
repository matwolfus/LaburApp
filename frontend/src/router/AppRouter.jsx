// TODO: AppRouter with role-based routing
// frontend/src/router/index.jsx

//a medida que agreguen nuevas pantallas, las agregás en router/index.jsx como una línea más:
//{ path: '/contratador/nueva-pantalla', element: <NuevaPantalla /> },

import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Ofertas from '../pages/contratador/Ofertas';
import VerPostulantes from '../pages/contratador/VerPostulantes';
import Register from '../pages/shared/Register';
import Login from '../pages/shared/Login';
import InicioContratador from '../pages/contratador/InicioContratador';
import NuevoTrabajo from '../pages/contratador/NuevoTrabajo';


const router = createBrowserRouter([
  // Rutas SIN header/navbar (login, registro...)
  // { path: '/login', element: <Login /> },
  { path: '/ofertas/:jobId/postulantes', element: <VerPostulantes /> },
  {path : '/registro', element: <Register /> },
  {path: '/login', element: <Login />},
  { path: '/nuevo-trabajo', element: <NuevoTrabajo /> },

  // Rutas CON header/navbar
  {
    element: <AppLayout />,
    children: [
      { path: '/ofertas', element: <Ofertas /> },
      {path: '/InicioContratador', element: <InicioContratador/>}
      // acá inicio, chats, perfil...
    ],
  },
]);

export default router;