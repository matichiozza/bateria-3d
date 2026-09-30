import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initDb, getDbMode, insertHit, getStats, isValidDrum } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "32kb" }));

app.get("/api/health", async (_req, res) => {
  res.json({
    ok: true,
    app: "bateria-3d",
    db: getDbMode(),
    cloudDb: getDbMode() === "postgres",
  });
});

app.get("/api/stats", async (_req, res) => {
  try {
    const stats = await getStats();
    res.json({
      ...stats,
      db: getDbMode(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudieron leer las estadísticas" });
  }
});

app.post("/api/hits", async (req, res) => {
  const drum = req.body?.drum;
  const clientId = typeof req.body?.clientId === "string" ? req.body.clientId.slice(0, 64) : null;
  if (!isValidDrum(drum)) {
    return res.status(400).json({ error: "Pieza inválida" });
  }
  try {
    const row = await insertHit(drum, clientId);
    res.status(201).json({ hit: row, db: getDbMode() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo guardar el golpe" });
  }
});

app.use(express.static(__dirname));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

async function start() {
  await initDb();
  console.log(
    `Base de datos: ${getDbMode()}${getDbMode() === "postgres" ? " (nube)" : " (local data/store.json)"}`
  );
  if (!process.env.VERCEL) {
    app.listen(port, () => {
      console.log(`Batería 3D en http://localhost:${port}`);
    });
  }
}

start().catch((err) => {
  console.error("Error al iniciar:", err);
  process.exit(1);
});

export default app;
