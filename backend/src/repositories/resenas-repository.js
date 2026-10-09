// backend/src/repositories/resenas-repository.js
import Db from './db-pg.js';

export default class ResenasRepository {
  constructor() {
    this.db = new Db();
  }

  // Determina si idUsuario puede dejar una reseña sobre el trabajo idTrabajo:
  // tiene que ser el contratante o el trabajador del contrato de ese trabajo,
  // y el contrato tiene que estar 'completado'. idReceptor/esContratante ya
  // salen calculados acá para no tener que volver a resolverlos al crear la
  // reseña.
  async getElegibilidad(idTrabajo, idUsuario) {
    const contrato = await this.db.queryOne(
      // Un trabajo reabierto puede tener un contrato 'cancelado' y otro
      // vigente: se prioriza el completado, después el más reciente. Un
      // contrato cancelado nunca habilita reseña (puedeResenar exige
      // 'completado').
      `SELECT id, id_contratante, id_trabajador, estado
       FROM contratos
       WHERE id_trabajo = $1
       ORDER BY (estado = 'completado') DESC, creado_en DESC
       LIMIT 1`,
      [idTrabajo]
    );

    if (!contrato) {
      return { puedeResenar: false, idContrato: null, idReceptor: null, esContratante: null, yaReseño: false };
    }

    const autorEsContratante = Number(contrato.id_contratante) === Number(idUsuario);
    const autorEsTrabajador = Number(contrato.id_trabajador) === Number(idUsuario);

    if (!autorEsContratante && !autorEsTrabajador) {
      // Ni contratante ni trabajador de este contrato: no participó, no hay nada que reseñar.
      return { puedeResenar: false, idContrato: contrato.id, idReceptor: null, esContratante: null, yaReseño: false };
    }

    const idReceptor = autorEsContratante ? contrato.id_trabajador : contrato.id_contratante;

    const existente = await this.db.queryOne(
      `SELECT id FROM resenas WHERE id_contrato = $1 AND id_autor = $2`,
      [contrato.id, idUsuario]
    );

    return {
      puedeResenar: contrato.estado === 'completado' && !existente,
      idContrato: contrato.id,
      idReceptor,
      // Ojo con la polaridad: es_contratante en la tabla resenas describe la
      // reseña en sí ("es sobre el desempeño del receptor COMO contratante"),
      // no si el autor es el contratante. Eso pasa cuando el AUTOR es el
      // TRABAJADOR (reseñando a su contratante) — es lo opuesto de
      // autorEsContratante. Confirmado contra usuarios-repository.js#getPerfil:
      // resenasTrabajador filtra es_contratante=false (autor=contratante),
      // resenasContratante filtra es_contratante=true (autor=trabajador).
      esContratante: autorEsTrabajador,
      yaReseño: !!existente,
    };
  }

  // No atrapa el error de UNIQUE (id_contrato, id_autor) acá a propósito:
  // sube tal cual para que el service lo traduzca por código (23505), no
  // por texto — ver resenas-service.js.
  async crear({ idContrato, idAutor, idReceptor, esContratante, calificacion, comentario }) {
    const sql = `
      INSERT INTO resenas (id_contrato, id_autor, id_receptor, es_contratante, calificacion, comentario, creado_en)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id
    `;
    return await this.db.queryReturnId(sql, [idContrato, idAutor, idReceptor, esContratante, calificacion, comentario ?? null]);
  }
}
