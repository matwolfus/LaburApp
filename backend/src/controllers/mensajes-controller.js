// backend/src/controllers/mensajes-controller.js
// Solo HTTP. Reglas (participantes, chat cerrado, avisos) en MensajesService.
import { Router } from 'express';
import MensajesService from '../services/mensajes-service.js';
import authMiddleware from '../middlewares/auth-middleware.js';
import { idParam } from '../middlewares/error-middleware.js';
import { parseId, parseOptionalId } from '../helpers/http-error.js';

const router = Router();
const service = new MensajesService();

router.param('idPostulacion', idParam);

// El chat está atado a una postulación (no al contrato): así el contratador
// y el postulante pueden hablar antes de que lo acepten.

router.get('/conversaciones', authMiddleware, async (req, res) => {
  res.json(await service.getConversacionesAsync(req.userId));
});

// Total de mensajes sin leer (punto en "Chats" del BottomNav).
router.get('/no-leidos/count', authMiddleware, async (req, res) => {
  res.json({ count: await service.getNoLeidosCountAsync(req.userId) });
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
  res.status(201).json(await service.crearMensajeAsync(idPostulacion, req.userId, cuerpo));
});

export default router;
