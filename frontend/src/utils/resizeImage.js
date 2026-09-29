// Redimensiona y comprime una imagen en el cliente antes de subirla, así una
// foto de celular (varios MB) entra bajo el límite del backend.
// Devuelve un File JPEG con el lado mayor <= maxSize.
export async function resizeImage(file, { maxSize = 800, quality = 0.8 } = {}) {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * escala);
  const height = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  // Fondo blanco: un PNG/WebP con transparencia se vería negro en JPEG.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error('No se pudo procesar la imagen.');

  const nombre = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], nombre, { type: 'image/jpeg' });
}
