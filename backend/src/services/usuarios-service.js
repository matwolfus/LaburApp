import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UsuariosRepository from '../repositories/usuarios-repository.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../configs/jwt-config.js';

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

        if (!this.validateEmail(email)) {
        return {
            success: false,
            errorCode: 'INVALID_EMAIL'
        };
}
        if (!user) {
            return {
                success: false,
                errorCode: 'EMAIL_NOT_FOUND'
            };
        }

        const passwordOk = await bcrypt.compare(password, user.contrasena);

        if (!passwordOk) {
            return {
                success: false,
                errorCode: 'INVALID_PASSWORD'
            };
        }

        const token = jwt.sign(
            {
                userId: user.id,
                rol: user.rol
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return {
            success: true,
            token,
            userId: user.id,
            rol: user.rol
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

    validateEmail(email) {return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);}

    async register(
        nombre,
        apellido,
        email,
        telefono,
        contrasena,
        confirmacion,
        rol
    ) {

        if (!this.validateEmail(email)) {
        return {
            success: false,
            errorCode: 'INVALID_EMAIL'
        };
        }

        if (rol !== 'contratador' && rol !== 'trabajador') {
            return {
                success: false,
                errorCode: 'INVALID_ROL'
            };
        }

        const existingUser = await this.repository.getByEmail(email);

        if (existingUser) {

            return {
                success: false,
                errorCode: 'EMAIL_ALREADY_EXISTS'
            };
        }

        const telefonoLimpio = telefono.replace(/\D/g, '');

        if (telefonoLimpio.length !== 10) {

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

        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        const userId =
            await this.repository.createUser(
                nombre,
                apellido,
                email,
                telefono,
                contrasenaHash,
                rol
            );

        const token = jwt.sign(
            { userId, rol },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return {
            success: true,
            token,
            userId
        };
    }

    async getUserById(id) {
        return await this.repository.getById(id);
    }

    async getRecommendedWorkersAsync() {
        const workers = await this.repository.getRecommendedWorkers();
        // Refuerzo del contrato: rating siempre number (el ::float ya lo asegura,
        // pero esto evita que una regresión en la query rompa rating.toFixed(1)).
        return workers.map((w) => ({ ...w, rating: Number(w.rating) }));
    }

    async getPerfil(idUsuario) {
        return await this.repository.getPerfil(idUsuario);
    }

    async updatePerfil(idUsuario, datos) {

    const usuario = await this.repository.getById(idUsuario);

    if (!usuario) {
        return null;
    }

    return await this.repository.updatePerfil(idUsuario, datos);

    }
}