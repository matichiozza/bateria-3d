# Batería 3D

App de batería con **frontend** (Web Audio + vista 3D) y **backend** Express.

## Base de datos (prueba de persistencia)

| Entorno | Motor |
|--------|--------|
| Local sin `.env` | JSON en `data/store.json` (en el servidor) |
| Nube con `DATABASE_URL` | PostgreSQL (Render, Neon, Supabase…) |

Cada golpe se guarda con `POST /api/hits`. La app muestra totales y últimos golpes con `GET /api/stats`.

## Local

```bash
npm install
npm start
```

Abrí http://localhost:3000

## Nube (Render)

1. Subí este repo a GitHub.
2. En [Render](https://render.com), **New Blueprint** y elegí `render.yaml` (web + Postgres gratis).
3. Cuando termine el deploy, compartí la URL `.onrender.com` con tu amigo.

Opcional: en cualquier host Node, definí `DATABASE_URL` con una Postgres de Neon o Supabase.
