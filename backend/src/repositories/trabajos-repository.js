// backend/src/repositories/trabajos-repository.js
import Db from './db-pg.js';

export default class TrabajosRepository {
  constructor() {
    this.db = new Db();
  }

// Devuelve todos los trabajos de un empleador determinado filtrados por estado
async getJobsByEmployerAndStatus(employerId, status) {
    const sql = `
      SELECT
        t.id,
        t.titulo          AS title,
        t.programado_para AS scheduled_at,
        COUNT(p.id)       AS applicants_count,
        MIN(i.url_imagen) AS image_url
      FROM trabajos t
      LEFT JOIN postulaciones    p ON p.id_trabajo = t.id
      LEFT JOIN imagenes_trabajo i ON i.id_trabajo = t.id
      WHERE t.id_contratante = $1   
        AND t.estado         = $2
      GROUP BY t.id
      ORDER BY t.programado_para ASC
    `;

    // en el parámetro $1 se pasa el ID del empleador y en $2 el estado. EN el 2 Se pasa "proxima" o "activa"
    
    return await this.db.queryAll(sql, [employerId, status]);
  }

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

   async getJobById(jobId) {


    const sql = `
      SELECT


        t.id,
        t.titulo           AS title,
        t.programado_para  AS scheduled_at,


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


      LEFT JOIN imagenes_trabajo i
        ON i.id_trabajo = t.id


      WHERE t.id = $1


      GROUP BY t.id
    `;


    return await this.db.queryOne(sql, [jobId]);
  }
  

}