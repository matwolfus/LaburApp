import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import trabajosRouter from './controllers/trabajos-controller.js';
import postulacionesController from './controllers/postulaciones-controller.js';


const app  = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/trabajos', trabajosRouter);


app.use('/api/postulaciones', postulacionesController);

app.listen(port, () => console.log(`LaburApp backend running at http://localhost:${port}`));

