// Tiene que ser el primer import: los imports de ES modules se evalúan antes que
// cualquier línea del archivo, así que un dotenv.config() más abajo llega tarde.
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import trabajosRouter from './controllers/trabajos-controller.js';
import postulacionesController from './controllers/postulaciones-controller.js';
import categoriasRouter from './controllers/categorias-controller.js';
import usuariosRouter from './controllers/usuarios-controller.js';
import localidadesRouter from './controllers/localidades-controller.js';
import provinciasRouter from './controllers/provincias-controller.js';
import uploadsRouter from './controllers/uploads-controller.js';
import notificacionesRouter from './controllers/notificaciones-controller.js';
import resenasRouter from './controllers/resenas-controller.js';
import mensajesRouter from './controllers/mensajes-controller.js';
import { UPLOADS_DIR } from './middlewares/upload-middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error-middleware.js';

const app  = express();
const port = process.env.PORT || 3000;

// CORS: en Vercel front y back comparten dominio, así que no hace falta. Si el
// front se sirve desde otro dominio, FRONTEND_URL lo habilita solo a él (se
// pueden poner varios separados por coma). Sin FRONTEND_URL (desarrollo) queda abierto.
const origenesPermitidos = process.env.FRONTEND_URL?.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(origenesPermitidos?.length ? { origin: origenesPermitidos } : undefined));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api/trabajos', trabajosRouter);

app.use('/api/postulaciones', postulacionesController);

app.use('/api/categorias', categoriasRouter);

app.use('/api/usuarios', usuariosRouter);

app.use('/api/localidades', localidadesRouter);

app.use('/api/provincias', provinciasRouter);

app.use('/api/uploads', uploadsRouter);

app.use('/api/notificaciones', notificacionesRouter);

app.use('/api/resenas', resenasRouter);

app.use('/api/mensajes', mensajesRouter);

// Siempre al final: 404 en JSON y el manejador central de errores.
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => console.log(`LaburApp backend running at http://localhost:${port}`));

export default app;
