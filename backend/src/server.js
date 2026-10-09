import dotenv from 'dotenv';
dotenv.config();

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

const app  = express();
const port = process.env.PORT || 3000;

// TODO: en producción restringir a { origin: process.env.FRONTEND_URL }
app.use(cors());
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

app.listen(port, () => console.log(`LaburApp backend running at http://localhost:${port}`));

export default app;
