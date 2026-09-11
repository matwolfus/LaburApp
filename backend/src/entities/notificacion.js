export default class NotificacionEntity {

    id;
    id_usuario;
    tipo;
    titulo;
    cuerpo;
    id_referencia;
    leido;
    creado_en;

    constructor(
        id,
        id_usuario,
        tipo,
        titulo,
        cuerpo,
        id_referencia,
        leido,
        creado_en
    ) {

        this.id = id;
        this.id_usuario = id_usuario;
        this.tipo = tipo;
        this.titulo = titulo;
        this.cuerpo = cuerpo;
        this.id_referencia = id_referencia;
        this.leido = leido;
        this.creado_en = creado_en;
    }
}
