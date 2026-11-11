import { Router } from 'express';
import UsuariosService from '../services/usuarios-service.js';
import authMiddleware from '../middlewares/auth-middleware.js';
import { idParam } from '../middlewares/error-middleware.js';
import { notFound, parseOptionalId } from '../helpers/http-error.js';

const router = Router();
const service = new UsuariosService();

// Valida :id (entero positivo) en todas las rutas que lo usan.
router.param('id', idParam);

// Login, registro, rol y categorías devuelven { success: false, errorCode }
// cuando el problema es del usuario: el front muestra un texto distinto por
// cada código. Se agrega también "error" para respetar el formato común de
// errores de la API. Los errores del servidor van al middleware central.
const MENSAJES_ERROR = {
    INVALID_EMAIL: 'El email no es válido',
    EMAIL_NOT_FOUND: 'Email o contraseña incorrectos',
    INVALID_PASSWORD: 'La contraseña no es válida',
    PASSWORD_TOO_LONG: 'La contraseña no puede superar los 72 caracteres',
    INVALID_NOMBRE: 'Ingresá tu nombre (hasta 60 caracteres)',
    INVALID_APELLIDO: 'Ingresá tu apellido (hasta 60 caracteres)',
    EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta con ese email',
    INVALID_PHONE_LENGTH: 'El teléfono debe tener 10 dígitos',
    PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
    INVALID_ROL: 'Rol inválido',
    USER_NOT_FOUND: 'Usuario no encontrado',
    INVALID_CATEGORIA_IDS: 'Categorías inválidas',
};

function responderResultado(res, result, statusError, statusOk = 200) {
    if (!result.success) {
        return res.status(statusError).json({
            error: MENSAJES_ERROR[result.errorCode] ?? 'Datos inválidos',
            ...result,
        });
    }
    return res.status(statusOk).json(result);
}

router.post('/login', async (req, res) => {
    const { email, contrasena } = req.body ?? {};
    const result = await service.login(email, contrasena);
    // Credenciales mal: 401. Formato de email mal: 400.
    const status = result.errorCode === 'INVALID_EMAIL' ? 400 : 401;
    return responderResultado(res, result, status);
});

router.post('/register', async (req, res) => {
    const { nombre, apellido, email, telefono, contrasena, confirmacion, rol } = req.body ?? {};
    const result = await service.register(nombre, apellido, email, telefono, contrasena, confirmacion, rol);
    const status = result.errorCode === 'EMAIL_ALREADY_EXISTS' ? 409 : 400;
    return responderResultado(res, result, status, 201);
});

// GET /api/usuarios/recomendados
router.get('/recomendados', async (req, res) => {
    res.json(await service.getRecommendedWorkersAsync());
});

// GET /api/usuarios/me -> el usuario logueado (identidad tomada del token, no de la URL).
// Debe declararse ANTES de '/:id' para que no lo capture la ruta con parámetro.
router.get('/me', authMiddleware, async (req, res) => {
    const perfil = await service.getPerfil(req.userId);
    if (!perfil) throw notFound('Usuario no encontrado');
    res.json(perfil);
});

router.put('/me', authMiddleware, async (req, res) => {
    const perfilActualizado = await service.updatePerfil(req.userId, req.body ?? {});
    if (!perfilActualizado) throw notFound('Usuario no encontrado');
    res.json(perfilActualizado);
});

// PUT /api/usuarios/me/categorias -> reemplaza el set de categorías del usuario logueado.
router.put('/me/categorias', authMiddleware, async (req, res) => {
    const result = await service.updateCategoriasAsync(req.userId, req.body?.categoriaIds);
    return responderResultado(res, result, 400);
});

// PATCH /api/usuarios/me/rol -> cambia el modo activo (contratador/trabajador).
router.patch('/me/rol', authMiddleware, async (req, res) => {
    const result = await service.updateUltimoRolAsync(req.userId, req.body?.rol);
    const status = result.errorCode === 'USER_NOT_FOUND' ? 404 : 400;
    return responderResultado(res, result, status);
});

// GET /api/usuarios/buscar?categoria=&provincia=&localidad= -> trabajadores
// filtrados por oficio y/o zona (todos opcionales, al menos uno).
// Debe declararse ANTES de '/:id' por el mismo motivo que '/me'.
router.get('/buscar', async (req, res) => {
    const workers = await service.searchTrabajadoresAsync({
        idCategoria: parseOptionalId(req.query.categoria, 'categoria'),
        idProvincia: parseOptionalId(req.query.provincia, 'provincia'),
        idLocalidad: parseOptionalId(req.query.localidad, 'localidad'),
    });
    res.json(workers);
});

router.get('/:id/perfil', async (req, res) => {
    const perfil = await service.getPerfil(req.params.id);
    if (!perfil) throw notFound('Usuario no encontrado');
    res.json(perfil);
});

// GET /api/usuarios/:id
router.get('/:id', async (req, res) => {
    const user = await service.getUserById(req.params.id);
    if (!user) throw notFound('Usuario no encontrado');
    res.json(user);
});

export default router;
