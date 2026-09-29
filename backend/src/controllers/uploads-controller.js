// backend/src/controllers/uploads-controller.js
import { Router } from 'express';
import { uploadFotos, uploadToStorage } from '../middlewares/upload-middleware.js';

const router = Router();

// POST /api/uploads (multipart/form-data, campo "fotos", hasta 2 archivos)
router.post('/', uploadFotos.array('fotos', 2), async (req, res) => {
  try {
    const urls = await Promise.all((req.files ?? []).map(uploadToStorage));
    res.status(201).json({ urls });
  } catch (error) {
    console.error('Error in POST /uploads:', error.message);
    // Falla de Supabase Storage (no del cliente): no es un 400.
    res.status(502).json({ error: error.message });
  }
});

// Errores de multer (tamaño, cantidad, tipo de archivo) llegan acá.
router.use((err, req, res, next) => {
  console.error('Error de upload:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'La imagen supera los 5 MB' });
  }
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Solo se pueden subir hasta 2 imágenes' });
  }
  res.status(400).json({ error: err.message || 'Error al subir las imágenes' });
});

export default router;
