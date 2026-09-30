import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "bateria-3d" });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Batería 3D en http://localhost:${port}`);
  });
}

export default app;
