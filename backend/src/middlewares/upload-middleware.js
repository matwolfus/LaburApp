// backend/src/middlewares/upload-middleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const UPLOADS_DIR = path.resolve(import.meta.dirname, '../../uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 2;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Solo se permiten imágenes (jpg, png, webp)'));
  }
  cb(null, true);
}

export const uploadFotos = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES },
});

// Único punto de la app que traduce "archivo guardado" -> "URL pública".
// Si el día de mañana se migra a otro storage, es el lugar a reescribir.
export function buildPublicUrl(filename) {
  const base = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${base}/uploads/${filename}`;
}
