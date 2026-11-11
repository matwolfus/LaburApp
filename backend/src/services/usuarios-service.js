import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UsuariosRepository from '../repositories/usuarios-repository.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../configs/jwt-config.js';
import { badRequest, parseId, parseOptionalId } from '../helpers/http-error.js';
import {
    CARACTER_ESPECIAL_REGEX,
    LIMITES,
    normalizarEmail,
    normalizarTelefono,
    textoOpcional,
    textoRequerido,
} from '../helpers/validaciones.js';
import { esUrlDelBucket } from '../middlewares/upload-middleware.js';

const PASSWORD_RULES = {
    MIN_LENGTH: 8,
    MAX_LENGTH: LIMITES.CONTRASENA_MAX,
    REQUIRE_UPPERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHARACTER: true
};

const ROLES = ['contratador', 'trabajador'];

// rating: number, o null si todavía no tiene reseñas (el front muestra
// "Sin reseñas" en vez de un 0.0 que parece una mala calificación).
const normalizarRating = (w) => ({
    ...w,
    rating: w.rating == null ? null : Number(w.rating),
    reviews: Number(w.reviews ?? 0),
});

// Login y registro devuelven { success: false, errorCode } en los errores del
// usuario: el front muestra un texto por código (y si no lo conoce, el
// "error" que agrega el controller).
const fallo = (errorCode, extra = {}) => ({ success: false, errorCode, ...extra });

export default class UsuariosService {

    constructor() {
        this.repository = new UsuariosRepository();
    }

    #firmarToken(userId, rol) {
        return jwt.sign({ userId, rol }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }

    async login(emailIngresado, password) {

        // Se valida ANTES de consultar la base. typeof: un body con números u
        // objetos no debe terminar en un 500.
        const email = normalizarEmail(emailIngresado);
        if (!email) return fallo('INVALID_EMAIL');

        if (typeof password !== 'string' || !password) return fallo('INVALID_PASSWORD');

        const user = await this.repository.getByEmail(email);
        if (!user) return fallo('EMAIL_NOT_FOUND');

        // Filas viejas (cargadas antes de bcrypt) pueden tener contrasena NULL;
        // bcrypt.compare tira si el hash no es un string, así que se corta antes.
        const passwordOk = !!user.contrasena && await bcrypt.compare(password, user.contrasena);
        if (!passwordOk) return fallo('INVALID_PASSWORD');

        return {
            success: true,
            token: this.#firmarToken(user.id, user.rol),
            userId: user.id,
            rol: user.rol
        };
    }

    // Misma regla que validatePassword() de Register.jsx: si cambia una, cambiar la otra.
    validatePassword(password) {
        const validation = {
            minLength: password.length >= PASSWORD_RULES.MIN_LENGTH,
            uppercase: !PASSWORD_RULES.REQUIRE_UPPERCASE || /[A-Z]/.test(password),
            number: !PASSWORD_RULES.REQUIRE_NUMBER || /[0-9]/.test(password),
            specialCharacter: !PASSWORD_RULES.REQUIRE_SPECIAL_CHARACTER || CARACTER_ESPECIAL_REGEX.test(password),
        };

        return {
            valid: Object.values(validation).every(Boolean),
            rules: validation
        };
    }

    async register(nombre, apellido, emailIngresado, telefono, contrasena, confirmacion, rol) {

        if (!ROLES.includes(rol)) return fallo('INVALID_ROL');

        const nombreOk = typeof nombre === 'string' ? nombre.trim() : '';
        if (!nombreOk || nombreOk.length > LIMITES.NOMBRE) return fallo('INVALID_NOMBRE');

        const apellidoOk = typeof apellido === 'string' ? apellido.trim() : '';
        if (!apellidoOk || apellidoOk.length > LIMITES.NOMBRE) return fallo('INVALID_APELLIDO');

        // Email siempre en minúsculas y sin espacios: así "Ana@x.com" y
        // "ana@x.com" son la misma cuenta.
        const email = normalizarEmail(emailIngresado);
        if (!email) return fallo('INVALID_EMAIL');

        // Se guarda solo con dígitos (lo mismo que exige editarPerfil al guardar).
        const telefonoNormalizado = normalizarTelefono(telefono);
        if (!telefonoNormalizado) return fallo('INVALID_PHONE_LENGTH');

        if (typeof contrasena !== 'string') return fallo('INVALID_PASSWORD');

        if (contrasena.length > PASSWORD_RULES.MAX_LENGTH) return fallo('PASSWORD_TOO_LONG');

        if (contrasena !== confirmacion) return fallo('PASSWORDS_DONT_MATCH');

        const passwordValidation = this.validatePassword(contrasena);
        if (!passwordValidation.valid) {
            return fallo('INVALID_PASSWORD', {
                passwordRequirements: PASSWORD_RULES,
                passwordValidation: passwordValidation.rules
            });
        }

        if (await this.repository.getByEmail(email)) return fallo('EMAIL_ALREADY_EXISTS');

        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        let userId;
        try {
            userId = await this.repository.createUser(
                nombreOk, apellidoOk, email, telefonoNormalizado, contrasenaHash, rol
            );
        } catch (err) {
            // Dos registros simultáneos con el mismo email: lo frena el UNIQUE.
            if (err.code === '23505') return fallo('EMAIL_ALREADY_EXISTS');
            throw err;
        }

        return {
            success: true,
            token: this.#firmarToken(userId, rol),
            userId
        };
    }

