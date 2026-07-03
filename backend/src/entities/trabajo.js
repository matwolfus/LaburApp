// TODO: trabajo entity
export default class Trabajo {

    constructor(
        id_contratante,
        id_categoria,
        titulo,
        descripcion,
        id_localidad,
        presupuesto,
        estado,
        programado_para,
        // ACÁ AGREGUÉ
        prioridad,
        duracion,
        direccion,
        lat,
        lng
        // ACÁ YA NO
    ) {

        this.id_contratante = id_contratante;
        this.id_categoria = id_categoria;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.id_localidad = id_localidad;
        this.presupuesto = presupuesto;
        this.estado = estado;
        this.programado_para = programado_para;
        // ACÁ AGREGUÉ
        this.prioridad = prioridad;
        this.duracion = duracion;
        this.direccion = direccion;
        this.lat = lat;
        this.lng = lng;
        // ACÁ YA NO
    }
}