# LaburApp: frontend

React + Vite. Cómo correrlo, variables de entorno y deploy: ver el
[README de la raíz](../README.md).

```bash
npm install
npm run dev     # http://localhost:5173 (proxea /api al backend en :3000)
npm run build
npm run lint
```

Organización de `src/`:

```
pages/       Pantallas (contratador/, trabajador/, shared/)
components/  Componentes reutilizables
services/    api.js: única forma de llamar al backend (errores y sesión vencida centralizados)
context/     AuthContext: modo activo (contratador / trabajador)
constants/   Constantes del dominio compartidas (estados, tipos de imagen, regex)
utils/       Helpers (fechas, imágenes, íconos de categoría)
```
