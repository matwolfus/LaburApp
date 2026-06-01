import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  await client.connect();

  // 1. Province
  const { rows: [provincia] } = await client.query(
    `INSERT INTO provincias (nombre) VALUES ($1) RETURNING id`,
    ['Buenos Aires']
  );
  console.log('provincia id:', provincia.id);

  // 2. Locality
  const { rows: [localidad] } = await client.query(
    `INSERT INTO localidades (nombre, id_provincia) VALUES ($1, $2) RETURNING id`,
    ['Palermo', provincia.id]
  );
  console.log('localidad id:', localidad.id);

  // 3. Category
  const { rows: [categoria] } = await client.query(
    `INSERT INTO categorias (nombre) VALUES ($1) RETURNING id`,
    ['Mascotas']
  );
  console.log('categoria id:', categoria.id);

  // 4. User
  const { rows: [usuario] } = await client.query(
    `INSERT INTO usuarios (nombre_completo, email, rol, verificado)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    ['Mati', 'mati@test.com', 'contratador', false]
  );
  console.log('usuario id:', usuario.id);

  // 5. Job
  const { rows: [trabajo] } = await client.query(
    `INSERT INTO trabajos (titulo, estado, programado_para, id_contratante, id_categoria, id_localidad)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['Paseador de perros', 'proxima', '2025-06-15 10:00:00', usuario.id, categoria.id, localidad.id]
  );
  console.log('trabajo id:', trabajo.id);

  // 6. Image
  const { rows: [imagen] } = await client.query(
    `INSERT INTO imagenes_trabajo (id_trabajo, url_imagen, orden)
     VALUES ($1, $2, $3) RETURNING id`,
    [trabajo.id, 'https://placehold.co/72x72', 1]
  );
  console.log('imagen id:', imagen.id);

  await client.end();
  console.log('Seed complete.');
}

seed().catch(err => {
  console.error(err);
  client.end();
  process.exit(1);
});
