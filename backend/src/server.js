import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import trabajosRouter from './controllers/trabajos-controller.js';
import postulacionesController from './controllers/postulaciones-controller.js';
import categoriasRouter from './controllers/categorias-controller.js';
import usuariosRouter from './controllers/usuarios-controller.js';
import uploadsRouter from './controllers/uploads-controller.js';
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

app.use('/api/uploads', uploadsRouter);

app.listen(port, () => console.log(`LaburApp backend running at http://localhost:${port}`));
