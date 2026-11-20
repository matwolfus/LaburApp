// backend/src/controllers/uploads-controller.js
import { Router } from 'express';
import { uploadFotos, uploadToStorage } from '../middlewares/upload-middleware.js';
import authMiddleware from '../middlewares/auth-middleware.js';
import { badRequest } from '../helpers/http-error.js';

const router = Router();

// POST /api/uploads (multipart/form-data, campo "fotos", hasta 2 archivos)
// Requiere sesión: sin esto cualquiera podía subir archivos a nuestro bucket.
// authMiddleware va ANTES de multer para no procesar archivos de un anónimo.
// Los errores de multer (tamaño, cantidad, tipo) y de Supabase los responde
// el middleware central de errores.
router.post('/', authMiddleware, uploadFotos.array('fotos', 2), async (req, res) => {
  if (!req.files?.length) {
    throw badRequest('No se recibió ninguna imagen');
  }
  const urls = await Promise.all(req.files.map(uploadToStorage));
  res.status(201).json({ urls });
});

export default router;
