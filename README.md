# LaburApp

App para publicar changas y encontrar quién las haga. Un mismo usuario puede
usarla en **modo contratador** (publica trabajos, elige postulantes) o en
**modo trabajador** (busca trabajos, se postula) y cambiar de modo cuando quiera.

```
backend/    API REST en Node + Express, PostgreSQL (Supabase)
frontend/   React + Vite
vercel.json deploy de los dos servicios en Vercel (/api/* -> backend)
```

## Requisitos

- Node.js 20 o más nuevo
- Una base PostgreSQL (el proyecto usa Supabase) y un bucket de Supabase Storage para las fotos

## Cómo correrlo en local

### 1. Backend

```bash
cd backend
npm install
cp .env.template .env   # y completar los valores (ver abajo)
npm run dev             # http://localhost:3000
```

Variables de `backend/.env`:

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Postgres (en Supabase: Settings → Database → Connection string, modo pooler) |
| `PORT` | Puerto del backend (por defecto 3000) |
| `SUPABASE_URL` | URL del proyecto de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta de Supabase (Settings → API keys → secret key). Nunca al front ni al repo |
| `SUPABASE_STORAGE_BUCKET` | Bucket donde se suben las fotos |
| `JWT_SECRET` | **Obligatoria.** Clave para firmar las sesiones. Sin ella el backend no arranca |

Para generar un `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.template .env   # opcional, ver abajo
npm run dev             # http://localhost:5173
```

En desarrollo Vite redirige `/api` al backend en `localhost:3000`, así que no
hace falta configurar nada. Variables opcionales de `frontend/.env`:

| Variable | Para qué |
|---|---|
| `VITE_API_URL` | URL del backend si no está en el mismo dominio (por defecto `/api`) |
| `VITE_NOMINATIM_EMAIL` | Email de contacto para el geocodificador de OpenStreetMap |

## Base de datos y migraciones

Los scripts están en [`backend/db/`](backend/db). No hay herramienta de
migraciones: se corren **a mano** en el SQL Editor de Supabase (pegar el
contenido completo del archivo y ejecutar), en este orden:

| Archivo | Qué hace | Se puede repetir |
|---|---|---|
| `seed-localidades-caba.sql` | Carga los barrios de CABA | Sí |
| `migracion-corregir.sql` | Provincias, reconfirmación de postulaciones, chat por postulación | Sí |
| `migracion-fechas-argentina.sql` | Fechas automáticas en hora argentina (defaults y datos existentes). **Correr junto con el deploy del backend que usa `AHORA`** | Sí (tiene guarda: no convierte dos veces) |
| `migracion-p3-dominio.sql` | CHECK de estado y prioridad de los trabajos, precio en postulaciones viejas | Sí |

## Deploy (Vercel)

El `vercel.json` de la raíz despliega los dos servicios en el mismo dominio:
`/api/*` va al backend y el resto al frontend. En el proyecto de Vercel hay que
cargar las mismas variables que el `backend/.env` (**incluida `JWT_SECRET`**).

## Cómo está organizado el backend

```
src/
  controllers/   Solo HTTP: leen la request, llaman al servicio, responden
  services/      Reglas de negocio: permisos, estados, transacciones, avisos
  repositories/  SQL. Cada repositorio escribe solo su tabla
  domain/        Estados y transiciones permitidas, reglas de fechas
  helpers/       Errores HTTP (HttpError), validaciones de entrada
  middlewares/   Auth (JWT), subida de fotos, manejo central de errores
```

- Los errores siempre se responden como `{ "error": "mensaje" }`. Los servicios
  tiran `HttpError` (400, 403, 404, 409) y el middleware central responde; un
  error inesperado se loguea y llega al cliente como un 500 genérico.
- Las fechas se guardan en hora argentina sin zona horaria: usar `AHORA`
  (`repositories/sql-fechas.js`) en vez de `NOW()`.
- Los estados válidos y sus transiciones están en `domain/estados.js`.

## Vocabulario

Para que la app y el código hablen igual:

| Usar | En vez de | Qué es |
|---|---|---|
| **trabajo** | tarea, changa, oferta | Lo que publica un contratador. "Ofertas" es solo el nombre de la sección donde el contratador ve los suyos |
| **contratador** | contratante, employer | El que publica trabajos y elige postulantes |
| **trabajador** | | El que se postula |
| **postulación** | | Un trabajador ofreciéndose para un trabajo (con su precio) |
| **contrato** | | Se crea al aceptar una postulación |

Excepciones por compatibilidad: algunos nombres de la base y de la API usan
otros términos y no se renombraron para no romper datos ni el front:
`id_contratante`, `es_contratante`, `biografia_contratante`, `employer_*` en el
detalle de un trabajo. También los estados: un trabajo con trabajador
aceptado está `activa` y su contrato `activo` (ver `domain/estados.js`).
