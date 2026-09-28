// backend/src/controllers/mensajes-controller.js
import { Router } from 'express';
import MensajesService from '../services/mensajes-service.js';
import NotificacionesService from '../services/notificaciones-service.js';
import authMiddleware from '../middlewares/auth-middleware.js';

const router = Router();
const service = new MensajesService();
const notificacionesService = new NotificacionesService();

router.get('/conversaciones', authMiddleware, async (req, res) => {
  try {
    const conversaciones = await service.getConversacionesAsync(req.userId);
    res.json(conversaciones);
  } catch (error) {
    console.error('Error in GET /mensajes/conversaciones:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/contrato/:idContrato', authMiddleware, async (req, res) => {
  try {
    const desdeId = req.query.desde ? Number(req.query.desde) : undefined;
    const mensajes = await service.getMensajesAsync(req.params.idContrato, req.userId, desdeId);
    res.json(mensajes);
  } catch (error) {
    console.error('Error in GET /mensajes/contrato/:idContrato:', error.message);
    res.status(error.status ?? 400).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { id_contrato, cuerpo } = req.body;

    const mensaje = await service.crearMensajeAsync(id_contrato, req.userId, cuerpo);

    // Notificación DESPUÉS del insert, en su propio try/catch (mismo
    // criterio que resenas-controller.js/trabajos-controller.js): un fallo
    // acá no debe convertir un mensaje ya guardado en un error.
    try {
      const idOtro = await service.getOtroParticipanteAsync(id_contrato, req.userId);
      if (idOtro) {
        await notificacionesService.crearAsync({
          id_usuario: idOtro,
          tipo: 'nuevo_mensaje',
          titulo: 'Tenés un mensaje nuevo',
          cuerpo: null,
          id_referencia: id_contrato,
        });
      }
    } catch (notifError) {
      console.error('Error notificando nuevo mensaje:', notifError);
    }

    return res.status(201).json(mensaje);
  } catch (error) {
    console.error('Error in POST /mensajes:', error.message);
    return res.status(error.status ?? 400).json({ error: error.message });
  }
});

export default router;
