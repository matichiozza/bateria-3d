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

## Repo

https://github.com/matichiozza/bateria-3d

## Nube (Render) — un clic

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/matichiozza/bateria-3d)

1. Clic en el botón (o [este enlace](https://render.com/deploy?repo=https://github.com/matichiozza/bateria-3d)).
2. Iniciá sesión en Render y conectá GitHub si te lo pide.
3. Confirmá el Blueprint (`render.yaml` crea **web + PostgreSQL**).
4. Esperá el deploy y usá la URL `*.onrender.com`.

Opcional: en cualquier host Node, definí `DATABASE_URL` con una Postgres de Neon o Supabase.
