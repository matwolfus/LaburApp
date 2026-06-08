// TODO: postulacion entity

// TODO: postulacion entity
export default class PostulacionEntity {

    id;
    id_trabajo;
    id_trabajador;
    precio_propuesto;
    estado;
    postulado_en;

    constructor(
        id,
        id_trabajo,
        id_trabajador,
        precio_propuesto,
        estado,
        postulado_en
    ) {

        this.id = id;
        this.id_trabajo = id_trabajo;
        this.id_trabajador = id_trabajador;
        this.precio_propuesto = precio_propuesto;
        this.estado = estado;
        this.postulado_en = postulado_en;
    }
}