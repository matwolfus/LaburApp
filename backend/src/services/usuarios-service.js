import UsuariosRepository from '../repositories/usuarios-repository.js';


const PASSWORD_RULES = {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHARACTER: true
};


export default class UsuariosService {

    constructor() {
        this.repository = new UsuariosRepository();
    }

async login(email, password) {

    const user =
        await this.repository.getByEmail(email);

    if (!user) {

        return {
            success: false,
            errorCode: 'EMAIL_NOT_FOUND'
        };
    }

    if (user.contrasena !== password) {

        return {
            success: false,
            errorCode: 'INVALID_PASSWORD'
        };
    }

    return {
        success: true,
        userId: user.id
    };
}
    validatePassword(password) {

        const validation = {
            minLength:
                password.length >=
                PASSWORD_RULES.MIN_LENGTH,

            uppercase:
                !PASSWORD_RULES.REQUIRE_UPPERCASE ||
                /[A-Z]/.test(password),

            number:
                !PASSWORD_RULES.REQUIRE_NUMBER ||
                /[0-9]/.test(password),

            specialCharacter:
                !PASSWORD_RULES.REQUIRE_SPECIAL_CHARACTER ||
                /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        return {
            valid:
                Object.values(validation)
                    .every(Boolean),

            rules: validation
        };
    }

    async register(
        nombre,
        apellido,
        email,
        telefono,
        contrasena,
        confirmacion
    ) {

        const existingUser =
            await this.repository.getByEmail(email);

        if (existingUser) {

            return {
                success: false,
                errorCode: 'EMAIL_ALREADY_EXISTS'
            };
        }

        const telefonoLimpio = telefono.replace(/\D/g, '');

        if (telefonoLimpio.length !== 8) {

            return {
                success: false,
                errorCode: 'INVALID_PHONE_LENGTH'
            };
        }


        if (contrasena !== confirmacion) {

            return {
                success: false,
                errorCode: 'PASSWORDS_DONT_MATCH'
            };
        }

        const passwordValidation =
            this.validatePassword(contrasena);

        if (!passwordValidation.valid) {

            return {
                success: false,
                errorCode: 'INVALID_PASSWORD',

                passwordRequirements:
                    PASSWORD_RULES,

                passwordValidation:
                    passwordValidation.rules
            };
        }

        const userId =
            await this.repository.createUser(
                nombre,
                apellido,
                email,
                telefono,
                contrasena
            );

        return {
            success: true,
            userId
        };
    }
}