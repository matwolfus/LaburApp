// TODO: AppRouter with role-based routing
// frontend/src/router/index.jsx

//a medida que agreguen nuevas pantallas, las agregás en router/index.jsx como una línea más:
//{ path: '/contratador/nueva-pantalla', element: <NuevaPantalla /> },

import { createBrowserRouter } from 'react-router-dom';
import Ofertas from '../pages/contratador/Ofertas';

const router = createBrowserRouter([
  {
    path: '/contratador/ofertas',
    element: <Ofertas />,
  },
]);

export default router;