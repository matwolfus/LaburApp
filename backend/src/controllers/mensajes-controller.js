// backend/src/controllers/mensajes-controller.js
import { Router } from 'express';
import { validarIdNumerico } from '../middlewares/error-middleware.js';
import MensajesService from '../services/mensajes-service.js';
import NotificacionesService from '../services/notificaciones-service.js';
import authMiddleware from '../middlewares/auth-middleware.js';

const router = Router();

router.param('idPostulacion', validarIdNumerico);
const service = new MensajesService();
const notificacionesService = new NotificacionesService();

// El chat está atado a una postulación (no al contrato): así el contratante
// y el postulante pueden hablar antes de que lo acepten.

router.get('/conversaciones', authMiddleware, async (req, res, next) => {
  try {
    const conversaciones = await service.getConversacionesAsync(req.userId);
    res.json(conversaciones);
  } catch (error) {
    next(error);
  }
});

// Total de mensajes sin leer (punto en "Chats" del BottomNav).
router.get('/no-leidos/count', authMiddleware, async (req, res, next) => {
  try {
    const count = await service.getNoLeidosCountAsync(req.userId);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// Cabecera del chat: otra persona, trabajo y si se puede escribir.
router.get('/postulacion/:idPostulacion/info', authMiddleware, async (req, res, next) => {
  try {
    const info = await service.getChatInfoAsync(req.params.idPostulacion, req.userId);
    res.json(info);
  } catch (error) {
    next(error);
  }
});

router.get('/postulacion/:idPostulacion', authMiddleware, async (req, res, next) => {
  try {
    const desdeId = req.query.desde ? Number(req.query.desde) : undefined;
    const mensajes = await service.getMensajesAsync(req.params.idPostulacion, req.userId, desdeId);
    res.json(mensajes);
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { id_postulacion, cuerpo } = req.body;

    const { mensaje, idOtro } = await service.crearMensajeAsync(id_postulacion, req.userId, cuerpo);

    // Notificación DESPUÉS del insert, en su propio try/catch (mismo
    // criterio que resenas-controller.js/trabajos-controller.js): un fallo
    // acá no debe convertir un mensaje ya guardado en un error.
    try {
      if (idOtro) {
        await notificacionesService.crearAsync({
          id_usuario: idOtro,
          tipo: 'nuevo_mensaje',
          titulo: 'Tenés un mensaje nuevo',
          cuerpo: null,
          id_referencia: Number(id_postulacion),
          // Ver migracion-corregir.sql: marca que id_referencia ya es una postulación.
          extra: { ref_es_postulacion: true },
        });
      }
    } catch (notifError) {
      console.error('Error notificando nuevo mensaje:', notifError);
    }

    return res.status(201).json(mensaje);
  } catch (error) {
    next(error);
  }
});

export default router;
