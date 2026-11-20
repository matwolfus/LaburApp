// backend/src/services/contratos-service.js
// Reglas de los contratos. Un contrato nace cuando el contratador acepta una
// postulación y termina completado (trabajo finalizado) o cancelado (se bajó
// el trabajador o el contratador canceló el trabajo).
//
// Los métodos reciben la transacción (`tx`) del servicio que los llama: un
// contrato nunca cambia solo, siempre junto con el trabajo o la postulación.
import ContratosRepository from '../repositories/contratos-repository.js';

export default class ContratosService {
    constructor() {
        this.repository = new ContratosRepository();
    }

    // Precio acordado = el precio de la postulación. Desde el P3 toda
    // postulación nueva guarda su precio (el propuesto o, si se postuló "al
    // precio publicado", una copia del presupuesto de ese momento). El
    // fallback al presupuesto actual queda solo para postulaciones viejas
    // que todavía tengan precio_propuesto NULL.
    precioAcordado(postulacion, trabajo) {
        return postulacion.precio_propuesto ?? trabajo.budget ?? null;
    }

    async crearParaPostulacion(postulacion, trabajo, tx) {
        const precioAcordado = this.precioAcordado(postulacion, trabajo);
        if (precioAcordado == null) {
            // No debería pasar: postularse exige precio si el trabajo no tiene presupuesto.
            throw new Error(`Postulación ${postulacion.id} sin precio para el contrato`);
        }
        return await this.repository.crear({
            idTrabajo: postulacion.id_trabajo,
            idPostulacion: postulacion.id,
            idContratante: trabajo.id_contratante,
            idTrabajador: postulacion.id_trabajador,
            precioAcordado,
        }, tx);
    }

    async cancelarPorBajaDelTrabajador(idPostulacion, tx) {
        return await this.repository.cancelarActivoDePostulacion(idPostulacion, tx);
    }

    async cancelarPorCancelacionDelTrabajo(idTrabajo, tx) {
        return await this.repository.cancelarActivoDeTrabajo(idTrabajo, tx);
    }

    async completar(idTrabajo, tx) {
        return await this.repository.completarActivoDeTrabajo(idTrabajo, tx);
    }
}