    async getUserById(id) {
        return await this.repository.getById(id);
    }

    // Cambia el modo activo (contratador/trabajador) del usuario autenticado.
    async updateUltimoRolAsync(idUsuario, rol) {
        if (!ROLES.includes(rol)) return fallo('INVALID_ROL');

        const usuario = await this.repository.updateUltimoRol(idUsuario, rol);
        if (!usuario) return fallo('USER_NOT_FOUND');

        return { success: true, rol: usuario.rol };
    }

    async getRecommendedWorkersAsync() {
        const workers = await this.repository.getRecommendedWorkers();
        return workers.map(normalizarRating);
    }

    async getPerfil(idUsuario) {
        return await this.repository.getPerfil(idUsuario);
    }

    async updatePerfil(idUsuario, datos) {

        const usuario = await this.repository.getById(idUsuario);
        if (!usuario) return null;

        const nombreCompleto = textoRequerido(datos.nombreCompleto, 'El nombre', LIMITES.NOMBRE_COMPLETO);

        // Se guarda solo con dígitos. Así un teléfono cargado como "11-2345-6789"
        // se puede volver a guardar sin que el front lo rechace.
        const telefono = normalizarTelefono(datos.telefono);
        if (!telefono) throw badRequest('El teléfono debe tener 10 dígitos');

        const idLocalidad = parseOptionalId(datos.idLocalidad, 'idLocalidad') ?? null;

        // El avatar solo puede ser una foto subida por /api/uploads (URL de nuestro
        // bucket). Se acepta además la que ya tenía guardada, para no bloquear el
        // guardado a quien tiene una foto anterior a la migración a Supabase.
        const avatar = datos.avatar || null;
        if (avatar !== null) {
            if (typeof avatar !== 'string' || avatar.length > LIMITES.URL) {
                throw badRequest('La foto de perfil no es válida');
            }
            if (avatar !== usuario.url_avatar && !esUrlDelBucket(avatar)) {
                throw badRequest('La foto de perfil tiene que subirse desde la app');
            }
        }

        // Las biografías son opcionales: vacío o solo espacios se guarda como null.
        return await this.repository.updatePerfil(idUsuario, {
            nombreCompleto,
            telefono,
            idLocalidad,
            avatar,
            biografia_contratante: textoOpcional(datos.biografia_contratante, 'La biografía de contratador', LIMITES.BIOGRAFIA),
            biografia_trabajador: textoOpcional(datos.biografia_trabajador, 'La biografía de trabajador', LIMITES.BIOGRAFIA),
        });
    }

    // Reemplaza el set completo de categorías que ofrece el usuario autenticado.
    async updateCategoriasAsync(idUsuario, categoriaIds) {
        if (!Array.isArray(categoriaIds) || categoriaIds.length > LIMITES.CATEGORIAS_POR_USUARIO) {
            return fallo('INVALID_CATEGORIA_IDS');
        }

        let ids;
        try {
            ids = categoriaIds.map((id) => parseId(id, 'categoría'));
        } catch {
            return fallo('INVALID_CATEGORIA_IDS');
        }

        // Una categoría inexistente hace fallar el INSERT por foreign key: el
        // middleware de errores lo responde como 400.
        await this.repository.setCategorias(idUsuario, ids);
        return { success: true };
    }

    // Trabajadores para la pantalla "Buscar" (categoría / provincia / localidad,
    // todos opcionales pero al menos uno: sin filtros no se lista a todos).
    async searchTrabajadoresAsync(filtros) {
        const { idCategoria, idProvincia, idLocalidad } = filtros;
        if (!idCategoria && !idProvincia && !idLocalidad) {
            return [];
        }
        const workers = await this.repository.searchTrabajadores(filtros);
        return workers.map(normalizarRating);
    }
}
