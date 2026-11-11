// backend/src/controllers/mensajes-controller.js
import { Router } from 'express';
import MensajesService from '../services/mensajes-service.js';
import NotificacionesService from '../services/notificaciones-service.js';
import authMiddleware from '../middlewares/auth-middleware.js';
import { idParam } from '../middlewares/error-middleware.js';
import { parseId, parseOptionalId } from '../helpers/http-error.js';

const router = Router();
const service = new MensajesService();
const notificacionesService = new NotificacionesService();

router.param('idPostulacion', idParam);

// El chat está atado a una postulación (no al contrato): así el contratante
// y el postulante pueden hablar antes de que lo acepten.
// Los errores (HttpError del service o fallas del servidor) los responde el
// middleware central de errores.

router.get('/conversaciones', authMiddleware, async (req, res) => {
  res.json(await service.getConversacionesAsync(req.userId));
});

// Total de mensajes sin leer (punto en "Chats" del BottomNav).
router.get('/no-leidos/count', authMiddleware, async (req, res) => {
  const count = await service.getNoLeidosCountAsync(req.userId);
  res.json({ count });
});

// Cabecera del chat: otra persona, trabajo y si se puede escribir.
router.get('/postulacion/:idPostulacion/info', authMiddleware, async (req, res) => {
  res.json(await service.getChatInfoAsync(req.params.idPostulacion, req.userId));
});

router.get('/postulacion/:idPostulacion', authMiddleware, async (req, res) => {
  const desdeId = parseOptionalId(req.query.desde, 'desde');
  res.json(await service.getMensajesAsync(req.params.idPostulacion, req.userId, desdeId));
});

router.post('/', authMiddleware, async (req, res) => {
  const idPostulacion = parseId(req.body?.id_postulacion, 'id_postulacion');
  const cuerpo = typeof req.body?.cuerpo === 'string' ? req.body.cuerpo : '';

  const { mensaje, idOtro } = await service.crearMensajeAsync(idPostulacion, req.userId, cuerpo);

  // Notificación DESPUÉS del insert, en su propio try/catch: un fallo acá no
  // debe convertir un mensaje ya guardado en un error.
  try {
    if (idOtro) {
      await notificacionesService.crearAsync({
        id_usuario: idOtro,
        tipo: 'nuevo_mensaje',
        titulo: 'Tenés un mensaje nuevo',
        cuerpo: null,
        id_referencia: idPostulacion,
        // Ver migracion-corregir.sql: marca que id_referencia ya es una postulación.
        extra: { ref_es_postulacion: true },
      });
    }
  } catch (notifError) {
    console.error('Error notificando nuevo mensaje:', notifError);
  }

  return res.status(201).json(mensaje);
});

export default router;
