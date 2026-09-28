// TODO: AppRouter with role-based routing
// frontend/src/router/index.jsx

//a medida que agreguen nuevas pantallas, las agregás en router/index.jsx como una línea más:
//{ path: '/contratador/nueva-pantalla', element: <NuevaPantalla /> },

import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import PrivateRoute from './PrivateRoute';
import Ofertas from '../pages/contratador/Ofertas';
import VerPostulantes from '../pages/contratador/VerPostulantes';
import DetalleTrabajo from '../pages/contratador/DetalleTrabajo';
import Register from '../pages/shared/Register';
import Login from '../pages/shared/Login';
import InicioContratador from '../pages/contratador/InicioContratador';
import NuevoTrabajo from '../pages/contratador/NuevoTrabajo';
import Perfil from '../pages/shared/Perfil';
import EditarPerfil from '../pages/shared/editarPerfil';
import VerPerfil from '../pages/shared/VerPerfil';
import BuscarTrabajo from '../pages/contratador/BuscarTrabajo';
import Notificaciones from '../pages/shared/Notificaciones';
import ChatHistorial from '../pages/shared/ChatHistorial';
import ChatIndividual from '../pages/shared/ChatIndividual';
import Ajustes from '../pages/shared/Ajustes';

import HomeTrabajador from '../pages/trabajador/Home';
import BuscarTrabajos from '../pages/trabajador/BuscarTrabajos';
import DetalleTrabajoTrabajador from '../pages/trabajador/DetalleTrabajo';
import Postularme from '../pages/trabajador/Postularme';
import EstadoTrabajos from '../pages/trabajador/EstadoTrabajos';


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
      { path: '/ofertas/:jobId/detalle', element: <DetalleTrabajo /> },
      { path: '/ofertas/:jobId/editar', element: <NuevoTrabajo /> },
      { path: '/nuevo-trabajo', element: <NuevoTrabajo /> },
      { path: '/perfil/editar', element: <EditarPerfil/>},
      { path: '/trabajador/trabajos/:jobId', element: <DetalleTrabajoTrabajador /> },
      { path: '/trabajador/postularme/:jobId', element: <Postularme /> },
      { path: '/chats/:idContrato', element: <ChatIndividual /> },

      // Con header/navbar
      {
        element: <AppLayout />,
        children: [
          { path: '/ofertas', element: <Ofertas /> },
          { path: '/inicio', element: <InicioContratador /> },
          { path: '/perfil', element: <Perfil />},
          { path: '/perfil/:id', element: <VerPerfil/>},
          { path: '/buscar', element: <BuscarTrabajo /> },
          { path: '/notificaciones', element: <Notificaciones /> },
          { path: '/chats', element: <ChatHistorial /> },
          { path: '/ajustes', element: <Ajustes /> },
          { path: '/trabajador/inicio', element: <HomeTrabajador /> },
          { path: '/trabajador/buscar', element: <BuscarTrabajos /> },
          { path: '/trabajador/estado', element: <EstadoTrabajos /> },
        ],
      },
    ],
  },
]);

export default router;