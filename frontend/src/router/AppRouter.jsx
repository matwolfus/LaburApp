// TODO: AppRouter with role-based routing
// frontend/src/router/index.jsx

//a medida que agreguen nuevas pantallas, las agregás en router/index.jsx como una línea más:
//{ path: '/contratador/nueva-pantalla', element: <NuevaPantalla /> },

import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Ofertas from '../pages/contratador/Ofertas';

const router = createBrowserRouter([
  // Rutas SIN header/navbar (login, registro...)
  // { path: '/login', element: <Login /> },

  // Rutas CON header/navbar
  {
    element: <AppLayout />,
    children: [
      { path: '/ofertas', element: <Ofertas /> },
      // acá inicio, chats, perfil...
    ],
  },
]);

export default router;