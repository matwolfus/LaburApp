🔴 Críticos
1. Contraseñas en texto plano

En usuarios-service.js, al registrar: bcrypt.hash(contrasena, 10) antes de pasarlo al repository.
Al hacer login: en vez de user.contrasena !== password, usar bcrypt.compare(password, user.contrasena).
bcryptjs ya está en package.json, solo falta importarlo y usarlo. No requiere migración de datos porque el proyecto es nuevo (si ya hay usuarios cargados con password en texto plano, habría que decidir qué hacer con esos registros existentes).
2. Sin JWT / sesión real

En login, si la contraseña es válida, generar jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' }) y devolverlo en la respuesta.
Agregar JWT_SECRET al .env (nunca hardcodeado en el código).
Completar auth-middleware.js para que lea el header Authorization: Bearer <token>, verifique con jwt.verify, y adjunte req.userId.
En el frontend, guardar el token (en vez del userId plano) y mandarlo en el header de cada request protegida.
3. Rutas sin proteger

Aplicar el middleware de auth a las rutas de trabajos/postulaciones que correspondan en server.js.
En el frontend, crear un PrivateRoute simple que redirija a /login si no hay token válido, y envolver las rutas privadas del AppRouter.
4. DATABASE_URL logueada en consola

Simplemente borrar la línea console.log('DATABASE_URL:', ...) en db-config.js:6. Un cambio de una línea.
5. /home no existe

Definir la ruta /home en AppRouter.jsx (o cambiar el navigate('/home') en Login.jsx/Register.jsx para que apunte a la ruta real, ej. /ofertas, según cuál sea el destino esperado post-login).
🟠 Altos
CORS abierto

Configurar cors({ origin: process.env.FRONTEND_URL }) en vez de cors() sin argumentos.
Rate limiting

Agregar express-rate-limit (nueva dependencia) limitando intentos por IP en /login (ej. 5 intentos cada 15 min) y en /register.
Enumeración de usuarios

Unificar el mensaje de error en login a algo genérico como INVALID_CREDENTIALS tanto si el email no existe como si la contraseña es incorrecta.
Sin try/catch

Envolver las llamadas a repository en controller o service con try/catch, devolviendo un 500 genérico al cliente y logueando el error real solo en el servidor.
Stubs de auth-* sin usar

Decisión de diseño: o se completan esos archivos y se migra la lógica de usuarios-service.js hacia ahí (más prolijo, separa "gestión de usuarios" de "autenticación"), o se borran para no confundir. Te preguntaría cuál preferís antes de tocarlo.
🟡 Menores
Normalizar email a lowercase/trim antes de guardar y comparar (usuarios-repository.js, usuarios-service.js).
Mover la validación de formato de email en login antes de la consulta a la DB (evita queries innecesarias).
ssl: { rejectUnauthorized: false } → si Supabase provee un certificado CA, usarlo correctamente en vez de deshabilitar la verificación; si no es viable ahora, dejarlo documentado como deuda técnica.