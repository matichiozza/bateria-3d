import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, "data", "store.json");

const DRUMS = new Set([
  "kick",
  "snare",
  "hihat",
  "tomHigh",
  "tomMid",
  "floor",
  "crash",
  "ride",
]);

let mode = "none";
let pgPool = null;
let fileStore = { hits: [], nextId: 1 };

function loadFileStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(STORE_PATH)) {
    fileStore = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    if (!fileStore.nextId) fileStore.nextId = fileStore.hits.length + 1;
  }
}

function saveFileStore() {
  fs.writeFileSync(STORE_PATH, JSON.stringify(fileStore, null, 2), "utf8");
}

const SCHEMA_PG = `
CREATE TABLE IF NOT EXISTS drum_hits (
  id SERIAL PRIMARY KEY,
  drum VARCHAR(32) NOT NULL,
  client_id VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drum_hits_created ON drum_hits(created_at DESC);
`;

export async function initDb() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: pg } = await import("pg");
    pgPool = new pg.Pool({
      connectionString: url,
      ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
    });
    await pgPool.query(SCHEMA_PG);
    mode = "postgres";
    return mode;
  }

  loadFileStore();
  mode = "file";
  return mode;
}

export function getDbMode() {
  return mode;
}

export function isValidDrum(drum) {
  return DRUMS.has(drum);
}

export async function insertHit(drum, clientId) {
  if (mode === "postgres") {
    const r = await pgPool.query(
      `INSERT INTO drum_hits (drum, client_id) VALUES ($1, $2) RETURNING id, drum, client_id, created_at`,
      [drum, clientId || null]
    );
    return r.rows[0];
  }
  if (mode === "file") {
    const row = {
      id: fileStore.nextId++,
      drum,
      client_id: clientId || null,
      created_at: new Date().toISOString(),
    };
    fileStore.hits.push(row);
    saveFileStore();
    return row;
  }
  throw new Error("DB no inicializada");
}

export async function getStats() {
  const empty = { total: 0, byDrum: {}, recent: [] };
  if (mode === "postgres") {
    const totalR = await pgPool.query(`SELECT COUNT(*)::int AS c FROM drum_hits`);
    const byR = await pgPool.query(
      `SELECT drum, COUNT(*)::int AS c FROM drum_hits GROUP BY drum`
    );
    const recentR = await pgPool.query(
      `SELECT id, drum, client_id, created_at FROM drum_hits ORDER BY created_at DESC LIMIT 15`
    );
    const byDrum = {};
    byR.rows.forEach((row) => {
      byDrum[row.drum] = row.c;
    });
    return {
      total: totalR.rows[0].c,
      byDrum,
      recent: recentR.rows,
    };
  }
  if (mode === "file") {
    const hits = fileStore.hits;
    const byDrum = {};
    hits.forEach((h) => {
      byDrum[h.drum] = (byDrum[h.drum] || 0) + 1;
    });
    const recent = [...hits]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 15);
    return { total: hits.length, byDrum, recent };
  }
  return empty;
}
