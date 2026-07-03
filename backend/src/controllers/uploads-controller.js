// backend/src/controllers/uploads-controller.js
import { Router } from 'express';
import { uploadFotos, buildPublicUrl } from '../middlewares/upload-middleware.js';

const router = Router();

// POST /api/uploads (multipart/form-data, campo "fotos", hasta 2 archivos)
router.post('/', uploadFotos.array('fotos', 2), (req, res) => {
  try {
    const urls = (req.files ?? []).map((file) => buildPublicUrl(file.filename));
    res.status(201).json({ urls });
  } catch (error) {
    console.error('Error in POST /uploads:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Errores de multer (tamaño, cantidad, tipo de archivo) llegan acá.
router.use((err, req, res, next) => {
  console.error('Error de upload:', err.message);
  res.status(400).json({ error: err.message || 'Error al subir las imágenes' });
});

export default router;
