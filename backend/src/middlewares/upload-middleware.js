// backend/src/middlewares/upload-middleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { HttpError, badRequest } from '../helpers/http-error.js';

// Se mantiene solo para servir (via server.js) fotos ya subidas antes de la
// migración a Supabase Storage, que quedaron guardadas en disco local.
export const UPLOADS_DIR = path.resolve(import.meta.dirname, '../../uploads');
// En Vercel el filesystem es de solo lectura: si no se puede crear, se ignora.
try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch {}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 2;

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'prueba';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Los archivos se guardan en memoria (no en disco): de acá se suben directo a
// Supabase Storage, así la foto queda accesible desde cualquier máquina/deploy
// en vez de vivir solo en el disco del backend que la recibió.
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(badRequest('Solo se permiten imágenes (jpg, png, webp)'));
  }
  cb(null, true);
}

// Prefijo de las URLs públicas de nuestro bucket. Sirve para rechazar URLs
// externas en campos que deberían apuntar a una foto subida por /api/uploads.
const PUBLIC_BUCKET_PREFIX =
  `${(process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')}/storage/v1/object/public/${BUCKET}/`;

export function esUrlDelBucket(url) {
  return typeof url === 'string'
    && !!process.env.SUPABASE_URL
    && url.startsWith(PUBLIC_BUCKET_PREFIX)
    && !url.includes('..');
}

export const uploadFotos = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES },
});

// Sube un archivo ya validado por multer a Supabase Storage y devuelve su URL pública.
// Único punto de la app que traduce "archivo recibido" -> "URL pública".
export async function uploadToStorage(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file.buffer, { contentType: file.mimetype });

  if (error) {
    // El detalle de Supabase queda en el log; al cliente, un mensaje genérico.
    console.error('Error subiendo la imagen a Supabase Storage:', error);
    throw new HttpError(502, 'No se pudo subir la imagen, intentá de nuevo');
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);

  return data.publicUrl;
}
