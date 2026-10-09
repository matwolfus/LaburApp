// backend/src/repositories/mensajes-repository.js
import Db from './db-pg.js';

// Estados de postulación en los que el chat admite mensajes nuevos. En
// 'retirado' / 'rechazado' el historial se puede leer pero no escribir.
export const ESTADOS_CHAT_ABIERTO = ['pendiente', 'aceptado', 'por_reconfirmar'];

export default class MensajesRepository {
  constructor() {
    this.db = new Db();
  }

  // Lista de conversaciones del usuario: un chat por postulación de la que
  // participa (como contratante dueño del trabajo o como trabajador que se
  // postuló), con el último mensaje, cantidad de no leídos, y datos de la
  // otra persona / del trabajo. Incluye las postulaciones aceptadas aunque
  // no tengan mensajes todavía (para poder arrancar la conversación).
  async getConversaciones(idUsuario) {
    const sql = `
      SELECT
        p.id AS id_postulacion,
        p.estado AS estado_postulacion,
        (p.estado = ANY($2::text[])) AS puede_escribir,
        t.titulo AS titulo_trabajo,
        u.id AS otro_id,
        u.nombre_completo AS otro_nombre,
        u.url_avatar AS otro_avatar,
        ult.cuerpo AS ultimo_mensaje,
        ult.enviado_en AS ultimo_mensaje_en,
        (SELECT COUNT(*) FROM mensajes m WHERE m.id_postulacion = p.id AND m.id_remitente <> $1 AND m.leido_en IS NULL)::int AS no_leidos
      FROM postulaciones p
      JOIN trabajos t ON t.id = p.id_trabajo
      JOIN usuarios u ON u.id = (CASE WHEN t.id_contratante = $1 THEN p.id_trabajador ELSE t.id_contratante END)
      LEFT JOIN LATERAL (
        SELECT m.cuerpo, m.enviado_en FROM mensajes m
        WHERE m.id_postulacion = p.id
        ORDER BY m.enviado_en DESC LIMIT 1
      ) ult ON TRUE
      WHERE (t.id_contratante = $1 OR p.id_trabajador = $1)
        AND (ult.enviado_en IS NOT NULL OR p.estado = 'aceptado')
      ORDER BY COALESCE(ult.enviado_en, p.postulado_en) DESC
    `;
    return await this.db.queryAll(sql, [idUsuario, ESTADOS_CHAT_ABIERTO]);
  }

  // Cabecera de un chat (otra persona, trabajo, si se puede escribir) desde
  // el punto de vista de idUsuario. Sirve también para chats sin mensajes.
  async getChatInfo(idPostulacion, idUsuario) {
    const sql = `
      SELECT
        p.id AS id_postulacion,
        p.estado AS estado_postulacion,
        (p.estado = ANY($3::text[])) AS puede_escribir,
        t.titulo AS titulo_trabajo,
        u.id AS otro_id,
        u.nombre_completo AS otro_nombre,
        u.url_avatar AS otro_avatar
      FROM postulaciones p
      JOIN trabajos t ON t.id = p.id_trabajo
      JOIN usuarios u ON u.id = (CASE WHEN t.id_contratante = $2 THEN p.id_trabajador ELSE t.id_contratante END)
      WHERE p.id = $1
    `;
    return await this.db.queryOne(sql, [idPostulacion, idUsuario, ESTADOS_CHAT_ABIERTO]);
  }

  // Mensajes de una postulación, más viejo a más nuevo. Si viene desdeId,
  // solo los posteriores a ese id (para el polling incremental de ChatIndividual).
  async getMensajes(idPostulacion, desdeId) {
    const values = [idPostulacion];
    let filtroDesde = '';
    if (desdeId) {
      values.push(desdeId);
      filtroDesde = `AND m.id > $${values.length}`;
    }

    const sql = `
      SELECT
        m.id,
        m.id_remitente,
        m.cuerpo,
        m.enviado_en,
        m.leido_en,
        u.nombre_completo AS remitente_nombre,
        u.url_avatar AS remitente_avatar
      FROM mensajes m
      JOIN usuarios u ON u.id = m.id_remitente
      WHERE m.id_postulacion = $1
      ${filtroDesde}
      ORDER BY m.id ASC
    `;
    return await this.db.queryAll(sql, values);
  }

  // id_contrato se completa con el contrato activo de la postulación, si
  // existe (antes de aceptar no hay contrato y queda null).
  async crear(idPostulacion, idRemitente, cuerpo) {
    const sql = `
      INSERT INTO mensajes (id_postulacion, id_contrato, id_remitente, cuerpo, enviado_en)
      VALUES (
        $1,
        (SELECT c.id FROM contratos c WHERE c.id_postulacion = $1 AND c.estado = 'activo' ORDER BY c.creado_en DESC LIMIT 1),
        $2,
        $3,
        NOW()
      )
      RETURNING id, enviado_en
    `;
    return await this.db.queryOne(sql, [idPostulacion, idRemitente, cuerpo]);
  }

  // Marca como leídos los mensajes de LA OTRA persona (nunca los propios).
  async marcarLeidos(idPostulacion, idUsuario) {
    await this.db.queryAll(
      `UPDATE mensajes SET leido_en = NOW()
       WHERE id_postulacion = $1 AND id_remitente <> $2 AND leido_en IS NULL`,
      [idPostulacion, idUsuario]
    );
  }

  // Para que el service valide que idUsuario participa del chat (es el
  // contratante dueño del trabajo o el trabajador de la postulación) antes
  // de mostrarle/dejarlo escribir mensajes.
  async getParticipantes(idPostulacion) {
    return await this.db.queryOne(
      `SELECT t.id_contratante, p.id_trabajador, p.estado
       FROM postulaciones p
       JOIN trabajos t ON t.id = p.id_trabajo
       WHERE p.id = $1`,
      [idPostulacion]
    );
  }

  // Total de mensajes sin leer del usuario (punto en "Chats" del BottomNav).
  async getNoLeidosCount(idUsuario) {
    return await this.db.queryRowCount(
      `SELECT COUNT(*) AS count
       FROM mensajes m
       JOIN postulaciones p ON p.id = m.id_postulacion
       JOIN trabajos t ON t.id = p.id_trabajo
       WHERE (t.id_contratante = $1 OR p.id_trabajador = $1)
         AND m.id_remitente <> $1
         AND m.leido_en IS NULL`,
      [idUsuario]
    );
  }
}
