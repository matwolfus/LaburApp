import Db from './db-pg.js';

export default class UsuariosRepository {

    constructor() {
        this.db = new Db();
    }
    
    async getByEmail(email) {

    const sql = `
        SELECT
            id,
            email,
            contrasena
        FROM usuarios
        WHERE email = $1
    `;

    return await this.db.queryOne(sql, [email]);
}
    async createUser(
        nombre,
        apellido,
        email,
        contrasena
    ) {

        const sql = `
            INSERT INTO usuarios (
                nombre_completo,
                email,
                contrasena,
                creado_en,
                actualizado_en
            )
            VALUES (
                $1,
                $2,
                $3,
                NOW(),
                NOW()
            )
            RETURNING id
        `;

        return await this.db.queryReturnId(
            sql,
            [
                `${nombre} ${apellido}`,
                email,
                contrasena
            ]
        );
    }
}