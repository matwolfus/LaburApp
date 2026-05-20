// TODO: trabajos repository
import Db from './db-pg.js'

export default class trabajosRepository{
    constructor()
    {
        console.log('Estoy parado en el constructor deL repository de trabajo')
    };
        this.Db= new Db
}

obtenerTrabajosPorContratante() = async (
id_contratante

) => {
    const sql = ''
}