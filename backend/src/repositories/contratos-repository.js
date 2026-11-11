// backend/src/repositories/contratos-repository.js
// Único lugar que escribe la tabla contratos. Los otros módulos no la tocan:
// llaman a ContratosService.
//
// Todos los métodos reciben `db` opcional para poder correr dentro de la
// transacción de quien los llama (ej. aceptar una postulación = actualizar
// postulaciones + trabajo + crear contrato, todo junto o nada).
import Db from './db-pg.js';
import { AHORA } from './sql-fechas.js';

export default class ContratosRepository {
    constructor() {
        this.db = new Db();
    }

    async crear({ idTrabajo, idPostulacion, idContratante, idTrabajador, precioAcordado }, db = this.db) {
        return await db.queryReturnId(
            `INSERT INTO contratos (id_trabajo, id_postulacion, id_contratante, id_trabajador, precio_acordado, estado, iniciado_en)
             VALUES ($1, $2, $3, $4, $5, 'activo', ${AHORA})
             RETURNING id`,
            [idTrabajo, idPostulacion, idContratante, idTrabajador, precioAcordado]
        );
    }

    // El trabajador aceptado se bajó: su contrato activo pasa a cancelado.
    async cancelarActivoDePostulacion(idPostulacion, db = this.db) {
        return await db.queryOne(
            `UPDATE contratos SET estado = 'cancelado'
             WHERE id_postulacion = $1 AND estado = 'activo'
             RETURNING id, id_trabajador`,
            [idPostulacion]
        );
    }

    // El contratador canceló el trabajo: se cancela el contrato activo, si hay.
    async cancelarActivoDeTrabajo(idTrabajo, db = this.db) {
        return await db.queryOne(
            `UPDATE contratos SET estado = 'cancelado'
             WHERE id_trabajo = $1 AND estado = 'activo'
             RETURNING id, id_trabajador`,
            [idTrabajo]
        );
    }

    // El contratador marcó el trabajo como completado.
    async completarActivoDeTrabajo(idTrabajo, db = this.db) {
        return await db.queryOne(
            `UPDATE contratos SET estado = 'completado', completado_en = ${AHORA}
             WHERE id_trabajo = $1 AND estado = 'activo'
             RETURNING id, id_trabajador`,
            [idTrabajo]
        );
    }
}
