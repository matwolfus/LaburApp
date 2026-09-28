// backend/src/repositories/mensajes-repository.js
import Db from './db-pg.js';

export default class MensajesRepository {
  constructor() {
    this.db = new Db();
  }

  // Lista de conversaciones del usuario: un chat por contrato del que
  // participa (como contratante o trabajador), con el último mensaje,
  // cantidad de no leídos, y datos de la otra persona / del trabajo.
  // Incluye contratos sin mensajes todavía (para poder arrancar la
  // conversación), ordenados por último mensaje si hay, o por fecha del
  // contrato si no.
  async getConversaciones(idUsuario) {
    const sql = `
      SELECT
        c.id AS id_contrato,
        t.titulo AS titulo_trabajo,
        u.id AS otro_id,
        u.nombre_completo AS otro_nombre,
        u.url_avatar AS otro_avatar,
        (SELECT m.cuerpo FROM mensajes m WHERE m.id_contrato = c.id ORDER BY m.enviado_en DESC LIMIT 1) AS ultimo_mensaje,
        (SELECT m.enviado_en FROM mensajes m WHERE m.id_contrato = c.id ORDER BY m.enviado_en DESC LIMIT 1) AS ultimo_mensaje_en,
        (SELECT COUNT(*) FROM mensajes m WHERE m.id_contrato = c.id AND m.id_remitente <> $1 AND m.leido_en IS NULL)::int AS no_leidos
      FROM contratos c
      JOIN trabajos t ON t.id = c.id_trabajo
      JOIN usuarios u ON u.id = (CASE WHEN c.id_contratante = $1 THEN c.id_trabajador ELSE c.id_contratante END)
      WHERE c.id_contratante = $1 OR c.id_trabajador = $1
      ORDER BY COALESCE(
        (SELECT m.enviado_en FROM mensajes m WHERE m.id_contrato = c.id ORDER BY m.enviado_en DESC LIMIT 1),
        c.creado_en
      ) DESC
    `;
    return await this.db.queryAll(sql, [idUsuario]);
  }

  // Mensajes de un contrato, más viejo a más nuevo. Si viene desdeId, solo
  // los posteriores a ese id (para el polling incremental de ChatIndividual).
  async getMensajes(idContrato, desdeId) {
    const values = [idContrato];
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
      WHERE m.id_contrato = $1
      ${filtroDesde}
      ORDER BY m.enviado_en ASC
    `;
    return await this.db.queryAll(sql, values);
  }

  async crear(idContrato, idRemitente, cuerpo) {
    const sql = `
      INSERT INTO mensajes (id_contrato, id_remitente, cuerpo, enviado_en)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, enviado_en
    `;
    return await this.db.queryOne(sql, [idContrato, idRemitente, cuerpo]);
  }

  // Marca como leídos los mensajes de LA OTRA persona (nunca los propios).
  async marcarLeidos(idContrato, idUsuario) {
    await this.db.queryAll(
      `UPDATE mensajes SET leido_en = NOW()
       WHERE id_contrato = $1 AND id_remitente <> $2 AND leido_en IS NULL`,
      [idContrato, idUsuario]
    );
  }

  // Para que el service valide que idUsuario participa del contrato antes
  // de mostrarle/dejarlo escribir mensajes (protección contra terceros,
  // mismo criterio que resenas-repository.js#getElegibilidad).
  async getContratoParticipantes(idContrato) {
    return await this.db.queryOne(
      `SELECT id_contratante, id_trabajador FROM contratos WHERE id = $1`,
      [idContrato]
    );
  }
}
