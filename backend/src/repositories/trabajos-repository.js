// backend/src/repositories/trabajos-repository.js
import Db from './db-pg.js';

export default class TrabajosRepository {
  constructor() {
    this.db = new Db();
  }

// Devuelve todos los trabajos de un empleador determinado filtrados por estado
async getJobsByEmployerAndStatus(employerId, status) {
    // Usamos subconsultas (en vez de JOIN + GROUP BY) para: (a) no inflar el COUNT
    // por el cruce con imagenes_trabajo, y (b) sumar los avatares de los primeros
    // 3 postulantes para mostrarlos en la tarjeta.
    const sql = `
      SELECT
        t.id,
        t.titulo          AS title,
        t.programado_para AS scheduled_at,
        (SELECT COUNT(*) FROM postulaciones p WHERE p.id_trabajo = t.id) AS applicants_count,
        (SELECT MIN(i.url_imagen) FROM imagenes_trabajo i WHERE i.id_trabajo = t.id) AS image_url,
        COALESCE((
          SELECT json_agg(sub.url_avatar)
          FROM (
            SELECT u.url_avatar
            FROM postulaciones p
            JOIN usuarios u ON u.id = p.id_trabajador
            WHERE p.id_trabajo = t.id
            ORDER BY p.postulado_en ASC
            LIMIT 3
          ) sub
        ), '[]') AS applicant_avatars
      FROM trabajos t
      WHERE t.id_contratante = $1
        AND t.estado         = $2
      ORDER BY t.programado_para ASC
    `;

    // en el parámetro $1 se pasa el ID del empleador y en $2 el estado. EN el 2 Se pasa "proxima" o "activa"
    
    return await this.db.queryAll(sql, [employerId, status]);
  }

  // ACÁ AGREGUÉ
  // Todas las ofertas de un contratante (cualquier estado) para la pantalla "Ofertas".
  // Misma forma que getJobsByEmployerAndStatus (la necesita JobCard), pero sin filtrar por
  // estado, e incluyendo 'estado' para que el frontend agrupe en Próximas/Activas.
  async getAllJobsByEmployer(employerId) {
    const sql = `
      SELECT
        t.id,
        t.titulo          AS title,
        t.estado,
        t.programado_para AS scheduled_at,
        (SELECT COUNT(*) FROM postulaciones p WHERE p.id_trabajo = t.id) AS applicants_count,
        (SELECT MIN(i.url_imagen) FROM imagenes_trabajo i WHERE i.id_trabajo = t.id) AS image_url,
        COALESCE((
          SELECT json_agg(sub.url_avatar)
          FROM (
            SELECT u.url_avatar
            FROM postulaciones p
            JOIN usuarios u ON u.id = p.id_trabajador
            WHERE p.id_trabajo = t.id
            ORDER BY p.postulado_en ASC
            LIMIT 3
          ) sub
        ), '[]') AS applicant_avatars
      FROM trabajos t
      WHERE t.id_contratante = $1
      ORDER BY t.programado_para ASC
    `;
    return await this.db.queryAll(sql, [employerId]);
  }
  // ACÁ YA NO

  // ACÁ AGREGUÉ
  // Trabajos de un contratante para la home ("Tus Trabajos").
  // Devuelve la forma que espera HomeJobCard: { id, image_url, title, description, estado }.
  // El estado crudo se mapea a status ('PENDIENTE'/'FINALIZADO') en el service.
  async getJobsByEmployer(employerId) {
    const sql = `
      SELECT
        t.id,
        MIN(i.url_imagen) AS image_url,
        t.titulo          AS title,
        t.descripcion     AS description,
        t.estado
      FROM trabajos t
      LEFT JOIN imagenes_trabajo i ON i.id_trabajo = t.id
      WHERE t.id_contratante = $1
      GROUP BY t.id
      ORDER BY t.programado_para DESC
    `;
    return await this.db.queryAll(sql, [employerId]);
  }
  // ACÁ YA NO

   // Trabajos abiertos para que un trabajador los descubra (Home / Buscar).
  // Sin auth -> NO joinea usuarios (no exponer datos del contratante a
  // cualquiera sin loguearse). idCategoria es opcional: sin filtro trae
  // todos los abiertos (feed "Changas disponibles" del Home).
  async buscarAbiertos(idCategoria) {
    const values = [];
    let filtroCategoria = '';

    if (idCategoria) {
      values.push(idCategoria);
      filtroCategoria = `AND t.id_categoria = $${values.length}`;
    }

    const sql = `
      SELECT
        t.id,
        t.titulo          AS title,
        t.descripcion     AS description,
        t.presupuesto     AS budget,
        t.programado_para AS scheduled_at,
        t.direccion       AS address,
        t.id_categoria,
        c.nombre          AS category,
        l.nombre          AS localidad,
        pr.nombre         AS provincia,
        (SELECT MIN(i.url_imagen) FROM imagenes_trabajo i WHERE i.id_trabajo = t.id) AS image_url
      FROM trabajos t
      LEFT JOIN categorias c ON c.id = t.id_categoria
      LEFT JOIN localidades l ON l.id = t.id_localidad
      LEFT JOIN provincias pr ON pr.id = l.id_provincia
      WHERE t.estado = 'abierto'
      ${filtroCategoria}
      ORDER BY t.creado_en DESC
    `;

    return await this.db.queryAll(sql, values);
  }

  // Detalle completo de un trabajo (pantalla "Detalle" del contratador).
   async getJobById(jobId) {

    const sql = `
      SELECT
        t.id,
        t.titulo           AS title,
        t.descripcion      AS description,
        t.estado,
        t.presupuesto      AS budget,
        t.programado_para  AS scheduled_at,
        t.prioridad        AS priority,
        t.duracion         AS duration,
        t.direccion        AS address,
        t.lat,
        t.lng,
        t.id_categoria,
        t.id_contratante,
        c.nombre           AS category,
        l.nombre           AS localidad,
        pr.nombre          AS provincia,

        emp.nombre_completo         AS employer_name,
        emp.url_avatar              AS employer_avatar,
        emp.verificado              AS employer_verificado,
        emp.prom_calif_contratante  AS employer_rating,

        (SELECT COUNT(*) FROM trabajos t2 WHERE t2.id_contratante = t.id_contratante) AS employer_jobs_count,
        (SELECT COUNT(*) FROM postulaciones p WHERE p.id_trabajo = t.id) AS applicants_count,

        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', i.id,
              'url', i.url_imagen,
              'order', i.orden
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS images

      FROM trabajos t

      LEFT JOIN categorias c
        ON c.id = t.id_categoria

      LEFT JOIN localidades l
        ON l.id = t.id_localidad

      LEFT JOIN provincias pr
        ON pr.id = l.id_provincia

      LEFT JOIN imagenes_trabajo i
        ON i.id_trabajo = t.id

      LEFT JOIN usuarios emp
        ON emp.id = t.id_contratante

      WHERE t.id = $1

      GROUP BY t.id, c.nombre, l.nombre, pr.nombre, emp.nombre_completo, emp.url_avatar, emp.verificado, emp.prom_calif_contratante
    `;

    return await this.db.queryOne(sql, [jobId]);
  }

  // Devuelve el id del contratador dueño del trabajo (o null si no existe).
  // Se usa para chequear propiedad antes de mostrar/tocar postulaciones.
  async getOwnerId(jobId) {
    const sql = `SELECT id_contratante FROM trabajos WHERE id = $1`;
    const row = await this.db.queryOne(sql, [jobId]);
    return row ? row.id_contratante : null;
  }

  // Marca un trabajo 'activa' como 'finalizado' y cierra su contrato
  // ('activo' -> 'completado'). Ambas escrituras en una sola transacción:
  // sin esto, un contrato podría quedar 'activo' para siempre aunque el
  // trabajo ya esté finalizado, y las stats del perfil (que cuentan
  // contratos 'completado') seguirían mostrando 0.
  async completarTrabajo(jobId) {
    return await this.db.withTransaction(async (txDb) => {

      const updated = await txDb.queryOne(
        `UPDATE trabajos SET estado = 'finalizado', actualizado_en = NOW()
         WHERE id = $1
         RETURNING id`,
        [jobId]
      );

      if (!updated) return null;

      await txDb.queryAll(
        `UPDATE contratos SET estado = 'completado', completado_en = NOW()
         WHERE id_trabajo = $1 AND estado = 'activo'`,
        [jobId]
      );

      return updated.id;
    });
  }

  // ACÁ AGREGUÉ
  // Crea un trabajo. NO inserta 'estado' a propósito: usa el DEFAULT de la tabla ('abierto').
  async createJob(entity) {
    const sql = `
      INSERT INTO trabajos (
        id_contratante,
        id_categoria,
        titulo,
        descripcion,
        id_localidad,
        presupuesto,
        programado_para,
        prioridad,
        duracion,
        direccion,
        lat,
        lng
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const values = [
      entity.id_contratante,
      entity.id_categoria,
      entity.titulo,
      entity.descripcion ?? null,
      entity.id_localidad ?? null,
      entity.presupuesto ?? null,
      entity.programado_para ?? null,
      entity.prioridad ?? 'normal',
      entity.duracion ?? null,
      entity.direccion ?? null,
      entity.lat ?? null,
      entity.lng ?? null,
    ];

    return await this.db.queryReturnId(sql, values);
  }

  // Inserta todas las fotos en UNA sola query (multi-row). Si no hay URLs, no hace nada.
  // orden = índice de la foto en el array. Recibe "db" para poder reusarse tanto suelta
  // como dentro de una transacción (updateJobWithImages le pasa el client transaccional).
  async addImagesToJob(jobId, urls, db = this.db) {
    if (!urls || urls.length === 0) return;

    // Arma "($1, $2, $3), ($1, $4, $5), ..." -> $1 es siempre el jobId.
    const tuples = urls.map(
      (_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`
    );
    const values = [jobId];
    urls.forEach((url, i) => {
      values.push(url, i);
    });

    const sql = `
      INSERT INTO imagenes_trabajo (id_trabajo, url_imagen, orden)
      VALUES ${tuples.join(', ')}
    `;

    return await db.queryAll(sql, values);
  }
  // ACÁ YA NO

  // Actualiza los datos de un trabajo y reemplaza sus fotos, todo en una sola transacción:
  // si el reemplazo de fotos falla, el UPDATE de los datos también se revierte (no queda
  // el trabajo con los datos nuevos pero las fotos borradas a mitad de camino).
  async updateJobWithImages(jobId, entity, urls) {
    return await this.db.withTransaction(async (txDb) => {
      const updateSql = `
        UPDATE trabajos
        SET
          titulo          = $2,
          descripcion     = $3,
          id_categoria    = $4,
          presupuesto     = $5,
          programado_para = $6,
          prioridad       = $7,
          duracion        = $8,
          direccion       = $9,
          lat             = $10,
          lng             = $11,
          actualizado_en  = NOW()
        WHERE id = $1
        RETURNING id
      `;

      const updateValues = [
        jobId,
        entity.titulo,
        entity.descripcion ?? null,
        entity.id_categoria,
        entity.presupuesto ?? null,
        entity.programado_para ?? null,
        entity.prioridad ?? 'normal',
        entity.duracion ?? null,
        entity.direccion ?? null,
        entity.lat ?? null,
        entity.lng ?? null,
      ];

      const updated = await txDb.queryOne(updateSql, updateValues);
      if (!updated) return null;

      await txDb.queryAll('DELETE FROM imagenes_trabajo WHERE id_trabajo = $1', [jobId]);
      await this.addImagesToJob(jobId, urls, txDb);

      return updated.id;
    });
  }

}